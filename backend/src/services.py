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
_CACHE_TTL = 30 * 60          # 30 minutes for all-stores background refresh
_STORE_CACHE_TTL = 30 * 60    # 30 minutes for per-store results too
_MEMORY_CACHE_TTL = 30 * 60   # 30 minutes for memory deals
_CPU_CACHE_TTL = 30 * 60      # 30 minutes for CPU deals
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

    entries = []
    for store_key, scraped_at, byte_len in rows:
        age = int(now - scraped_at)
        ttl = _CACHE_TTL if store_key == _ALL_STORES_KEY else _STORE_CACHE_TTL
        entries.append({
            'store_key': store_key,
            'age_seconds': age,
            'expires_in_seconds': max(0, int(ttl - age)),
            'fresh': age < ttl,
            'cached_bytes': byte_len,
        })

    entries.sort(key=lambda e: e['store_key'])
    all_stores_entry = next((e for e in entries if e['store_key'] == _ALL_STORES_KEY), None)
    store_entries = [e for e in entries if e['store_key'] != _ALL_STORES_KEY]

    return {
        'all_stores': all_stores_entry,
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

# Background refresh — all-stores cache, runs every 30 minutes

_bg_fetching = False
_bg_lock = threading.Lock()

def _refresh_all_stores():
    global _bg_fetching
    with _bg_lock:
        if _bg_fetching:
            return
        _bg_fetching = True
    try:
        print('[deals] Starting background scrape (all stores)...')
        result = desktop_deals()
        if result['products']:
            _cache_set(_ALL_STORES_KEY, result['products'])
        print(f"[deals] Done. {len(result['products'])} deals cached.")
    except Exception as e:
        print(f'[deals] Background scrape failed: {e}')
    finally:
        with _bg_lock:
            _bg_fetching = False

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
    On startup: if the all-stores cache is still fresh, pre-load any stale per-store
    caches and wait out the remaining TTL. Otherwise scrape everything now.
    Repeats every 30 minutes.
    """
    # One-time startup check — use existing cache if still fresh
    with _db_lock:
        conn = _db_connect()
        try:
            row = conn.execute(
                'SELECT scraped_at FROM deals_cache WHERE store_key = ?',
                (_ALL_STORES_KEY,)
            ).fetchone()
        finally:
            conn.close()

    if row:
        age = time.time() - row[0]
        remaining = _CACHE_TTL - age
        if remaining > 0:
            print(f'[deals] Cache is fresh ({int(age)}s old). Pre-loading store locations + memory + CPU; next full scrape in {int(remaining)}s.')
            _refresh_store_locations()
            _refresh_memory()
            _refresh_cpu()
            time.sleep(remaining)

    while True:
        _refresh_all_stores()
        _refresh_store_locations()
        _refresh_memory()
        _refresh_cpu()
        time.sleep(_CACHE_TTL)

def _refresh_memory():
    """Scrape and cache memory deals if stale."""
    if _cache_get(_MEMORY_CACHE_KEY, _MEMORY_CACHE_TTL) is not None:
        return
    try:
        print('[memory] Starting background scrape...')
        result = memory_deals()
        if result['products']:
            _cache_set(_MEMORY_CACHE_KEY, result['products'])
        print(f"[memory] Done. {len(result['products'])} deals cached.")
    except Exception as e:
        print(f'[memory] Background scrape failed: {e}')

def _refresh_cpu():
    """Scrape and cache CPU deals if stale."""
    if _cache_get(_CPU_CACHE_KEY, _CPU_CACHE_TTL) is not None:
        return
    try:
        print('[cpu] Starting background scrape...')
        result = cpu_deals()
        if result['products']:
            _cache_set(_CPU_CACHE_KEY, result['products'])
        print(f"[cpu] Done. {len(result['products'])} deals cached.")
    except Exception as e:
        print(f'[cpu] Background scrape failed: {e}')

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

MAX_PAGES = 10  # hard cap per category to avoid runaway scrapes

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


def memory_deals(store_id=None):
    """Scrape on-sale memory/RAM products from Canada Computers."""
    output = {'products': []}
    page = 1

    while page <= MAX_PAGES:
        url = f'https://www.canadacomputers.com/en/1009/memory?page={page}'
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

            # Only on-sale items
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


def cpu_deals(store_id=None):
    """Scrape on-sale CPU/processor products from Canada Computers."""
    output = {'products': []}
    page = 1

    while page <= MAX_PAGES:
        url = f'https://www.canadacomputers.com/en/956/cpu?page={page}'
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

            # Only on-sale items
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