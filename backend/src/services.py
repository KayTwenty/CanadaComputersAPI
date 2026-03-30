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

# ---------------------------------------------------------------------------
# SQLite cache
# ---------------------------------------------------------------------------
_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'cache.db')
_ALL_STORES_KEY = '__all__'
_CACHE_TTL = 30 * 60          # 30 minutes for all-stores background refresh
_STORE_CACHE_TTL = 30 * 60    # 30 minutes for per-store results too
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

# ---------------------------------------------------------------------------
# Public cache helpers
# ---------------------------------------------------------------------------
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

# ---------------------------------------------------------------------------
# Background refresh — all-stores cache, runs every 30 minutes
# ---------------------------------------------------------------------------
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

def _background_loop():
    """Run immediately, then repeat every 30 minutes."""
    while True:
        _refresh_all_stores()
        time.sleep(_CACHE_TTL)

def start_deals_refresh():
    t = threading.Thread(target=_background_loop, daemon=True)
    t.start()

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/124.0.0.0 Safari/537.36',
]

def fetch_page(url, fast=False):
    """Fetch a URL with a random User-Agent and a random delay to avoid rate limiting."""
    time.sleep(random.uniform(0.4, 0.9) if fast else random.uniform(1.5, 3.5))
    headers = {
        'User-Agent': random.choice(USER_AGENTS),
        'Accept-Language': 'en-CA,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
    req = Request(url, headers=headers)
    return urlopen(req).read().decode()

def generate_search_url(s, page):
    return f'https://www.canadacomputers.com/en/search?s={s}&page={page}'

def product_search(search_string, low, high):
    output = {'products': []}

    page = 1

    while True:
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

    while True:
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