/**
 * cache.ts — SQLite-backed SWR cache, rate limiting, and price history.
 *
 * All functions are synchronous (better-sqlite3) except those that trigger
 * async background scrapes via Promise chains.
 */
import { getDb } from './db';

// ── Cache keys ────────────────────────────────────────────────────────────────
export const ALL_STORES_KEY        = '__all__';
export const MEMORY_CACHE_KEY      = '__memory__';
export const CPU_CACHE_KEY         = '__cpu__';
export const GPU_CACHE_KEY         = '__gpu__';
export const LAPTOP_CACHE_KEY      = '__laptops__';
export const MOTHERBOARD_CACHE_KEY = '__motherboards__';
export const PSU_CACHE_KEY         = '__psu__';
export const SSD_CACHE_KEY         = '__ssd__';
export const HDD_CACHE_KEY         = '__hdd__';
export const DRIVES_CACHE_KEY      = '__drives__';
export const COOLERS_CACHE_KEY     = '__coolers__';
export const CASES_CACHE_KEY       = '__cases__';

export const GLOBAL_KEYS = [
    ALL_STORES_KEY, MEMORY_CACHE_KEY, CPU_CACHE_KEY, GPU_CACHE_KEY,
    LAPTOP_CACHE_KEY, MOTHERBOARD_CACHE_KEY, PSU_CACHE_KEY,
    SSD_CACHE_KEY, HDD_CACHE_KEY, DRIVES_CACHE_KEY,
    COOLERS_CACHE_KEY, CASES_CACHE_KEY,
] as const;

// ── TTLs ──────────────────────────────────────────────────────────────────────
export const CACHE_TTL       = 30 * 60;                         // 30 min
export const PROACTIVE_TTL   = Math.floor(0.8 * CACHE_TTL);    // 24 min
export const MAX_STALE_AGE   = 7 * 24 * 60 * 60;               // 7 days

// ── Constants ─────────────────────────────────────────────────────────────────
export const VALID_CATEGORIES = new Set([
    'desktops', 'memory', 'cpu', 'gpu', 'laptops', 'motherboards',
    'psu', 'ssd', 'hdd', 'drives', 'coolers', 'cases',
]);

export const VALID_STORE_IDS = new Set([
    1, 2, 4, 67, 3, 56, 66, 57, 5, 60, 62, 8, 9, 11, 12, 75, 71, 68,
    17, 15, 46, 18, 64, 69, 23, 44, 20, 21, 73, 58, 26, 27, 72, 28, 29,
    51, 32, 33, 34,
]);

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Product {
    title: string;
    price: string;
    regular_price: string;
    item_code: string;
    online_availability: string;
    instore_availability: string;
    link: string;
    image_url: string;
    laptop_type?: string;
    drive_type?: string;
    cooler_type?: string;
    case_type?: string;
}

export interface PricePoint {
    price: number;
    regular_price: number;
    recorded_at: number;
}

// ── Cache read/write ──────────────────────────────────────────────────────────
export function cacheGet(storeKey: string, ttl: number): Product[] | null {
    const db = getDb();
    const row = db.prepare(
        'SELECT products, scraped_at FROM deals_cache WHERE store_key = ?'
    ).get(storeKey) as { products: string; scraped_at: number } | undefined;
    if (row && Date.now() / 1000 - row.scraped_at < ttl) {
        return JSON.parse(row.products) as Product[];
    }
    return null;
}

export function cacheGetWithAge(storeKey: string): [Product[] | null, number | null] {
    const db = getDb();
    const row = db.prepare(
        'SELECT products, scraped_at FROM deals_cache WHERE store_key = ?'
    ).get(storeKey) as { products: string; scraped_at: number } | undefined;
    if (row) {
        const age = Date.now() / 1000 - row.scraped_at;
        if (age < MAX_STALE_AGE) {
            return [JSON.parse(row.products) as Product[], age];
        }
    }
    return [null, null];
}

export function cacheSet(storeKey: string, products: Product[]): void {
    const db = getDb();
    db.prepare(
        'INSERT OR REPLACE INTO deals_cache (store_key, products, scraped_at) VALUES (?, ?, ?)'
    ).run(storeKey, JSON.stringify(products), Date.now() / 1000);

    // Log price history asynchronously for global category writes
    if (storeKey.startsWith('__')) {
        setImmediate(() => logPriceHistory(products));
    }
}

// ── Price history ─────────────────────────────────────────────────────────────
function parseDollars(s: string): number {
    return parseFloat(String(s).replace(/[$,]/g, '')) || 0;
}

function logPriceHistory(products: Product[]): void {
    const now = Date.now() / 1000;
    const slot = Math.floor(now / 1800); // one slot per 30-min window
    const cutoff = now - 35 * 24 * 3600;

    const rows: [string, number, number, number, number][] = [];
    for (const p of products) {
        if (!p.item_code) continue;
        const sale = parseDollars(p.price);
        const reg  = parseDollars(p.regular_price);
        if (sale <= 0) continue;
        rows.push([p.item_code, sale, reg, now, slot]);
    }
    if (!rows.length) return;

    const db = getDb();
    const ins = db.prepare(
        'INSERT OR IGNORE INTO price_history (item_code, price, regular_price, recorded_at, slot) VALUES (?, ?, ?, ?, ?)'
    );
    const del = db.prepare('DELETE FROM price_history WHERE recorded_at < ?');
    const batch = db.transaction(() => {
        for (const row of rows) ins.run(...row);
        del.run(cutoff);
    });
    try { batch(); } catch (e) { console.error('[cache] price history error:', e); }
}

export function getPriceHistory(itemCode: string, days = 30): PricePoint[] {
    const cutoff = Date.now() / 1000 - days * 24 * 3600;
    const db = getDb();
    return db.prepare(
        'SELECT price, regular_price, recorded_at FROM price_history WHERE item_code = ? AND recorded_at >= ? ORDER BY recorded_at ASC'
    ).all(itemCode, cutoff) as PricePoint[];
}

export function getCachedProduct(itemCode: string): Product | null {
    const db = getDb();
    const placeholders = GLOBAL_KEYS.map(() => '?').join(', ');
    const rows = db.prepare(
        `SELECT products FROM deals_cache WHERE store_key IN (${placeholders})`
    ).all(...GLOBAL_KEYS) as { products: string }[];
    for (const { products } of rows) {
        for (const p of JSON.parse(products) as Product[]) {
            if (p.item_code === itemCode) return p;
        }
    }
    return null;
}

// ── In-progress guard (prevents duplicate background scrapes) ─────────────────
const _inProgress = new Set<string>();

export function isScrapingInProgress(key: string): boolean {
    return _inProgress.has(key);
}
export function markInProgress(key: string): void    { _inProgress.add(key); }
export function markDone(key: string): void          { _inProgress.delete(key); }

// ── Cache status ──────────────────────────────────────────────────────────────
const CATEGORY_KEYS = new Set(GLOBAL_KEYS);
const CATEGORY_PREFIXES = ['mem_', 'cpu_', 'gpu_', 'lap_', 'mob_', 'psu_', 'ssd_', 'hdd_', 'drv_', 'clr_', 'cas_'];

export function cacheStatus() {
    const now = Date.now() / 1000;
    const db = getDb();
    const rows = db.prepare(
        'SELECT store_key, scraped_at, LENGTH(products) as byte_len FROM deals_cache'
    ).all() as { store_key: string; scraped_at: number; byte_len: number }[];

    const entries = rows.map(({ store_key, scraped_at, byte_len }) => {
        const age = Math.floor(now - scraped_at);
        let ttl = CACHE_TTL;
        if (store_key !== ALL_STORES_KEY && !CATEGORY_KEYS.has(store_key as typeof GLOBAL_KEYS[number]) && !CATEGORY_PREFIXES.some(p => store_key.startsWith(p))) {
            ttl = CACHE_TTL; // store TTL
        }
        return {
            store_key,
            age_seconds: age,
            expires_in_seconds: Math.max(0, ttl - age),
            fresh: age < ttl,
            cached_bytes: byte_len,
        };
    }).sort((a, b) => a.store_key.localeCompare(b.store_key));

    const allStoresEntry  = entries.find(e => e.store_key === ALL_STORES_KEY) ?? null;
    const categoryEntries = entries.filter(e =>
        CATEGORY_KEYS.has(e.store_key as typeof GLOBAL_KEYS[number]) ||
        CATEGORY_PREFIXES.some(p => e.store_key.startsWith(p))
    );
    const storeEntries = entries.filter(e =>
        e.store_key !== ALL_STORES_KEY &&
        !CATEGORY_KEYS.has(e.store_key as typeof GLOBAL_KEYS[number]) &&
        !CATEGORY_PREFIXES.some(p => e.store_key.startsWith(p))
    );

    return {
        all_stores: allStoresEntry,
        categories: categoryEntries,
        store_count_cached: storeEntries.length,
        store_count_total: VALID_STORE_IDS.size,
        stores: storeEntries,
    };
}

// ── Rate limiting (token bucket) ──────────────────────────────────────────────
const RL_RATE  = 2;   // tokens/second
const RL_BURST = 10;
const _buckets = new Map<string, [number, number]>(); // [tokens, lastTimeSec]

export function rateLimitCheck(ip: string, cost = 1): boolean {
    const now = Date.now() / 1000;
    if (!_buckets.has(ip)) _buckets.set(ip, [RL_BURST, now]);
    const b = _buckets.get(ip)!;
    const elapsed = now - b[1];
    b[0] = Math.min(RL_BURST, b[0] + elapsed * RL_RATE);
    b[1] = now;
    if (b[0] >= cost) { b[0] -= cost; return true; }
    return false;
}
