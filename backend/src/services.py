from flask import request, jsonify
from bs4 import BeautifulSoup

from urllib.request import urlopen, Request
from urllib.parse import quote_plus

import re
import time
import random
import threading
import sqlite3
import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

# SQLite cache

_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'cache.db')
_ALL_STORES_KEY = '__all__'
_MEMORY_CACHE_KEY = '__memory__'
_CPU_CACHE_KEY = '__cpu__'
_GPU_CACHE_KEY = '__gpu__'
_LAPTOP_CACHE_KEY = '__laptops__'
_CACHE_TTL = 30 * 60          # 30 minutes for all-stores background refresh
_STORE_CACHE_TTL = 30 * 60    # 30 minutes for per-store results too
_MEMORY_CACHE_TTL = 30 * 60   # 30 minutes for memory deals
_CPU_CACHE_TTL = 30 * 60      # 30 minutes for CPU deals
_GPU_CACHE_TTL = 30 * 60      # 30 minutes for GPU deals
_LAPTOP_CACHE_TTL = 30 * 60   # 30 minutes for laptop deals
_db_lock = threading.Lock()

def _db_connect():
    conn = sqlite3.connect(_DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS deals_cache (
            store_key TEXT PRIMARY KEY,
            products  TEXT NOT NULL,
            scraped_at REAL NOT NULL
        )
    ''')
    conn.commit()
    return conn

def _cache_get(store_key: str, ttl: float):
    """Return list of products if a fresh cache entry exists, else None."""
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

def cache_status():
    """Return a status dict covering all cached keys."""
    now = time.time()
    with _db_lock:
        conn = _db_connect()
        try:
            rows = conn.execute('SELECT store_key, scraped_at, LENGTH(products) FROM deals_cache').fetchall()
        finally:
            conn.close()

    _CATEGORY_KEYS = {_MEMORY_CACHE_KEY, _CPU_CACHE_KEY, _GPU_CACHE_KEY, _LAPTOP_CACHE_KEY}
    _CATEGORY_PREFIXES = ('mem_', 'cpu_', 'gpu_', 'lap_')

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

    _CATEGORY_KEYS = {_MEMORY_CACHE_KEY, _CPU_CACHE_KEY, _GPU_CACHE_KEY, _LAPTOP_CACHE_KEY}
    _CATEGORY_PREFIXES = ('mem_', 'cpu_', 'gpu_', 'lap_')
    all_stores_entry = next((e for e in entries if e['store_key'] == _ALL_STORES_KEY), None)
    category_entries  = [e for e in entries if e['store_key'] in _CATEGORY_KEYS or e['store_key'].startswith(_CATEGORY_PREFIXES)]
    store_entries     = [e for e in entries if e['store_key'] not in {_ALL_STORES_KEY, *_CATEGORY_KEYS} and not e['store_key'].startswith(_CATEGORY_PREFIXES)]

    return {
        'all_stores': all_stores_entry,
        'categories': category_entries,
        'store_count_cached': len(store_entries),
        'store_count_total': len(VALID_STORE_IDS),
        'stores': store_entries,
    }

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

# Public cache helpers

VALID_STORE_IDS = {
    1, 2, 4, 67, 3, 56, 66, 57, 5, 60, 62, 8, 9, 11, 12, 75, 71, 68,
    17, 15, 46, 18, 64, 69, 23, 44, 20, 21, 73, 58, 26, 27, 72, 28, 29,
    51, 32, 33, 34,
}

_scrape_locks: dict = {}  # per-key lock so two requests don't double-scrape
_scrape_locks_mutex = threading.Lock()

def _get_scrape_lock(key: str) -> threading.Lock:
    with _scrape_locks_mutex:
        if key not in _scrape_locks:
            _scrape_locks[key] = threading.Lock()
        return _scrape_locks[key]

def get_cached_desktop_deals(store_id=None):
    store_key = _ALL_STORES_KEY if store_id is None else str(store_id)
    ttl = _CACHE_TTL if store_id is None else _STORE_CACHE_TTL

    products = _cache_get(store_key, ttl)
    if products is not None:
        return {'products': products}

    # Not cached or stale — scrape now (serialize per-key with a lock)
    lock = _get_scrape_lock(store_key)
    with lock:
        # Re-check after acquiring lock (another thread may have just scraped)
        products = _cache_get(store_key, ttl)
        if products is not None:
            return {'products': products}

        result = desktop_deals(store_id=store_id)
        if result['products']:
            _cache_set(store_key, result['products'])
        return result

# Background refresh
# Proactive refresh: re-scrape a global key when it has used 80% of its TTL so
# users never wait on a cold scrape. The old cache keeps serving while the new
# scrape runs in the background (stale-while-revalidate).
_PROACTIVE_TTL = int(0.80 * _CACHE_TTL)   # 24 min  (full TTL = 30 min)

# Per-key non-blocking locks prevent two threads from scraping the same category.
_cat_refresh_locks: dict = {}
_cat_refresh_locks_mutex = threading.Lock()

def _get_cat_refresh_lock(key: str) -> threading.Lock:
    with _cat_refresh_locks_mutex:
        if key not in _cat_refresh_locks:
            _cat_refresh_locks[key] = threading.Lock()
        return _cat_refresh_locks[key]

def _bg_refresh(cache_key: str, ttl: float, scrape_fn, label: str) -> None:
    """Refresh *cache_key* if stale or within the proactive window.
    Uses a non-blocking lock so concurrent callers skip rather than queue up."""
    if _cache_get(cache_key, _PROACTIVE_TTL) is not None:
        return  # still fresh — nothing to do yet
    lock = _get_cat_refresh_lock(cache_key)
    if not lock.acquire(blocking=False):
        return  # another thread is already scraping this key
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

_PRELOAD_WORKERS = 4  # parallel store scrapers

def _preload_one_store(store_id: int) -> bool:
    """Scrape and cache a single store. Returns True if newly cached."""
    store_key = str(store_id)
    lock = _get_scrape_lock(store_key)
    with lock:
        if _cache_get(store_key, _STORE_CACHE_TTL) is not None:
            return False  # already fresh — nothing to do
        result = desktop_deals(store_id=store_id)
        if result['products']:
            _cache_set(store_key, result['products'])
            return True
        return False

def _refresh_store_locations():
    """Scrape and cache deals for every store location that isn't already fresh, using a thread pool."""
    to_scrape = [sid for sid in VALID_STORE_IDS
                 if _cache_get(str(sid), _STORE_CACHE_TTL) is None]
    if not to_scrape:
        print('[deals] All store locations already cached — nothing to pre-load.')
        return
    print(f'[deals] Pre-loading {len(to_scrape)} store location(s) with {_PRELOAD_WORKERS} workers...')
    loaded = 0
    with ThreadPoolExecutor(max_workers=_PRELOAD_WORKERS) as pool:
        futures = {pool.submit(_preload_one_store, sid): sid for sid in to_scrape}
        for future in as_completed(futures):
            sid = futures[future]
            try:
                if future.result():
                    loaded += 1
            except Exception as e:
                print(f'[deals] Store {sid} pre-load failed: {e}')
    print(f'[deals] Pre-loaded {loaded}/{len(to_scrape)} store location(s).')

def _background_loop():
    """
    Keeps all global caches warm using a proactive stale-while-revalidate strategy:
    - On startup:  immediately refreshes every stale/missing cache in parallel,
                   then pre-loads all per-store desktop caches.
    - Every 60 s:  fires fire-and-forget threads for any cache that has passed
                   80% of its TTL, so users always get a cached response.
    """
    # _JOBS is evaluated at call time so all scraper functions are already defined.
    _JOBS = [
        (_ALL_STORES_KEY,   _CACHE_TTL,        desktop_deals,  'desktops'),
        (_MEMORY_CACHE_KEY, _MEMORY_CACHE_TTL, memory_deals,   'memory'),
        (_CPU_CACHE_KEY,    _CPU_CACHE_TTL,     cpu_deals,      'cpu'),
        (_GPU_CACHE_KEY,    _GPU_CACHE_TTL,     gpu_deals,      'gpu'),
        (_LAPTOP_CACHE_KEY, _LAPTOP_CACHE_TTL,  laptop_deals,   'laptops'),
    ]

    print('[deals] Startup: warming all global caches in parallel...')
    # Block until all startup refreshes finish so per-store pre-load starts
    # with warm global caches and doesn't race against user requests.
    with ThreadPoolExecutor(max_workers=len(_JOBS)) as pool:
        for args in _JOBS:
            pool.submit(_bg_refresh, *args)

    # Pre-load per-store desktop caches now that globals are warm.
    _refresh_store_locations()

    # Proactive refresh loop — fire background threads, don't block.
    while True:
        time.sleep(60)
        for args in _JOBS:
            t = threading.Thread(target=_bg_refresh, args=args, daemon=True)
            t.start()

def start_deals_refresh():
    t = threading.Thread(target=_background_loop, daemon=True)
    t.start()

def get_cached_memory_deals(store_id=None):
    store_key = _MEMORY_CACHE_KEY if store_id is None else f'mem_{store_id}'
    products = _cache_get(store_key, _MEMORY_CACHE_TTL)
    if products is not None:
        return {'products': products}
    lock = _get_scrape_lock(store_key)
    with lock:
        products = _cache_get(store_key, _MEMORY_CACHE_TTL)
        if products is not None:
            return {'products': products}
        result = memory_deals(store_id=store_id)
        if result['products']:
            _cache_set(store_key, result['products'])
            return result
        # Per-store returned nothing — fall back to global cache
        if store_id is not None:
            global_products = _cache_get(_MEMORY_CACHE_KEY, _MEMORY_CACHE_TTL)
            if global_products:
                return {'products': global_products}
        return result

def get_cached_cpu_deals(store_id=None):
    store_key = _CPU_CACHE_KEY if store_id is None else f'cpu_{store_id}'
    products = _cache_get(store_key, _CPU_CACHE_TTL)
    if products is not None:
        return {'products': products}
    lock = _get_scrape_lock(store_key)
    with lock:
        products = _cache_get(store_key, _CPU_CACHE_TTL)
        if products is not None:
            return {'products': products}
        result = cpu_deals(store_id=store_id)
        if result['products']:
            _cache_set(store_key, result['products'])
            return result
        # Per-store returned nothing — fall back to global cache
        if store_id is not None:
            global_products = _cache_get(_CPU_CACHE_KEY, _CPU_CACHE_TTL)
            if global_products:
                return {'products': global_products}
        return result

def get_cached_gpu_deals(store_id=None):
    store_key = _GPU_CACHE_KEY if store_id is None else f'gpu_{store_id}'
    products = _cache_get(store_key, _GPU_CACHE_TTL)
    if products is not None:
        return {'products': products}
    lock = _get_scrape_lock(store_key)
    with lock:
        products = _cache_get(store_key, _GPU_CACHE_TTL)
        if products is not None:
            return {'products': products}
        result = gpu_deals(store_id=store_id)
        if result['products']:
            _cache_set(store_key, result['products'])
            return result
        # Per-store returned nothing — fall back to global cache
        if store_id is not None:
            global_products = _cache_get(_GPU_CACHE_KEY, _GPU_CACHE_TTL)
            if global_products:
                return {'products': global_products}
        return result

MAX_PAGES = 10  # hard cap per category to avoid runaway scrapes

VALID_CATEGORIES = {'desktops', 'memory', 'cpu', 'gpu', 'laptops'}

# ─── Rate limiting (token bucket, no external dependency) ─────────────────────
# Each unique IP gets its own bucket.  Buckets refill at `_RL_RATE` tokens/sec
# up to `_RL_BURST`.  A request costs 1 token; cost is higher for /search since
# it always hits Canada Computers live.
_RL_RATE  = 2     # tokens refilled per second
_RL_BURST = 10    # maximum burst size
_rl_buckets: dict = {}   # ip -> [tokens: float, last_refill: float]
_rl_lock = threading.Lock()

def rate_limit_check(ip: str, cost: int = 1) -> bool:
    """Return True if the request is allowed, False if it should be rejected (429).
    Thread-safe; no external dependencies."""
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

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/124.0.0.0 Safari/537.36',
]

def fetch_page(url, fast=False, retries=3):
    """Fetch a URL with a random User-Agent, a random delay, and up to `retries` attempts."""
    time.sleep(random.uniform(0.4, 0.9) if fast else random.uniform(1.5, 3.5))
    headers = {
        'User-Agent': random.choice(USER_AGENTS),
        'Accept-Language': 'en-CA,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
    last_exc = None
    for attempt in range(1, retries + 1):
        try:
            req = Request(url, headers=headers)
            return urlopen(req).read().decode()
        except Exception as e:
            last_exc = e
            if attempt < retries:
                backoff = 2 ** attempt + random.uniform(0, 1)
                print(f'[deals] fetch_page attempt {attempt} failed ({e}). Retrying in {backoff:.1f}s...')
                time.sleep(backoff)
    raise last_exc

def generate_search_url(s, page):
    return f'https://www.canadacomputers.com/en/search?s={s}&page={page}'

def product_search(search_string, low, high):
    output = {'products': []}

    page = 1

    while page <= MAX_PAGES:
        search = quote_plus(search_string)
        url = generate_search_url(search, page)

        print(url)
        data = fetch_page(url)

        soup = BeautifulSoup(data, 'html.parser')

        products = soup.find_all('article', class_='product-miniature')

        if not products:
            break

        for product in products:
            # Title and link
            title_tag = product.find('h2', class_='product-title')
            if not title_tag:
                continue
            a_tag = title_tag.find('a')
            title = a_tag.text.strip()
            link = a_tag['href']

            # Price from data attribute on product-description div
            desc_div = product.find('div', class_='product-description')
            price = desc_div.get('data-price', 'N/A') if desc_div else 'N/A'

            # Item code from thumbnail anchor data-id attribute
            thumb = product.find('a', class_='product-thumbnail')
            item_code = thumb.get('data-id', 'No Code') if thumb else 'No Code'

            # Availability from data attributes on available-tag div
            avail_div = product.find('div', class_='available-tag')
            if avail_div:
                online_flag = avail_div.get('data-stock_availability_online', '0')
                retail_flag = avail_div.get('data-stock_availability_retail', '0')
                smalls = avail_div.find_all('small', class_='pq-hdr-bolder')
                online_availability = smalls[0].get_text(strip=True) if len(smalls) > 0 else ('Available to Ship' if online_flag == '1' else 'Not Available Online')
                instore_availability = smalls[1].get_text(strip=True) if len(smalls) > 1 else ('Available for Pickup' if retail_flag == '1' else 'Not Available In Store')
            else:
                online_availability = 'unknown'
                instore_availability = 'unknown'

            # Client-side price range filtering
            if low is not None and high is not None:
                try:
                    price_val = float(price.replace('$', '').replace(',', ''))
                    if not (float(low) <= price_val <= float(high)):
                        continue
                except (ValueError, AttributeError):
                    pass

            item = {
                'title': title,
                'price': price,
                'item_code': item_code,
                'online_availability': online_availability,
                'instore_availability': instore_availability,
                'link': link
            }

            output['products'].append(item)

        page += 1

    return output


DESKTOP_ITEM_CODE_RE = re.compile(r'^RTARU', re.IGNORECASE)


def desktop_deals(store_id=None):
    output = {'products': []}
    page = 1

    while page <= MAX_PAGES:
        url = f'https://www.canadacomputers.com/en/931/desktop-computers?page={page}'
        if store_id is not None:
            url += f'&pickup={store_id}'
        print(url)
        data = fetch_page(url, fast=store_id is not None)
        soup = BeautifulSoup(data, 'html.parser')

        products = soup.find_all('article', class_='product-miniature')
        if not products:
            break

        for product in products:
            thumb = product.find('a', class_='product-thumbnail')
            item_code = thumb.get('data-id', '') if thumb else ''

            if not DESKTOP_ITEM_CODE_RE.match(item_code):
                continue

            desc_div = product.find('div', class_='product-description')
            if not desc_div:
                continue

            price = desc_div.get('data-price', 'N/A')
            regular_price = desc_div.get('data-regular_price', price)

            # Only include items actually on sale
            if price == regular_price:
                continue

            title_tag = product.find('h2', class_='product-title')
            if not title_tag:
                continue
            a_tag = title_tag.find('a')
            title = a_tag.text.strip()
            link = a_tag['href']

            avail_div = product.find('div', class_='available-tag')
            if avail_div:
                smalls = avail_div.find_all('small', class_='pq-hdr-bolder')
                online_availability = smalls[0].get_text(strip=True) if len(smalls) > 0 else 'unknown'
                instore_availability = smalls[1].get_text(strip=True) if len(smalls) > 1 else 'unknown'
            else:
                online_availability = 'unknown'
                instore_availability = 'unknown'

            # When filtering by a specific store, skip products not in stock there
            if store_id is not None:
                instore_lower = instore_availability.lower()
                if 'not available' in instore_lower or instore_lower == 'unknown':
                    continue

            img_tag = thumb.find('img') if thumb else None
            image_url = img_tag.get('data-cc-src') or img_tag.get('src', '') if img_tag else ''

            output['products'].append({
                'title': title,
                'price': price,
                'regular_price': regular_price,
                'item_code': item_code,
                'online_availability': online_availability,
                'instore_availability': instore_availability,
                'link': link,
                'image_url': image_url,
            })

        page += 1

    def savings_dollars(p):
        try:
            sale = float(p['price'].replace('$', '').replace(',', ''))
            reg = float(p['regular_price'].replace('$', '').replace(',', ''))
            return reg - sale
        except (ValueError, AttributeError):
            return 0

    output['products'].sort(key=savings_dollars, reverse=True)
    return output


def _scrape_sale_items(base_url: str, store_id=None):
    """Generic scraper for any paginated Canada Computers category page.
    Returns all on-sale products sorted by dollar savings descending."""
    output = {'products': []}
    page = 1

    while page <= MAX_PAGES:
        url = f'{base_url}?page={page}'
        if store_id is not None:
            url += f'&pickup={store_id}'
        print(url)
        data = fetch_page(url, fast=store_id is not None)
        soup = BeautifulSoup(data, 'html.parser')

        products = soup.find_all('article', class_='product-miniature')
        if not products:
            break

        for product in products:
            thumb = product.find('a', class_='product-thumbnail')
            item_code = thumb.get('data-id', '') if thumb else ''

            desc_div = product.find('div', class_='product-description')
            if not desc_div:
                continue

            price = desc_div.get('data-price', 'N/A')
            regular_price = desc_div.get('data-regular_price', price)

            if price == regular_price:
                continue

            title_tag = product.find('h2', class_='product-title')
            if not title_tag:
                continue
            a_tag = title_tag.find('a')
            title = a_tag.text.strip()
            link = a_tag['href']

            avail_div = product.find('div', class_='available-tag')
            if avail_div:
                smalls = avail_div.find_all('small', class_='pq-hdr-bolder')
                online_availability = smalls[0].get_text(strip=True) if len(smalls) > 0 else 'unknown'
                instore_availability = smalls[1].get_text(strip=True) if len(smalls) > 1 else 'unknown'
            else:
                online_availability = 'unknown'
                instore_availability = 'unknown'

            if store_id is not None:
                instore_lower = instore_availability.lower()
                if 'not available' in instore_lower or instore_lower == 'unknown':
                    continue

            img_tag = thumb.find('img') if thumb else None
            image_url = img_tag.get('data-cc-src') or img_tag.get('src', '') if img_tag else ''

            output['products'].append({
                'title': title,
                'price': price,
                'regular_price': regular_price,
                'item_code': item_code,
                'online_availability': online_availability,
                'instore_availability': instore_availability,
                'link': link,
                'image_url': image_url,
            })

        page += 1

    def savings_dollars(p):
        try:
            sale = float(p['price'].replace('$', '').replace(',', ''))
            reg = float(p['regular_price'].replace('$', '').replace(',', ''))
            return reg - sale
        except (ValueError, AttributeError):
            return 0

    output['products'].sort(key=savings_dollars, reverse=True)
    return output


def memory_deals(store_id=None):
    """Scrape on-sale memory/RAM products from Canada Computers."""
    return _scrape_sale_items('https://www.canadacomputers.com/en/1009/memory', store_id)


def cpu_deals(store_id=None):
    """Scrape on-sale CPU/processor products from Canada Computers."""
    return _scrape_sale_items('https://www.canadacomputers.com/en/956/cpu', store_id)


def gpu_deals(store_id=None):
    """Scrape on-sale graphics card products from Canada Computers."""
    return _scrape_sale_items('https://www.canadacomputers.com/en/914/graphics-cards', store_id)


_LAPTOP_URLS = [
    'https://www.canadacomputers.com/en/98/windows-laptops',
    'https://www.canadacomputers.com/en/93/business-laptops',
    'https://www.canadacomputers.com/en/103/gaming-laptops',
]


def laptop_deals(store_id=None):
    """Scrape on-sale laptop products from Canada Computers (3 sub-categories)."""
    combined: list = []
    for url in _LAPTOP_URLS:
        result = _scrape_sale_items(url, store_id)
        combined.extend(result['products'])

    def savings_dollars(p):
        try:
            sale = float(p['price'].replace('$', '').replace(',', ''))
            reg = float(p['regular_price'].replace('$', '').replace(',', ''))
            return reg - sale
        except (ValueError, AttributeError):
            return 0

    combined.sort(key=savings_dollars, reverse=True)
    return {'products': combined}


def get_cached_laptop_deals(store_id=None):
    store_key = _LAPTOP_CACHE_KEY if store_id is None else f'lap_{store_id}'
    products = _cache_get(store_key, _LAPTOP_CACHE_TTL)
    if products is not None:
        return {'products': products}
    lock = _get_scrape_lock(store_key)
    with lock:
        products = _cache_get(store_key, _LAPTOP_CACHE_TTL)
        if products is not None:
            return {'products': products}
        result = laptop_deals(store_id=store_id)
        if result['products']:
            _cache_set(store_key, result['products'])
            return result
        if store_id is not None:
            global_products = _cache_get(_LAPTOP_CACHE_KEY, _LAPTOP_CACHE_TTL)
            if global_products:
                return {'products': global_products}
        return result


# Streaming generators
def _stream_sale_items_gen(base_url: str, store_id, store_cache_key: str, ttl: float):
    """Generator: yields page-batches of on-sale products for streaming responses.
    If cached, yields the full list immediately and returns."""
    cached = _cache_get(store_cache_key, ttl)
    if cached is not None:
        yield cached
        return

    all_products: list = []
    page = 1

    while page <= MAX_PAGES:
        url = f'{base_url}?page={page}'
        if store_id is not None:
            url += f'&pickup={store_id}'
        try:
            data = fetch_page(url, fast=store_id is not None)
        except Exception:
            break

        soup = BeautifulSoup(data, 'html.parser')
        articles = soup.find_all('article', class_='product-miniature')
        if not articles:
            break

        page_batch: list = []
        for product in articles:
            thumb = product.find('a', class_='product-thumbnail')
            item_code = thumb.get('data-id', '') if thumb else ''
            desc_div = product.find('div', class_='product-description')
            if not desc_div:
                continue
            price = desc_div.get('data-price', 'N/A')
            regular_price = desc_div.get('data-regular_price', price)
            if price == regular_price:
                continue
            title_tag = product.find('h2', class_='product-title')
            if not title_tag:
                continue
            a_tag = title_tag.find('a')
            title = a_tag.text.strip()
            link = a_tag['href']
            avail_div = product.find('div', class_='available-tag')
            if avail_div:
                smalls = avail_div.find_all('small', class_='pq-hdr-bolder')
                online_availability = smalls[0].get_text(strip=True) if smalls else 'unknown'
                instore_availability = smalls[1].get_text(strip=True) if len(smalls) > 1 else 'unknown'
            else:
                online_availability = 'unknown'
                instore_availability = 'unknown'
            if store_id is not None:
                il = instore_availability.lower()
                if 'not available' in il or il == 'unknown':
                    continue
            img_tag = thumb.find('img') if thumb else None
            image_url = (img_tag.get('data-cc-src') or img_tag.get('src', '')) if img_tag else ''
            page_batch.append({
                'title': title, 'price': price, 'regular_price': regular_price,
                'item_code': item_code, 'online_availability': online_availability,
                'instore_availability': instore_availability, 'link': link,
                'image_url': image_url,
            })

        if page_batch:
            all_products.extend(page_batch)
            yield page_batch

        page += 1

    if all_products:
        _cache_set(store_cache_key, all_products)


def _stream_desktop_deals_gen(store_id=None):
    """Generator: yields desktop deal page-batches for streaming."""
    store_key = _ALL_STORES_KEY if store_id is None else str(store_id)
    ttl = _CACHE_TTL if store_id is None else _STORE_CACHE_TTL

    cached = _cache_get(store_key, ttl)
    if cached is not None:
        yield cached
        return

    all_products: list = []
    page = 1

    while page <= MAX_PAGES:
        url = f'https://www.canadacomputers.com/en/931/desktop-computers?page={page}'
        if store_id is not None:
            url += f'&pickup={store_id}'
        try:
            data = fetch_page(url, fast=store_id is not None)
        except Exception:
            break

        soup = BeautifulSoup(data, 'html.parser')
        articles = soup.find_all('article', class_='product-miniature')
        if not articles:
            break

        page_batch: list = []
        for product in articles:
            thumb = product.find('a', class_='product-thumbnail')
            item_code = thumb.get('data-id', '') if thumb else ''
            if not DESKTOP_ITEM_CODE_RE.match(item_code):
                continue
            desc_div = product.find('div', class_='product-description')
            if not desc_div:
                continue
            price = desc_div.get('data-price', 'N/A')
            regular_price = desc_div.get('data-regular_price', price)
            if price == regular_price:
                continue
            title_tag = product.find('h2', class_='product-title')
            if not title_tag:
                continue
            a_tag = title_tag.find('a')
            title = a_tag.text.strip()
            link = a_tag['href']
            avail_div = product.find('div', class_='available-tag')
            if avail_div:
                smalls = avail_div.find_all('small', class_='pq-hdr-bolder')
                online_availability = smalls[0].get_text(strip=True) if smalls else 'unknown'
                instore_availability = smalls[1].get_text(strip=True) if len(smalls) > 1 else 'unknown'
            else:
                online_availability = 'unknown'
                instore_availability = 'unknown'
            if store_id is not None:
                il = instore_availability.lower()
                if 'not available' in il or il == 'unknown':
                    continue
            img_tag = thumb.find('img') if thumb else None
            image_url = (img_tag.get('data-cc-src') or img_tag.get('src', '')) if img_tag else ''
            page_batch.append({
                'title': title, 'price': price, 'regular_price': regular_price,
                'item_code': item_code, 'online_availability': online_availability,
                'instore_availability': instore_availability, 'link': link,
                'image_url': image_url,
            })

        if page_batch:
            all_products.extend(page_batch)
            yield page_batch

        page += 1

    if all_products:
        _cache_set(store_key, all_products)


def _stream_laptop_deals_gen(store_id=None):
    """Generator: yields laptop deal page-batches from all 3 sub-category URLs."""
    store_key = f'lap_{store_id}' if store_id else _LAPTOP_CACHE_KEY

    cached = _cache_get(store_key, _LAPTOP_CACHE_TTL)
    if cached is not None:
        yield cached
        return

    all_products: list = []

    for base_url in _LAPTOP_URLS:
        page = 1
        while page <= MAX_PAGES:
            url = f'{base_url}?page={page}'
            if store_id is not None:
                url += f'&pickup={store_id}'
            try:
                data = fetch_page(url, fast=store_id is not None)
            except Exception:
                break

            soup = BeautifulSoup(data, 'html.parser')
            articles = soup.find_all('article', class_='product-miniature')
            if not articles:
                break

            page_batch: list = []
            for product in articles:
                thumb = product.find('a', class_='product-thumbnail')
                item_code = thumb.get('data-id', '') if thumb else ''
                desc_div = product.find('div', class_='product-description')
                if not desc_div:
                    continue
                price = desc_div.get('data-price', 'N/A')
                regular_price = desc_div.get('data-regular_price', price)
                if price == regular_price:
                    continue
                title_tag = product.find('h2', class_='product-title')
                if not title_tag:
                    continue
                a_tag = title_tag.find('a')
                title = a_tag.text.strip()
                link = a_tag['href']
                avail_div = product.find('div', class_='available-tag')
                if avail_div:
                    smalls = avail_div.find_all('small', class_='pq-hdr-bolder')
                    online_availability = smalls[0].get_text(strip=True) if smalls else 'unknown'
                    instore_availability = smalls[1].get_text(strip=True) if len(smalls) > 1 else 'unknown'
                else:
                    online_availability = 'unknown'
                    instore_availability = 'unknown'
                if store_id is not None:
                    il = instore_availability.lower()
                    if 'not available' in il or il == 'unknown':
                        continue
                img_tag = thumb.find('img') if thumb else None
                image_url = (img_tag.get('data-cc-src') or img_tag.get('src', '')) if img_tag else ''
                page_batch.append({
                    'title': title, 'price': price, 'regular_price': regular_price,
                    'item_code': item_code, 'online_availability': online_availability,
                    'instore_availability': instore_availability, 'link': link,
                    'image_url': image_url,
                })

            if page_batch:
                all_products.extend(page_batch)
                yield page_batch

            page += 1

    if all_products:
        _cache_set(store_key, all_products)


def stream_category_gen(category: str, store_id=None):
    """Public entry point: yields product batches for the given category."""
    if category == 'desktops':
        yield from _stream_desktop_deals_gen(store_id)
    elif category == 'memory':
        sk = f'mem_{store_id}' if store_id else _MEMORY_CACHE_KEY
        yield from _stream_sale_items_gen(
            'https://www.canadacomputers.com/en/1009/memory', store_id, sk, _MEMORY_CACHE_TTL)
    elif category == 'cpu':
        sk = f'cpu_{store_id}' if store_id else _CPU_CACHE_KEY
        yield from _stream_sale_items_gen(
            'https://www.canadacomputers.com/en/956/cpu', store_id, sk, _CPU_CACHE_TTL)
    elif category == 'gpu':
        sk = f'gpu_{store_id}' if store_id else _GPU_CACHE_KEY
        yield from _stream_sale_items_gen(
            'https://www.canadacomputers.com/en/914/graphics-cards', store_id, sk, _GPU_CACHE_TTL)
    elif category == 'laptops':
        yield from _stream_laptop_deals_gen(store_id)