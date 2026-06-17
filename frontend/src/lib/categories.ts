/**
 * categories.ts — Per-category scrapers, streaming async generators,
 *                 stale-while-revalidate helpers, and the background warm-up loop.
 */
import { load } from 'cheerio';
import {
    cacheGet, cacheGetWithAge, cacheSet,
    isScrapingInProgress, markInProgress, markDone,
    ALL_STORES_KEY, MEMORY_CACHE_KEY, CPU_CACHE_KEY, GPU_CACHE_KEY,
    LAPTOP_CACHE_KEY, MOTHERBOARD_CACHE_KEY, PSU_CACHE_KEY,
    SSD_CACHE_KEY, HDD_CACHE_KEY, DRIVES_CACHE_KEY,
    COOLERS_CACHE_KEY, CASES_CACHE_KEY,
    CACHE_TTL, PROACTIVE_TTL, VALID_STORE_IDS,
    type Product,
} from './cache';
import {
    fetchPage, parsePage, scrapeAllPages, savingsDollars,
    MAX_PAGES, DESKTOP_ITEM_CODE_RE,
} from './scraper';

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ── URL maps ──────────────────────────────────────────────────────────────────
const LAPTOP_URLS: [string, string][] = [
    ['https://www.canadacomputers.com/en/98/windows-laptops',      'Windows'],
    ['https://www.canadacomputers.com/en/93/business-laptops',     'Business'],
    ['https://www.canadacomputers.com/en/103/gaming-laptops',      'Gaming'],
    ['https://www.canadacomputers.com/en/102/refurbished-laptops', 'Refurbished'],
];
const DRIVES_URLS: [string, string][] = [
    ['https://www.canadacomputers.com/en/1291/desktop-laptop-internal-ssds', 'SSD'],
    ['https://www.canadacomputers.com/en/895/desktop-internal-hard-drives',  'HDD'],
];
const COOLERS_URLS: [string, string][] = [
    ['https://www.canadacomputers.com/en/928/cpu-air-coolers',        'Air'],
    ['https://www.canadacomputers.com/en/930/aio-cpu-liquid-coolers', 'Liquid'],
    ['https://www.canadacomputers.com/en/927/case-fans',              'Case Fan'],
];
const CASES_URLS: [string, string][] = [
    ['https://www.canadacomputers.com/en/1389/mid-tower-cases',                  'Mid Tower'],
    ['https://www.canadacomputers.com/en/1388/full-tower-cases',                 'Full Tower'],
    ['https://www.canadacomputers.com/en/1387/small-form-factor-mini-itx-cases', 'ITX/mATX'],
];

// ── Single-URL scrapers ───────────────────────────────────────────────────────
const SIMPLE_URLS: Record<string, string> = {
    memory:       'https://www.canadacomputers.com/en/1009/memory',
    cpu:          'https://www.canadacomputers.com/en/956/cpu',
    gpu:          'https://www.canadacomputers.com/en/914/graphics-cards',
    motherboards: 'https://www.canadacomputers.com/en/53/motherboards',
    psu:          'https://www.canadacomputers.com/en/1346/power-supplies',
    ssd:          'https://www.canadacomputers.com/en/1291/desktop-laptop-internal-ssds',
    hdd:          'https://www.canadacomputers.com/en/895/desktop-internal-hard-drives',
};

async function simpleDeals(baseUrl: string, storeId: number | null): Promise<Product[]> {
    return scrapeAllPages(baseUrl, storeId, true);
}

async function desktopDeals(storeId: number | null): Promise<Product[]> {
    return scrapeAllPages(
        'https://www.canadacomputers.com/en/931/desktop-computers',
        storeId, true, undefined,
        p => DESKTOP_ITEM_CODE_RE.test(p.item_code),
    );
}

async function multiUrlDeals(
    urls: [string, string][],
    typeField: keyof Product,
    storeId: number | null,
): Promise<Product[]> {
    const combined: Product[] = [];
    for (const [url, typeValue] of urls) {
        const products = await scrapeAllPages(url, storeId, true, { [typeField]: typeValue } as Partial<Product>);
        combined.push(...products);
    }
    combined.sort((a, b) => savingsDollars(b) - savingsDollars(a));
    return combined;
}

// ── SWR background refresh ────────────────────────────────────────────────────
export async function bgRefresh(
    cacheKey: string,
    scrapeFunc: () => Promise<Product[]>,
    label: string,
): Promise<void> {
    // Re-check inside the async path — if still fresh, skip
    if (isScrapingInProgress(cacheKey)) return;
    const cached = cacheGet(cacheKey, PROACTIVE_TTL);
    if (cached) return;

    markInProgress(cacheKey); // atomic: no await before this from the check above
    try {
        console.log(`[${label}] Background refresh starting...`);
        const products = await scrapeFunc();
        if (products.length > 0) {
            cacheSet(cacheKey, products);
            console.log(`[${label}] Done. ${products.length} items cached.`);
        } else {
            console.log(`[${label}] Warning: returned 0 items — keeping old cache.`);
        }
    } catch (e) {
        console.error(`[${label}] Background refresh failed:`, e);
    } finally {
        markDone(cacheKey);
    }
}

function triggerBgRefresh(cacheKey: string, scrapeFunc: () => Promise<Product[]>, label: string): void {
    bgRefresh(cacheKey, scrapeFunc, label).catch(() => {});
}

// ── Streaming generators ──────────────────────────────────────────────────────

/** Generic single-URL streaming generator with SWR. */
async function* streamSimpleGen(
    baseUrl: string,
    storeId: number | null,
    storeKey: string,
    globalKey: string,
    scrapeFunc: () => Promise<Product[]>,
    label: string,
    onSaleOnly: boolean,
): AsyncGenerator<Product[]> {
    const sk = onSaleOnly ? storeKey : `full_${storeKey}`;
    const gk = onSaleOnly ? globalKey : `full_${globalKey}`;

    const [cached, age] = cacheGetWithAge(sk);
    if (cached) {
        if (age !== null && age >= PROACTIVE_TTL) {
            triggerBgRefresh(sk, scrapeFunc, label);
        }
        yield cached;
        return;
    }

    // Per-store cold miss: serve global cache instantly, refresh per-store in background
    if (storeId !== null) {
        const [globalCache] = cacheGetWithAge(gk);
        if (globalCache) {
            triggerBgRefresh(sk, scrapeFunc, label);
            yield globalCache;
            return;
        }
    }

    // True cold miss — scrape live
    const all: Product[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
        let url = `${baseUrl}?page=${page}`;
        if (storeId !== null) url += `&pickup=${storeId}`;
        console.log(url);

        let html: string;
        try { html = await fetchPage(url, storeId !== null); }
        catch { break; }

        const batch = parsePage(html, storeId, onSaleOnly);
        // empty batch on a non-empty page = no on-sale items this page, keep going
        // no articles at all = end of pagination
        const $ = load(html);
        if (!$('article.product-miniature').length) break;
        if (batch.length) {
            all.push(...batch);
            yield batch;
        }
    }

    if (all.length > 0) {
        cacheSet(sk, all);
    } else if (storeId !== null) {
        const [fallback] = cacheGetWithAge(gk);
        if (fallback) yield fallback;
    }
}

/** Desktop streaming generator (RT/DT filter). */
async function* streamDesktopGen(
    storeId: number | null,
    onSaleOnly: boolean,
): AsyncGenerator<Product[]> {
    const baseKey = storeId === null ? ALL_STORES_KEY : String(storeId);
    const sk = onSaleOnly ? baseKey : `full_${baseKey}`;
    const gk = onSaleOnly ? ALL_STORES_KEY : `full_${ALL_STORES_KEY}`;

    const [cached, age] = cacheGetWithAge(sk);
    if (cached) {
        if (age !== null && age >= PROACTIVE_TTL) {
            triggerBgRefresh(sk, () => desktopDeals(storeId), `desktops/${sk}`);
        }
        yield cached;
        return;
    }

    // Per-store cold miss: serve global cache instantly, refresh per-store in background
    if (storeId !== null) {
        const [globalCache] = cacheGetWithAge(gk);
        if (globalCache) {
            triggerBgRefresh(sk, () => desktopDeals(storeId), `desktops/${sk}`);
            yield globalCache;
            return;
        }
    }

    // True cold miss — scrape live
    const all: Product[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
        let url = `https://www.canadacomputers.com/en/931/desktop-computers?page=${page}`;
        if (storeId !== null) url += `&pickup=${storeId}`;
        console.log(url);

        let html: string;
        try { html = await fetchPage(url, storeId !== null); }
        catch { break; }

        const $ = load(html);
        if (!$('article.product-miniature').length) break;

        const batch = parsePage(html, storeId, onSaleOnly).filter(
            p => DESKTOP_ITEM_CODE_RE.test(p.item_code)
        );
        if (batch.length) {
            all.push(...batch);
            yield batch;
        }
    }

    if (all.length > 0) {
        cacheSet(sk, all);
    } else if (storeId !== null) {
        const [fallback] = cacheGetWithAge(gk);
        if (fallback) yield fallback;
    }
}

/** Multi-URL streaming generator (laptops, drives, coolers, cases). */
async function* streamMultiUrlGen(
    urls: [string, string][],
    typeField: keyof Product,
    storeId: number | null,
    cacheKey: string,
    storeKeyPrefix: string,
    scrapeFunc: () => Promise<Product[]>,
    onSaleOnly: boolean,
): AsyncGenerator<Product[]> {
    const baseKey = storeId === null ? cacheKey : `${storeKeyPrefix}${storeId}`;
    const sk = onSaleOnly ? baseKey : `full_${baseKey}`;
    const gk = onSaleOnly ? cacheKey : `full_${cacheKey}`;

    const [cached, age] = cacheGetWithAge(sk);
    if (cached) {
        if (age !== null && age >= PROACTIVE_TTL) {
            triggerBgRefresh(sk, scrapeFunc, `${storeKeyPrefix}${sk}`);
        }
        yield cached;
        return;
    }

    // Per-store cold miss: serve global cache instantly, refresh per-store in background
    if (storeId !== null) {
        const [globalCache] = cacheGetWithAge(gk);
        if (globalCache) {
            triggerBgRefresh(sk, scrapeFunc, `${storeKeyPrefix}${sk}`);
            yield globalCache;
            return;
        }
    }

    // True cold miss — scrape live
    const all: Product[] = [];
    for (const [baseUrl, typeValue] of urls) {
        for (let page = 1; page <= MAX_PAGES; page++) {
            let url = `${baseUrl}?page=${page}`;
            if (storeId !== null) url += `&pickup=${storeId}`;
            console.log(url);

            let html: string;
            try { html = await fetchPage(url, storeId !== null); }
            catch { break; }

            const $ = load(html);
            if (!$('article.product-miniature').length) break;

            const batch = parsePage(html, storeId, onSaleOnly, { [typeField]: typeValue } as Partial<Product>);
            if (batch.length) {
                all.push(...batch);
                yield batch;
            }
        }
    }

    if (all.length > 0) {
        cacheSet(sk, all);
    } else if (storeId !== null) {
        const [fallback] = cacheGetWithAge(gk);
        if (fallback) yield fallback;
    }
}

// ── Public stream entry point ─────────────────────────────────────────────────
export function streamCategoryGen(
    category: string,
    storeId: number | null,
    onSaleOnly = true,
): AsyncGenerator<Product[]> {
    switch (category) {
        case 'desktops':
            return streamDesktopGen(storeId, onSaleOnly);

        case 'laptops':
            return streamMultiUrlGen(
                LAPTOP_URLS, 'laptop_type', storeId,
                LAPTOP_CACHE_KEY, 'lap_',
                () => multiUrlDeals(LAPTOP_URLS, 'laptop_type', storeId),
                onSaleOnly,
            );

        case 'drives':
            return streamMultiUrlGen(
                DRIVES_URLS, 'drive_type', storeId,
                DRIVES_CACHE_KEY, 'drv_',
                () => multiUrlDeals(DRIVES_URLS, 'drive_type', storeId),
                onSaleOnly,
            );

        case 'coolers':
            return streamMultiUrlGen(
                COOLERS_URLS, 'cooler_type', storeId,
                COOLERS_CACHE_KEY, 'clr_',
                () => multiUrlDeals(COOLERS_URLS, 'cooler_type', storeId),
                onSaleOnly,
            );

        case 'cases':
            return streamMultiUrlGen(
                CASES_URLS, 'case_type', storeId,
                CASES_CACHE_KEY, 'cas_',
                () => multiUrlDeals(CASES_URLS, 'case_type', storeId),
                onSaleOnly,
            );

        default: {
            // memory, cpu, gpu, motherboards, psu, ssd, hdd
            const catKeys: Record<string, string> = {
                memory: MEMORY_CACHE_KEY, cpu: CPU_CACHE_KEY,
                gpu: GPU_CACHE_KEY, motherboards: MOTHERBOARD_CACHE_KEY,
                psu: PSU_CACHE_KEY, ssd: SSD_CACHE_KEY, hdd: HDD_CACHE_KEY,
            };
            const catPrefixes: Record<string, string> = {
                memory: 'mem_', cpu: 'cpu_', gpu: 'gpu_',
                motherboards: 'mob_', psu: 'psu_', ssd: 'ssd_', hdd: 'hdd_',
            };
            const url  = SIMPLE_URLS[category];
            const gKey = catKeys[category];
            const pfx  = catPrefixes[category];
            const sk   = storeId === null ? gKey : `${pfx}${storeId}`;
            return streamSimpleGen(
                url, storeId, sk, gKey,
                () => simpleDeals(url, storeId),
                `${category}/${sk}`,
                onSaleOnly,
            );
        }
    }
}

// ── Cached getters (non-streaming) ────────────────────────────────────────────
async function getOrScrape(
    globalKey: string,
    storeKey: string,
    scrapeFunc: () => Promise<Product[]>,
    label: string,
    storeId: number | null,
): Promise<{ products: Product[] }> {
    const [stale, age] = cacheGetWithAge(storeKey);
    if (stale) {
        if (age !== null && age >= PROACTIVE_TTL) {
            triggerBgRefresh(storeKey, scrapeFunc, label);
        }
        return { products: stale };
    }

    if (isScrapingInProgress(storeKey)) {
        // Wait for the in-progress scrape to finish (poll)
        for (let i = 0; i < 60; i++) {
            await sleep(1000);
            const [p] = cacheGetWithAge(storeKey);
            if (p) return { products: p };
        }
    }

    markInProgress(storeKey);
    try {
        const products = await scrapeFunc();
        if (products.length > 0) {
            cacheSet(storeKey, products);
            return { products };
        }
        if (storeId !== null) {
            const [fallback] = cacheGetWithAge(globalKey);
            if (fallback) return { products: fallback };
        }
        return { products };
    } finally {
        markDone(storeKey);
    }
}

export function getDesktopDeals(storeId: number | null) {
    const sk = storeId === null ? ALL_STORES_KEY : String(storeId);
    return getOrScrape(ALL_STORES_KEY, sk, () => desktopDeals(storeId), `desktops/${sk}`, storeId);
}
export function getMemoryDeals(storeId: number | null) {
    const sk = storeId === null ? MEMORY_CACHE_KEY : `mem_${storeId}`;
    return getOrScrape(MEMORY_CACHE_KEY, sk, () => simpleDeals(SIMPLE_URLS.memory, storeId), `memory/${sk}`, storeId);
}
export function getCpuDeals(storeId: number | null) {
    const sk = storeId === null ? CPU_CACHE_KEY : `cpu_${storeId}`;
    return getOrScrape(CPU_CACHE_KEY, sk, () => simpleDeals(SIMPLE_URLS.cpu, storeId), `cpu/${sk}`, storeId);
}
export function getGpuDeals(storeId: number | null) {
    const sk = storeId === null ? GPU_CACHE_KEY : `gpu_${storeId}`;
    return getOrScrape(GPU_CACHE_KEY, sk, () => simpleDeals(SIMPLE_URLS.gpu, storeId), `gpu/${sk}`, storeId);
}
export function getLaptopDeals(storeId: number | null) {
    const sk = storeId === null ? LAPTOP_CACHE_KEY : `lap_${storeId}`;
    return getOrScrape(LAPTOP_CACHE_KEY, sk, () => multiUrlDeals(LAPTOP_URLS, 'laptop_type', storeId), `laptops/${sk}`, storeId);
}
export function getMotherboardDeals(storeId: number | null) {
    const sk = storeId === null ? MOTHERBOARD_CACHE_KEY : `mob_${storeId}`;
    return getOrScrape(MOTHERBOARD_CACHE_KEY, sk, () => simpleDeals(SIMPLE_URLS.motherboards, storeId), `motherboards/${sk}`, storeId);
}
export function getPsuDeals(storeId: number | null) {
    const sk = storeId === null ? PSU_CACHE_KEY : `psu_${storeId}`;
    return getOrScrape(PSU_CACHE_KEY, sk, () => simpleDeals(SIMPLE_URLS.psu, storeId), `psu/${sk}`, storeId);
}
export function getSsdDeals(storeId: number | null) {
    const sk = storeId === null ? SSD_CACHE_KEY : `ssd_${storeId}`;
    return getOrScrape(SSD_CACHE_KEY, sk, () => simpleDeals(SIMPLE_URLS.ssd, storeId), `ssd/${sk}`, storeId);
}
export function getHddDeals(storeId: number | null) {
    const sk = storeId === null ? HDD_CACHE_KEY : `hdd_${storeId}`;
    return getOrScrape(HDD_CACHE_KEY, sk, () => simpleDeals(SIMPLE_URLS.hdd, storeId), `hdd/${sk}`, storeId);
}
export function getDrivesDeals(storeId: number | null) {
    const sk = storeId === null ? DRIVES_CACHE_KEY : `drv_${storeId}`;
    return getOrScrape(DRIVES_CACHE_KEY, sk, () => multiUrlDeals(DRIVES_URLS, 'drive_type', storeId), `drives/${sk}`, storeId);
}
export function getCoolersDeals(storeId: number | null) {
    const sk = storeId === null ? COOLERS_CACHE_KEY : `clr_${storeId}`;
    return getOrScrape(COOLERS_CACHE_KEY, sk, () => multiUrlDeals(COOLERS_URLS, 'cooler_type', storeId), `coolers/${sk}`, storeId);
}
export function getCasesDeals(storeId: number | null) {
    const sk = storeId === null ? CASES_CACHE_KEY : `cas_${storeId}`;
    return getOrScrape(CASES_CACHE_KEY, sk, () => multiUrlDeals(CASES_URLS, 'case_type', storeId), `cases/${sk}`, storeId);
}

// ── Background warm-up loop ───────────────────────────────────────────────────
interface RefreshJob {
    key: string;
    fn:  () => Promise<Product[]>;
    label: string;
}

const JOBS: RefreshJob[] = [
    { key: ALL_STORES_KEY,        fn: () => desktopDeals(null),                             label: 'desktops' },
    { key: MEMORY_CACHE_KEY,      fn: () => simpleDeals(SIMPLE_URLS.memory, null),          label: 'memory' },
    { key: CPU_CACHE_KEY,         fn: () => simpleDeals(SIMPLE_URLS.cpu, null),             label: 'cpu' },
    { key: GPU_CACHE_KEY,         fn: () => simpleDeals(SIMPLE_URLS.gpu, null),             label: 'gpu' },
    { key: LAPTOP_CACHE_KEY,      fn: () => multiUrlDeals(LAPTOP_URLS, 'laptop_type', null), label: 'laptops' },
    { key: MOTHERBOARD_CACHE_KEY, fn: () => simpleDeals(SIMPLE_URLS.motherboards, null),    label: 'motherboards' },
    { key: PSU_CACHE_KEY,         fn: () => simpleDeals(SIMPLE_URLS.psu, null),             label: 'psu' },
    { key: SSD_CACHE_KEY,         fn: () => simpleDeals(SIMPLE_URLS.ssd, null),             label: 'ssd' },
    { key: HDD_CACHE_KEY,         fn: () => simpleDeals(SIMPLE_URLS.hdd, null),             label: 'hdd' },
    { key: DRIVES_CACHE_KEY,      fn: () => multiUrlDeals(DRIVES_URLS, 'drive_type', null), label: 'drives' },
    { key: COOLERS_CACHE_KEY,     fn: () => multiUrlDeals(COOLERS_URLS, 'cooler_type', null), label: 'coolers' },
    { key: CASES_CACHE_KEY,       fn: () => multiUrlDeals(CASES_URLS, 'case_type', null),   label: 'cases' },
];

async function refreshStale(): Promise<void> {
    for (const { key, fn, label } of JOBS) {
        const [, age] = cacheGetWithAge(key);
        if (age === null || age >= PROACTIVE_TTL) {
            bgRefresh(key, fn, label).catch(() => {});
        }
    }
}

async function warmUp(): Promise<void> {
    console.log('[deals] Startup: warming all global caches...');
    // Fire all refreshes concurrently; the fetchSem limits actual HTTP to 2 at a time.
    await Promise.allSettled(JOBS.map(({ key, fn, label }) => bgRefresh(key, fn, label)));
    console.log('[deals] Startup warm-up complete.');

    // Pre-load store locations (desktop only) — stagger to avoid thundering herd
    const uncached = [...VALID_STORE_IDS].filter(id => cacheGet(String(id), CACHE_TTL) === null);
    if (uncached.length > 0) {
        console.log(`[deals] Pre-loading ${uncached.length} store location(s)...`);
        for (const storeId of uncached) {
            await bgRefresh(String(storeId), () => desktopDeals(storeId), `desktops/${storeId}`);
            await sleep(2000); // gentle pacing between stores
        }
        console.log('[deals] Store pre-load complete.');
    }
}

export function startBackgroundRefresh(): void {
    // Warm up caches at startup (non-blocking)
    warmUp().catch(console.error);
    // Every 60s proactively refresh anything older than 80% of TTL
    setInterval(() => { refreshStale().catch(console.error); }, 60_000);
}
