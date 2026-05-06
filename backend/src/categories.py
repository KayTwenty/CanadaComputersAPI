"""
categories.py — All category deal scrapers, cached getters, streaming generators,
                and the background warm-up loop.

Imports from cache.py and scraper.py; no circular dependencies.
"""
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from bs4 import BeautifulSoup

from cache import (
    _ALL_STORES_KEY,
    _CACHE_TTL, _STORE_CACHE_TTL,
    _MEMORY_CACHE_KEY,      _MEMORY_CACHE_TTL,
    _CPU_CACHE_KEY,         _CPU_CACHE_TTL,
    _GPU_CACHE_KEY,         _GPU_CACHE_TTL,
    _LAPTOP_CACHE_KEY,      _LAPTOP_CACHE_TTL,
    _MOTHERBOARD_CACHE_KEY, _MOTHERBOARD_CACHE_TTL,
    _PSU_CACHE_KEY,         _PSU_CACHE_TTL,
    _SSD_CACHE_KEY,         _SSD_CACHE_TTL,
    _HDD_CACHE_KEY,         _HDD_CACHE_TTL,
    _DRIVES_CACHE_KEY,      _DRIVES_CACHE_TTL,
    _COOLERS_CACHE_KEY,     _COOLERS_CACHE_TTL,
    _CASES_CACHE_KEY,       _CASES_CACHE_TTL,
    _PROACTIVE_TTL,
    VALID_STORE_IDS,
    _cache_get, _cache_get_with_age, _cache_set,
    _get_scrape_lock, _serve_or_swr, _trigger_bg_refresh, _bg_refresh,
    _get_or_scrape,
)
from scraper import (
    fetch_page,
    _scrape_sale_items,
    _parse_product,
    _savings_dollars,
    MAX_PAGES,
    DESKTOP_ITEM_CODE_RE,
)

_PRELOAD_WORKERS = 4  # parallel store scrapers

# ── Category URL lists ─────────────────────────────────────────────────────────
_LAPTOP_URLS = [
    ('https://www.canadacomputers.com/en/98/windows-laptops',      'Windows'),
    ('https://www.canadacomputers.com/en/93/business-laptops',     'Business'),
    ('https://www.canadacomputers.com/en/103/gaming-laptops',      'Gaming'),
    ('https://www.canadacomputers.com/en/102/refurbished-laptops', 'Refurbished'),
]
_DRIVES_URLS = [
    ('https://www.canadacomputers.com/en/1291/desktop-laptop-internal-ssds', 'SSD'),
    ('https://www.canadacomputers.com/en/895/desktop-internal-hard-drives',  'HDD'),
]
_COOLERS_URLS = [
    ('https://www.canadacomputers.com/en/928/cpu-air-coolers',        'Air'),
    ('https://www.canadacomputers.com/en/930/aio-cpu-liquid-coolers', 'Liquid'),
    ('https://www.canadacomputers.com/en/927/case-fans',              'Case Fan'),
]
_CASES_URLS = [
    ('https://www.canadacomputers.com/en/1389/mid-tower-cases',                  'Mid Tower'),
    ('https://www.canadacomputers.com/en/1388/full-tower-cases',                 'Full Tower'),
    ('https://www.canadacomputers.com/en/1387/small-form-factor-mini-itx-cases', 'ITX/mATX'),
]


# ── Generic multi-URL helpers ──────────────────────────────────────────────────
def _multi_url_deals(url_type_list: list, type_field: str, store_id=None) -> dict:
    """Scrape multiple sub-category URLs, tagging each product with type_field."""
    combined: list = []
    for url, type_value in url_type_list:
        result = _scrape_sale_items(url, store_id)
        for p in result['products']:
            p[type_field] = type_value
        combined.extend(result['products'])
    combined.sort(key=_savings_dollars, reverse=True)
    return {'products': combined}


def _stream_typed_gen(url_type_list: list, type_field: str,
                      cache_key: str, store_key_prefix: str,
                      ttl: float, deals_fn,
                      store_id=None, on_sale_only: bool = True):
    """Generic streaming generator for multi-URL categories.

    Iterates over url_type_list, tags each product with type_field, and
    yields page-batches. Uses SWR: returns cached data immediately and
    triggers a background refresh when the cache is older than _PROACTIVE_TTL.
    Falls back to the global cache when a per-store scrape returns nothing.
    """
    base_store_key = f'{store_key_prefix}{store_id}' if store_id else cache_key
    store_key      = base_store_key if on_sale_only else f'full_{base_store_key}'
    global_key     = cache_key if on_sale_only else f'full_{cache_key}'

    cached, age = _cache_get_with_age(store_key)
    if cached is not None:
        if age is not None and age >= _PROACTIVE_TTL:
            _trigger_bg_refresh(store_key, ttl,
                                lambda: deals_fn(store_id=store_id),
                                f'{store_key_prefix}{store_key}')
        yield cached
        return

    all_products: list = []

    for base_url, type_value in url_type_list:
        page = 1
        while page <= MAX_PAGES:
            url = f'{base_url}?page={page}'
            if store_id is not None:
                url += f'&pickup={store_id}'
            try:
                data = fetch_page(url, fast=store_id is not None)
            except Exception:
                break

            soup     = BeautifulSoup(data, 'html.parser')
            articles = soup.find_all('article', class_='product-miniature')
            if not articles:
                break

            page_batch: list = []
            for product in articles:
                item = _parse_product(product, store_id=store_id,
                                      on_sale_only=on_sale_only,
                                      extra_fields={type_field: type_value})
                if item:
                    page_batch.append(item)

            if page_batch:
                all_products.extend(page_batch)
                yield page_batch

            page += 1

    if all_products:
        _cache_set(store_key, all_products)
    elif store_id is not None:
        global_products, _ = _cache_get_with_age(global_key)
        if global_products:
            yield global_products


# ── Simple single-URL categories ───────────────────────────────────────────────
def memory_deals(store_id=None) -> dict:
    return _scrape_sale_items('https://www.canadacomputers.com/en/1009/memory', store_id)

def cpu_deals(store_id=None) -> dict:
    return _scrape_sale_items('https://www.canadacomputers.com/en/956/cpu', store_id)

def gpu_deals(store_id=None) -> dict:
    return _scrape_sale_items('https://www.canadacomputers.com/en/914/graphics-cards', store_id)

def motherboard_deals(store_id=None) -> dict:
    return _scrape_sale_items('https://www.canadacomputers.com/en/53/motherboards', store_id)

def psu_deals(store_id=None) -> dict:
    return _scrape_sale_items('https://www.canadacomputers.com/en/1346/power-supplies', store_id)

def ssd_deals(store_id=None) -> dict:
    return _scrape_sale_items('https://www.canadacomputers.com/en/1291/desktop-laptop-internal-ssds', store_id)

def hdd_deals(store_id=None) -> dict:
    return _scrape_sale_items('https://www.canadacomputers.com/en/895/desktop-internal-hard-drives', store_id)


# ── Desktop (special: item-code filter) ───────────────────────────────────────
def desktop_deals(store_id=None) -> dict:
    """Scrape on-sale desktop computers, filtered to RT/DT item codes."""
    output: dict = {'products': []}
    page = 1

    while page <= MAX_PAGES:
        url = f'https://www.canadacomputers.com/en/931/desktop-computers?page={page}'
        if store_id is not None:
            url += f'&pickup={store_id}'
        print(url)
        data = fetch_page(url, fast=store_id is not None)
        soup = BeautifulSoup(data, 'html.parser')

        articles = soup.find_all('article', class_='product-miniature')
        if not articles:
            break

        for product in articles:
            thumb     = product.find('a', class_='product-thumbnail')
            item_code = thumb.get('data-id', '') if thumb else ''
            if not DESKTOP_ITEM_CODE_RE.match(item_code):
                continue
            item = _parse_product(product, store_id=store_id, on_sale_only=True)
            if item:
                output['products'].append(item)

        page += 1

    output['products'].sort(key=_savings_dollars, reverse=True)
    return output


# ── Multi-URL categories ───────────────────────────────────────────────────────
def laptop_deals(store_id=None) -> dict:
    return _multi_url_deals(_LAPTOP_URLS, 'laptop_type', store_id)

def drives_deals(store_id=None) -> dict:
    return _multi_url_deals(_DRIVES_URLS, 'drive_type', store_id)

def coolers_deals(store_id=None) -> dict:
    return _multi_url_deals(_COOLERS_URLS, 'cooler_type', store_id)

def cases_deals(store_id=None) -> dict:
    return _multi_url_deals(_CASES_URLS, 'case_type', store_id)


# ── Cached getters ─────────────────────────────────────────────────────────────
def get_cached_desktop_deals(store_id=None) -> dict:
    store_key = _ALL_STORES_KEY if store_id is None else str(store_id)
    ttl       = _CACHE_TTL if store_id is None else _STORE_CACHE_TTL

    stale = _serve_or_swr(store_key, ttl,
                          lambda: desktop_deals(store_id=store_id),
                          f'desktops/{store_key}')
    if stale is not None:
        return {'products': stale}

    lock = _get_scrape_lock(store_key)
    with lock:
        products = _cache_get(store_key, ttl)
        if products is not None:
            return {'products': products}
        result = desktop_deals(store_id=store_id)
        if result['products']:
            _cache_set(store_key, result['products'])
        return result


def get_cached_memory_deals(store_id=None) -> dict:
    sk = _MEMORY_CACHE_KEY if store_id is None else f'mem_{store_id}'
    return _get_or_scrape(_MEMORY_CACHE_KEY, sk, _MEMORY_CACHE_TTL,
                          memory_deals, 'memory', store_id)

def get_cached_cpu_deals(store_id=None) -> dict:
    sk = _CPU_CACHE_KEY if store_id is None else f'cpu_{store_id}'
    return _get_or_scrape(_CPU_CACHE_KEY, sk, _CPU_CACHE_TTL,
                          cpu_deals, 'cpu', store_id)

def get_cached_gpu_deals(store_id=None) -> dict:
    sk = _GPU_CACHE_KEY if store_id is None else f'gpu_{store_id}'
    return _get_or_scrape(_GPU_CACHE_KEY, sk, _GPU_CACHE_TTL,
                          gpu_deals, 'gpu', store_id)

def get_cached_laptop_deals(store_id=None) -> dict:
    sk = _LAPTOP_CACHE_KEY if store_id is None else f'lap_{store_id}'
    return _get_or_scrape(_LAPTOP_CACHE_KEY, sk, _LAPTOP_CACHE_TTL,
                          laptop_deals, 'laptops', store_id)

def get_cached_motherboard_deals(store_id=None) -> dict:
    sk = _MOTHERBOARD_CACHE_KEY if store_id is None else f'mob_{store_id}'
    return _get_or_scrape(_MOTHERBOARD_CACHE_KEY, sk, _MOTHERBOARD_CACHE_TTL,
                          motherboard_deals, 'motherboards', store_id)

def get_cached_psu_deals(store_id=None) -> dict:
    sk = _PSU_CACHE_KEY if store_id is None else f'psu_{store_id}'
    return _get_or_scrape(_PSU_CACHE_KEY, sk, _PSU_CACHE_TTL,
                          psu_deals, 'psu', store_id)

def get_cached_ssd_deals(store_id=None) -> dict:
    sk = _SSD_CACHE_KEY if store_id is None else f'ssd_{store_id}'
    return _get_or_scrape(_SSD_CACHE_KEY, sk, _SSD_CACHE_TTL,
                          ssd_deals, 'ssd', store_id)

def get_cached_hdd_deals(store_id=None) -> dict:
    sk = _HDD_CACHE_KEY if store_id is None else f'hdd_{store_id}'
    return _get_or_scrape(_HDD_CACHE_KEY, sk, _HDD_CACHE_TTL,
                          hdd_deals, 'hdd', store_id)

def get_cached_drives_deals(store_id=None) -> dict:
    sk = _DRIVES_CACHE_KEY if store_id is None else f'drv_{store_id}'
    return _get_or_scrape(_DRIVES_CACHE_KEY, sk, _DRIVES_CACHE_TTL,
                          drives_deals, 'drives', store_id)

def get_cached_coolers_deals(store_id=None) -> dict:
    sk = _COOLERS_CACHE_KEY if store_id is None else f'clr_{store_id}'
    return _get_or_scrape(_COOLERS_CACHE_KEY, sk, _COOLERS_CACHE_TTL,
                          coolers_deals, 'coolers', store_id)

def get_cached_cases_deals(store_id=None) -> dict:
    sk = _CASES_CACHE_KEY if store_id is None else f'cas_{store_id}'
    return _get_or_scrape(_CASES_CACHE_KEY, sk, _CASES_CACHE_TTL,
                          cases_deals, 'cases', store_id)


# ── Store preloading ───────────────────────────────────────────────────────────
def _preload_one_store(store_id: int) -> bool:
    """Scrape and cache a single store. Returns True if newly cached."""
    store_key = str(store_id)
    lock = _get_scrape_lock(store_key)
    with lock:
        if _cache_get(store_key, _STORE_CACHE_TTL) is not None:
            return False
        result = desktop_deals(store_id=store_id)
        if result['products']:
            _cache_set(store_key, result['products'])
            return True
        return False


def _refresh_store_locations() -> None:
    """Pre-scrape every store location that isn't already cached."""
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


# ── Streaming generators ───────────────────────────────────────────────────────
def _stream_sale_items_gen(base_url: str, store_id, store_cache_key: str, ttl: float,
                           scrape_fn=None, label: str = 'stream',
                           global_cache_key: str | None = None,
                           on_sale_only: bool = True):
    """Generator: yields page-batches for a single-URL category.

    SWR: returns cached data immediately, triggers background refresh when stale.
    Falls back to the global cache when a per-store scrape returns nothing.
    A 'full_' prefix separates all-products cache from deals-only cache.
    """
    if not on_sale_only:
        store_cache_key = f'full_{store_cache_key}'
        if global_cache_key:
            global_cache_key = f'full_{global_cache_key}'

    cached, age = _cache_get_with_age(store_cache_key)
    if cached is not None:
        if age is not None and age >= _PROACTIVE_TTL and scrape_fn is not None:
            _trigger_bg_refresh(store_cache_key, ttl, scrape_fn, label)
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

        soup     = BeautifulSoup(data, 'html.parser')
        articles = soup.find_all('article', class_='product-miniature')
        if not articles:
            break

        page_batch: list = []
        for product in articles:
            item = _parse_product(product, store_id=store_id, on_sale_only=on_sale_only)
            if item:
                page_batch.append(item)

        if page_batch:
            all_products.extend(page_batch)
            yield page_batch

        page += 1

    if all_products:
        _cache_set(store_cache_key, all_products)
    elif store_id is not None and global_cache_key:
        global_products, _ = _cache_get_with_age(global_cache_key)
        if global_products:
            yield global_products


def _stream_desktop_deals_gen(store_id=None, on_sale_only: bool = True):
    """Generator: yields desktop deal page-batches (RT/DT item codes only)."""
    base_store_key = _ALL_STORES_KEY if store_id is None else str(store_id)
    store_key      = base_store_key if on_sale_only else f'full_{base_store_key}'
    global_key     = _ALL_STORES_KEY if on_sale_only else f'full_{_ALL_STORES_KEY}'
    ttl            = _CACHE_TTL if store_id is None else _STORE_CACHE_TTL

    cached, age = _cache_get_with_age(store_key)
    if cached is not None:
        if age is not None and age >= _PROACTIVE_TTL:
            _trigger_bg_refresh(store_key, ttl,
                                lambda: desktop_deals(store_id=store_id),
                                f'desktops/{store_key}')
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

        soup     = BeautifulSoup(data, 'html.parser')
        articles = soup.find_all('article', class_='product-miniature')
        if not articles:
            break

        page_batch: list = []
        for product in articles:
            thumb     = product.find('a', class_='product-thumbnail')
            item_code = thumb.get('data-id', '') if thumb else ''
            if not DESKTOP_ITEM_CODE_RE.match(item_code):
                continue
            item = _parse_product(product, store_id=store_id, on_sale_only=on_sale_only)
            if item:
                page_batch.append(item)

        if page_batch:
            all_products.extend(page_batch)
            yield page_batch

        page += 1

    if all_products:
        _cache_set(store_key, all_products)
    elif store_id is not None:
        global_products, _ = _cache_get_with_age(global_key)
        if global_products:
            yield global_products


def stream_category_gen(category: str, store_id=None, on_sale_only: bool = True):
    """Public entry point: yield product batches for the given category."""
    if category == 'desktops':
        yield from _stream_desktop_deals_gen(store_id, on_sale_only=on_sale_only)

    elif category == 'memory':
        sk = f'mem_{store_id}' if store_id else _MEMORY_CACHE_KEY
        yield from _stream_sale_items_gen(
            'https://www.canadacomputers.com/en/1009/memory',
            store_id, sk, _MEMORY_CACHE_TTL,
            scrape_fn=lambda: memory_deals(store_id=store_id),
            label=f'memory/{sk}',
            global_cache_key=_MEMORY_CACHE_KEY, on_sale_only=on_sale_only)

    elif category == 'cpu':
        sk = f'cpu_{store_id}' if store_id else _CPU_CACHE_KEY
        yield from _stream_sale_items_gen(
            'https://www.canadacomputers.com/en/956/cpu',
            store_id, sk, _CPU_CACHE_TTL,
            scrape_fn=lambda: cpu_deals(store_id=store_id),
            label=f'cpu/{sk}',
            global_cache_key=_CPU_CACHE_KEY, on_sale_only=on_sale_only)

    elif category == 'gpu':
        sk = f'gpu_{store_id}' if store_id else _GPU_CACHE_KEY
        yield from _stream_sale_items_gen(
            'https://www.canadacomputers.com/en/914/graphics-cards',
            store_id, sk, _GPU_CACHE_TTL,
            scrape_fn=lambda: gpu_deals(store_id=store_id),
            label=f'gpu/{sk}',
            global_cache_key=_GPU_CACHE_KEY, on_sale_only=on_sale_only)

    elif category == 'laptops':
        yield from _stream_typed_gen(
            _LAPTOP_URLS, 'laptop_type',
            _LAPTOP_CACHE_KEY, 'lap_',
            _LAPTOP_CACHE_TTL, laptop_deals,
            store_id, on_sale_only)

    elif category == 'motherboards':
        sk = f'mob_{store_id}' if store_id else _MOTHERBOARD_CACHE_KEY
        yield from _stream_sale_items_gen(
            'https://www.canadacomputers.com/en/53/motherboards',
            store_id, sk, _MOTHERBOARD_CACHE_TTL,
            scrape_fn=lambda: motherboard_deals(store_id=store_id),
            label=f'motherboards/{sk}',
            global_cache_key=_MOTHERBOARD_CACHE_KEY, on_sale_only=on_sale_only)

    elif category == 'psu':
        sk = f'psu_{store_id}' if store_id else _PSU_CACHE_KEY
        yield from _stream_sale_items_gen(
            'https://www.canadacomputers.com/en/1346/power-supplies',
            store_id, sk, _PSU_CACHE_TTL,
            scrape_fn=lambda: psu_deals(store_id=store_id),
            label=f'psu/{sk}',
            global_cache_key=_PSU_CACHE_KEY, on_sale_only=on_sale_only)

    elif category == 'ssd':
        sk = f'ssd_{store_id}' if store_id else _SSD_CACHE_KEY
        yield from _stream_sale_items_gen(
            'https://www.canadacomputers.com/en/1291/desktop-laptop-internal-ssds',
            store_id, sk, _SSD_CACHE_TTL,
            scrape_fn=lambda: ssd_deals(store_id=store_id),
            label=f'ssd/{sk}',
            global_cache_key=_SSD_CACHE_KEY, on_sale_only=on_sale_only)

    elif category == 'hdd':
        sk = f'hdd_{store_id}' if store_id else _HDD_CACHE_KEY
        yield from _stream_sale_items_gen(
            'https://www.canadacomputers.com/en/895/desktop-internal-hard-drives',
            store_id, sk, _HDD_CACHE_TTL,
            scrape_fn=lambda: hdd_deals(store_id=store_id),
            label=f'hdd/{sk}',
            global_cache_key=_HDD_CACHE_KEY, on_sale_only=on_sale_only)

    elif category == 'drives':
        yield from _stream_typed_gen(
            _DRIVES_URLS, 'drive_type',
            _DRIVES_CACHE_KEY, 'drv_',
            _DRIVES_CACHE_TTL, drives_deals,
            store_id, on_sale_only)

    elif category == 'coolers':
        yield from _stream_typed_gen(
            _COOLERS_URLS, 'cooler_type',
            _COOLERS_CACHE_KEY, 'clr_',
            _COOLERS_CACHE_TTL, coolers_deals,
            store_id, on_sale_only)

    elif category == 'cases':
        yield from _stream_typed_gen(
            _CASES_URLS, 'case_type',
            _CASES_CACHE_KEY, 'cas_',
            _CASES_CACHE_TTL, cases_deals,
            store_id, on_sale_only)


# ── Background warm-up loop ────────────────────────────────────────────────────
def _background_loop() -> None:
    """
    Keeps all global caches warm via proactive stale-while-revalidate:
    - On startup:  refreshes every stale/missing global cache in parallel,
                   then pre-loads all per-store desktop caches.
    - Every 60 s:  fires background threads for any cache past 80 % of its TTL.
    """
    _JOBS = [
        (_ALL_STORES_KEY,        _CACHE_TTL,            desktop_deals,     'desktops'),
        (_MEMORY_CACHE_KEY,      _MEMORY_CACHE_TTL,     memory_deals,      'memory'),
        (_CPU_CACHE_KEY,         _CPU_CACHE_TTL,        cpu_deals,         'cpu'),
        (_GPU_CACHE_KEY,         _GPU_CACHE_TTL,        gpu_deals,         'gpu'),
        (_LAPTOP_CACHE_KEY,      _LAPTOP_CACHE_TTL,     laptop_deals,      'laptops'),
        (_MOTHERBOARD_CACHE_KEY, _MOTHERBOARD_CACHE_TTL, motherboard_deals, 'motherboards'),
        (_PSU_CACHE_KEY,         _PSU_CACHE_TTL,        psu_deals,         'psu'),
        (_SSD_CACHE_KEY,         _SSD_CACHE_TTL,        ssd_deals,         'ssd'),
        (_HDD_CACHE_KEY,         _HDD_CACHE_TTL,        hdd_deals,         'hdd'),
        (_DRIVES_CACHE_KEY,      _DRIVES_CACHE_TTL,     drives_deals,      'drives'),
        (_COOLERS_CACHE_KEY,     _COOLERS_CACHE_TTL,    coolers_deals,     'coolers'),
        (_CASES_CACHE_KEY,       _CASES_CACHE_TTL,      cases_deals,       'cases'),
    ]

    print('[deals] Startup: warming all global caches in parallel...')
    with ThreadPoolExecutor(max_workers=len(_JOBS)) as pool:
        for args in _JOBS:
            pool.submit(_bg_refresh, *args)

    _refresh_store_locations()

    while True:
        time.sleep(60)
        for args in _JOBS:
            t = threading.Thread(target=_bg_refresh, args=args, daemon=True)
            t.start()


def start_deals_refresh() -> None:
    """Start the background cache warm-up loop in a daemon thread."""
    t = threading.Thread(target=_background_loop, daemon=True)
    t.start()
