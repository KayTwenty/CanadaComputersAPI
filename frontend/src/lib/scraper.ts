/**
 * scraper.ts — HTTP fetching with polite rate limiting + HTML parsing via cheerio.
 *
 * Design mirrors the Python scraper.py:
 *  - AsyncSemaphore caps concurrent outbound requests to CC at 2
 *  - Exponential backoff with jitter on failure (up to 4 retries)
 *  - Polite pre-fetch delay (1.5-3s normal, 0.8-1.5s "fast" for store-filtered)
 *  - Full browser headers to avoid bot detection
 */
import { load } from 'cheerio';
import { ProxyAgent } from 'undici';
import type { Product } from './cache';
import { proxyRotator } from './proxies';

// ── Concurrency semaphore ─────────────────────────────────────────────────────
class AsyncSemaphore {
    private permits: number;
    private queue: Array<() => void> = [];
    constructor(n: number) { this.permits = n; }
    acquire(): Promise<void> {
        if (this.permits > 0) { this.permits--; return Promise.resolve(); }
        return new Promise(r => this.queue.push(r));
    }
    release(): void {
        const next = this.queue.shift();
        if (next) next(); else this.permits++;
    }
}

const fetchSem = new AsyncSemaphore(2);

// ── Constants ─────────────────────────────────────────────────────────────────
export const MAX_PAGES = 10;
export const DESKTOP_ITEM_CODE_RE = /^(RT|DT)/i;

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const rand  = (min: number, max: number) => min + Math.random() * (max - min);

// ── HTTP fetch with retry ─────────────────────────────────────────────────────
export async function fetchPage(url: string, fast = false, retries = 4): Promise<string> {
    await sleep(fast ? rand(800, 1500) : rand(1500, 3000));

    const headers: Record<string, string> = {
        'User-Agent':                USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        'Accept':                    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language':           'en-CA,en;q=0.9',
        'Accept-Encoding':           'gzip, deflate, br',
        'DNT':                       '1',
        'Sec-Fetch-Dest':            'document',
        'Sec-Fetch-Mode':            'navigate',
        'Sec-Fetch-Site':            'none',
        'Sec-Fetch-User':            '?1',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control':             'max-age=0',
    };

    let lastError: Error = new Error('unknown');

    for (let attempt = 1; attempt <= retries; attempt++) {
        const proxyUrl = proxyRotator.size > 0 ? proxyRotator.next() : null;

        await fetchSem.acquire();
        try {
            const ctrl  = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), proxyUrl ? 12_000 : 20_000);
            try {
                const init: RequestInit & { dispatcher?: unknown } = {
                    headers,
                    signal: ctrl.signal,
                };
                if (proxyUrl) {
                    init.dispatcher = new ProxyAgent(proxyUrl);
                }
                const res = await fetch(url, init as RequestInit);
                if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
                const text = await res.text();
                if (proxyUrl) proxyRotator.markSuccess(proxyUrl);
                return text;
            } finally {
                clearTimeout(timer);
            }
        } catch (e: unknown) {
            lastError = e instanceof Error ? e : new Error(String(e));
            if (proxyUrl) proxyRotator.markFailure(proxyUrl);
        } finally {
            fetchSem.release();
        }

        if (attempt < retries) {
            const backoff = (2 ** attempt + rand(1, 3)) * 1000;
            const via = proxyUrl ? ` via ${proxyUrl.replace(new RegExp('://[^@]+@'), '://***@')}` : '';
            console.log(`[deals] fetch_page attempt ${attempt} failed${via} (${lastError.message}). Retrying in ${(backoff / 1000).toFixed(1)}s...`);
            await sleep(backoff);
        }
    }

    throw lastError;
}

// ── HTML parsing ──────────────────────────────────────────────────────────────
export function parsePage(
    html: string,
    storeId: number | null,
    onSaleOnly: boolean,
    extraFields?: Partial<Product>,
): Product[] {
    const $ = load(html);
    const results: Product[] = [];

    $('article.product-miniature').each((_, el) => {
        const $el   = $(el);
        const thumb = $el.find('a.product-thumbnail');
        const itemCode = thumb.attr('data-id') ?? '';

        const descDiv = $el.find('div.product-description');
        if (!descDiv.length) return;

        const price        = descDiv.attr('data-price') ?? 'N/A';
        const regularPrice = descDiv.attr('data-regular_price') ?? price;

        if (onSaleOnly && price === regularPrice) return;

        const aTag = $el.find('h2.product-title a');
        if (!aTag.length) return;

        const title = aTag.text().trim();
        const link  = aTag.attr('href') ?? '';

        let onlineAvail  = 'unknown';
        let instoreAvail = 'unknown';
        const availDiv   = $el.find('div.available-tag');
        if (availDiv.length) {
            const smalls = availDiv.find('small.pq-hdr-bolder');
            onlineAvail  = $(smalls[0]).text().trim() || 'unknown';
            instoreAvail = $(smalls[1]).text().trim() || 'unknown';
        }

        if (storeId !== null) {
            const il = instoreAvail.toLowerCase();
            if (il.includes('not available') || il === 'unknown') return;
        }

        const img      = thumb.find('img');
        const imageUrl = img.attr('data-cc-src') ?? img.attr('src') ?? '';

        results.push({
            title, price, regular_price: regularPrice,
            item_code: itemCode,
            online_availability: onlineAvail,
            instore_availability: instoreAvail,
            link, image_url: imageUrl,
            ...extraFields,
        });
    });

    return results;
}

// ── Sort helper ───────────────────────────────────────────────────────────────
export function savingsDollars(p: Product): number {
    try {
        return (
            parseFloat(p.regular_price.replace(/[$,]/g, '')) -
            parseFloat(p.price.replace(/[$,]/g, ''))
        );
    } catch { return 0; }
}

// ── Generic paginated scraper ─────────────────────────────────────────────────
export async function scrapeAllPages(
    baseUrl: string,
    storeId: number | null,
    onSaleOnly: boolean,
    extraFields?: Partial<Product>,
    filterFn?: (p: Product) => boolean,
): Promise<Product[]> {
    const all: Product[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
        let url = `${baseUrl}?page=${page}`;
        if (storeId !== null) url += `&pickup=${storeId}`;
        console.log(url);

        let html: string;
        try { html = await fetchPage(url, storeId !== null); }
        catch { break; }

        const batch = parsePage(html, storeId, onSaleOnly, extraFields);
        const filtered = filterFn ? batch.filter(filterFn) : batch;
        if (!filtered.length && !batch.length) break; // empty page = end of category
        all.push(...filtered);
    }
    all.sort((a, b) => savingsDollars(b) - savingsDollars(a));
    return all;
}

// ── Product search ────────────────────────────────────────────────────────────
export async function productSearch(
    query: string,
    priceMin?: string | null,
    priceMax?: string | null,
): Promise<Product[]> {
    const results: Product[] = [];
    const lo = priceMin ? parseFloat(priceMin) : null;
    const hi = priceMax ? parseFloat(priceMax) : null;

    for (let page = 1; page <= MAX_PAGES; page++) {
        const url = `https://www.canadacomputers.com/en/search?s=${encodeURIComponent(query)}&page=${page}`;
        console.log(url);

        let html: string;
        try { html = await fetchPage(url); }
        catch { break; }

        const $ = load(html);
        const articles = $('article.product-miniature');
        if (!articles.length) break;

        articles.each((_, el) => {
            const $el     = $(el);
            const aTag    = $el.find('h2.product-title a');
            if (!aTag.length) return;
            const title   = aTag.text().trim();
            const link    = aTag.attr('href') ?? '';
            const desc    = $el.find('div.product-description');
            const price   = desc.attr('data-price') ?? 'N/A';
            const thumb   = $el.find('a.product-thumbnail');
            const itemCode = thumb.attr('data-id') ?? 'No Code';
            const avail   = $el.find('div.available-tag');
            let onlineAvail  = 'unknown';
            let instoreAvail = 'unknown';
            if (avail.length) {
                const smalls = avail.find('small.pq-hdr-bolder');
                onlineAvail  = $(smalls[0]).text().trim() || 'unknown';
                instoreAvail = $(smalls[1]).text().trim() || 'unknown';
            }
            if (lo !== null && hi !== null) {
                const pv = parseFloat(price.replace(/[$,]/g, ''));
                if (!isNaN(pv) && !(lo <= pv && pv <= hi)) return;
            }
            results.push({
                title, price, regular_price: price,
                item_code: itemCode,
                online_availability: onlineAvail,
                instore_availability: instoreAvail,
                link, image_url: '',
            });
        });
    }
    return results;
}
