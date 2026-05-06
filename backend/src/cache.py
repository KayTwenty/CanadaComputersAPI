"""
cache.py — SQLite cache, SWR helpers, scrape locks, rate limiting.

Nothing in this module imports from other app modules, so it can be
imported by scraper.py, categories.py, and services.py without circular deps.
"""
import json
import os
import sqlite3
import threading
import time

# DB path
_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'cache.db')

# Cache keys
_ALL_STORES_KEY        = '__all__'
_MEMORY_CACHE_KEY      = '__memory__'
_CPU_CACHE_KEY         = '__cpu__'
_GPU_CACHE_KEY         = '__gpu__'
_LAPTOP_CACHE_KEY      = '__laptops__'
_MOTHERBOARD_CACHE_KEY = '__motherboards__'
_PSU_CACHE_KEY         = '__psu__'
_SSD_CACHE_KEY         = '__ssd__'
_HDD_CACHE_KEY         = '__hdd__'
_DRIVES_CACHE_KEY      = '__drives__'
_COOLERS_CACHE_KEY     = '__coolers__'
_CASES_CACHE_KEY       = '__cases__'

# TTLs (all 30 min)
_CACHE_TTL             = 30 * 60
_STORE_CACHE_TTL       = 30 * 60
_MEMORY_CACHE_TTL      = 30 * 60
_CPU_CACHE_TTL         = 30 * 60
_GPU_CACHE_TTL         = 30 * 60
_LAPTOP_CACHE_TTL      = 30 * 60
_MOTHERBOARD_CACHE_TTL = 30 * 60
_PSU_CACHE_TTL         = 30 * 60
_SSD_CACHE_TTL         = 30 * 60
_HDD_CACHE_TTL         = 30 * 60
_DRIVES_CACHE_TTL      = 30 * 60
_COOLERS_CACHE_TTL     = 30 * 60
_CASES_CACHE_TTL       = 30 * 60

# Hard ceiling: never serve cached data older than this, even via SWR.
_MAX_STALE_AGE = 7 * 24 * 60 * 60  # 7 days

# Proactive refresh: re-scrape when 80 % of TTL has elapsed so users never
# wait on a cold scrape (stale-while-revalidate).
_PROACTIVE_TTL = int(0.80 * _CACHE_TTL)  # 24 min

# Public constants
VALID_STORE_IDS = {
    1, 2, 4, 67, 3, 56, 66, 57, 5, 60, 62, 8, 9, 11, 12, 75, 71, 68,
    17, 15, 46, 18, 64, 69, 23, 44, 20, 21, 73, 58, 26, 27, 72, 28, 29,
    51, 32, 33, 34,
}

VALID_CATEGORIES = {
    'desktops', 'memory', 'cpu', 'gpu', 'laptops', 'motherboards',
    'psu', 'ssd', 'hdd', 'drives', 'coolers', 'cases',
}

# SQLite helpers
_db_lock = threading.Lock()

def _db_connect():
    conn = sqlite3.connect(_DB_PATH)
    conn.execute('PRAGMA journal_mode=WAL')  # allow concurrent readers during writes
    conn.execute('''
        CREATE TABLE IF NOT EXISTS deals_cache (
            store_key  TEXT PRIMARY KEY,
            products   TEXT NOT NULL,
            scraped_at REAL NOT NULL
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS price_history (
            item_code     TEXT    NOT NULL,
            price         REAL    NOT NULL,
            regular_price REAL    NOT NULL,
            recorded_at   REAL    NOT NULL,
            slot          INTEGER NOT NULL,
            UNIQUE (item_code, slot)
        )
    ''')
    conn.execute(
        'CREATE INDEX IF NOT EXISTS idx_ph_item ON price_history (item_code, recorded_at)'
    )
    conn.commit()
    return conn

def _cache_get(store_key: str, ttl: float):
    """Return products list if a fresh cache entry exists, else None."""
    with _db_lock:
        conn = _db_connect()
        try:
            row = conn.execute(
                'SELECT products, scraped_at FROM deals_cache WHERE store_key = ?',
                (store_key,)
            ).fetchone()
        finally:
            conn.close()
    if row and time.time() - row[1] < ttl:
        return json.loads(row[0])
    return None

def _cache_get_with_age(store_key: str):
    """Return (products, age_seconds) for any row younger than _MAX_STALE_AGE,
    or (None, None) otherwise. Used for stale-while-revalidate."""
    with _db_lock:
        conn = _db_connect()
        try:
            row = conn.execute(
                'SELECT products, scraped_at FROM deals_cache WHERE store_key = ?',
                (store_key,)
            ).fetchone()
        finally:
            conn.close()
    if row:
        age = time.time() - row[1]
        if age < _MAX_STALE_AGE:
            return json.loads(row[0]), age
    return None, None

def _log_price_history(products: list) -> None:
    """Write one price snapshot per product per 30-min slot. Called in a daemon
    thread from _cache_set so it never blocks the main response path."""
    now = time.time()
    slot = int(now / 1800)  # unique integer per 30-minute window
    rows = []
    for p in products:
        ic = p.get('item_code', '')
        if not ic:
            continue
        try:
            sale = float(str(p.get('price', '0')).replace('$', '').replace(',', ''))
            reg  = float(str(p.get('regular_price', '0')).replace('$', '').replace(',', ''))
        except (ValueError, AttributeError):
            continue
        if sale <= 0:
            continue
        rows.append((ic, sale, reg, now, slot))
    if not rows:
        return
    cutoff = now - (35 * 24 * 3600)  # prune older than 35 days
    with _db_lock:
        conn = _db_connect()
        try:
            conn.executemany(
                'INSERT OR IGNORE INTO price_history '
                '(item_code, price, regular_price, recorded_at, slot) VALUES (?, ?, ?, ?, ?)',
                rows,
            )
            conn.execute('DELETE FROM price_history WHERE recorded_at < ?', (cutoff,))
            conn.commit()
        finally:
            conn.close()


def get_price_history(item_code: str, days: int = 30) -> list:
    """Return price snapshots for item_code over the last `days` days,
    ordered oldest-first. Returns a list of {price, regular_price, recorded_at}."""
    cutoff = time.time() - (days * 24 * 3600)
    with _db_lock:
        conn = _db_connect()
        try:
            rows = conn.execute(
                'SELECT price, regular_price, recorded_at '
                'FROM price_history '
                'WHERE item_code = ? AND recorded_at >= ? '
                'ORDER BY recorded_at ASC',
                (item_code, cutoff),
            ).fetchall()
        finally:
            conn.close()
    return [
        {'price': r[0], 'regular_price': r[1], 'recorded_at': r[2]}
        for r in rows
    ]


def _cache_set(store_key: str, products: list):
    with _db_lock:
        conn = _db_connect()
        try:
            conn.execute(
                'INSERT OR REPLACE INTO deals_cache (store_key, products, scraped_at) VALUES (?, ?, ?)',
                (store_key, json.dumps(products), time.time())
            )
            conn.commit()
        finally:
            conn.close()
    # Log price history asynchronously for global (non-per-store) cache writes
    if store_key.startswith('__'):
        t = threading.Thread(target=_log_price_history, args=(products,), daemon=True)
        t.start()

def cache_status():
    """Return a status dict covering all cached keys."""
    now = time.time()
    with _db_lock:
        conn = _db_connect()
        try:
            rows = conn.execute(
                'SELECT store_key, scraped_at, LENGTH(products) FROM deals_cache'
            ).fetchall()
        finally:
            conn.close()

    _CATEGORY_KEYS = {
        _MEMORY_CACHE_KEY, _CPU_CACHE_KEY, _GPU_CACHE_KEY, _LAPTOP_CACHE_KEY,
        _MOTHERBOARD_CACHE_KEY, _PSU_CACHE_KEY, _SSD_CACHE_KEY, _HDD_CACHE_KEY,
        _DRIVES_CACHE_KEY, _COOLERS_CACHE_KEY, _CASES_CACHE_KEY,
    }
    _CATEGORY_PREFIXES = (
        'mem_', 'cpu_', 'gpu_', 'lap_', 'mob_', 'psu_',
        'ssd_', 'hdd_', 'drv_', 'clr_', 'cas_',
    )

    entries = []
    for store_key, scraped_at, byte_len in rows:
        age = int(now - scraped_at)
        if store_key == _ALL_STORES_KEY:
            ttl = _CACHE_TTL
        elif store_key in _CATEGORY_KEYS or store_key.startswith(_CATEGORY_PREFIXES):
            ttl = _MEMORY_CACHE_TTL  # all category TTLs are equal
        else:
            ttl = _STORE_CACHE_TTL
        entries.append({
            'store_key': store_key,
            'age_seconds': age,
            'expires_in_seconds': max(0, int(ttl - age)),
            'fresh': age < ttl,
            'cached_bytes': byte_len,
        })

    entries.sort(key=lambda e: e['store_key'])

    all_stores_entry  = next((e for e in entries if e['store_key'] == _ALL_STORES_KEY), None)
    category_entries  = [e for e in entries
                         if e['store_key'] in _CATEGORY_KEYS
                         or e['store_key'].startswith(_CATEGORY_PREFIXES)]
    store_entries     = [e for e in entries
                         if e['store_key'] not in {_ALL_STORES_KEY, *_CATEGORY_KEYS}
                         and not e['store_key'].startswith(_CATEGORY_PREFIXES)]

    return {
        'all_stores': all_stores_entry,
        'categories': category_entries,
        'store_count_cached': len(store_entries),
        'store_count_total': len(VALID_STORE_IDS),
        'stores': store_entries,
    }

# Scrape locks
_scrape_locks: dict = {}
_scrape_locks_mutex = threading.Lock()

def _get_scrape_lock(key: str) -> threading.Lock:
    with _scrape_locks_mutex:
        if key not in _scrape_locks:
            _scrape_locks[key] = threading.Lock()
        return _scrape_locks[key]

_cat_refresh_locks: dict = {}
_cat_refresh_locks_mutex = threading.Lock()

def _get_cat_refresh_lock(key: str) -> threading.Lock:
    with _cat_refresh_locks_mutex:
        if key not in _cat_refresh_locks:
            _cat_refresh_locks[key] = threading.Lock()
        return _cat_refresh_locks[key]

# Stale-while-revalidate helpers
def _bg_refresh(cache_key: str, ttl: float, scrape_fn, label: str) -> None:
    """Refresh cache_key if stale. Non-blocking lock prevents duplicate scrapes."""
    if _cache_get(cache_key, _PROACTIVE_TTL) is not None:
        return
    lock = _get_cat_refresh_lock(cache_key)
    if not lock.acquire(blocking=False):
        return
    try:
        if _cache_get(cache_key, _PROACTIVE_TTL) is not None:  # re-check inside lock
            return
        print(f'[{label}] Background refresh starting...')
        result = scrape_fn()
        if result.get('products'):
            _cache_set(cache_key, result['products'])
            print(f'[{label}] Done. {len(result["products"])} items cached.')
        else:
            print(f'[{label}] Warning: refresh returned 0 items — keeping old cache.')
    except Exception as e:
        print(f'[{label}] Background refresh failed: {e}')
    finally:
        lock.release()

def _trigger_bg_refresh(cache_key: str, ttl: float, scrape_fn, label: str) -> None:
    """Fire-and-forget background refresh thread."""
    t = threading.Thread(
        target=_bg_refresh,
        args=(cache_key, ttl, scrape_fn, label),
        daemon=True,
    )
    t.start()

def _serve_or_swr(cache_key: str, ttl: float, scrape_fn, label: str):
    """Return cached products immediately (triggering background refresh when
    stale), or None on a true cold miss."""
    products, age = _cache_get_with_age(cache_key)
    if products is None:
        return None
    if age is not None and age >= _PROACTIVE_TTL:
        _trigger_bg_refresh(cache_key, ttl, scrape_fn, label)
    return products

def _get_or_scrape(global_key: str, store_key: str, ttl: float,
                   scrape_fn, label: str, store_id):
    """Generic SWR + cold-miss handler for every per-category cache getter.

    1. Serve from cache immediately and trigger bg refresh when stale.
    2. Scrape inline under a per-key lock on a cold miss.
    3. Fall back to the global cache when a per-store scrape returns nothing.
    """
    stale = _serve_or_swr(store_key, ttl,
                          lambda: scrape_fn(store_id=store_id),
                          f'{label}/{store_key}')
    if stale is not None:
        return {'products': stale}

    lock = _get_scrape_lock(store_key)
    with lock:
        products = _cache_get(store_key, ttl)
        if products is not None:
            return {'products': products}
        result = scrape_fn(store_id=store_id)
        if result['products']:
            _cache_set(store_key, result['products'])
            return result
        if store_id is not None:
            global_products = _cache_get(global_key, ttl)
            if global_products:
                return {'products': global_products}
        return result

# Rate limiting (token bucket, no external dependency)
_RL_RATE  = 2     # tokens refilled per second
_RL_BURST = 10    # maximum burst size
_rl_buckets: dict = {}
_rl_lock = threading.Lock()

def rate_limit_check(ip: str, cost: int = 1) -> bool:
    """Return True if the request is allowed, False if it should be rejected.
    Thread-safe token-bucket implementation."""
    now = time.monotonic()
    with _rl_lock:
        if ip not in _rl_buckets:
            _rl_buckets[ip] = [float(_RL_BURST), now]
        bucket = _rl_buckets[ip]
        elapsed = now - bucket[1]
        bucket[0] = min(_RL_BURST, bucket[0] + elapsed * _RL_RATE)
        bucket[1] = now
        if bucket[0] >= cost:
            bucket[0] -= cost
            return True
        return False
