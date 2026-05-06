"""
services.py - Public re-export facade.

endpoints.py and app.py continue to import from services unchanged.
All logic now lives in cache.py, scraper.py, and categories.py.
"""
from cache import (
    cache_status,
    VALID_STORE_IDS,
    VALID_CATEGORIES,
    rate_limit_check,
)
from scraper import product_search
from categories import (
    start_deals_refresh,
    stream_category_gen,
    get_cached_desktop_deals,
    get_cached_memory_deals,
    get_cached_cpu_deals,
    get_cached_gpu_deals,
    get_cached_laptop_deals,
    get_cached_motherboard_deals,
    get_cached_psu_deals,
    get_cached_ssd_deals,
    get_cached_hdd_deals,
    get_cached_drives_deals,
    get_cached_coolers_deals,
    get_cached_cases_deals,
)

__all__ = [
    'cache_status', 'VALID_STORE_IDS', 'VALID_CATEGORIES', 'rate_limit_check',
    'product_search',
    'start_deals_refresh', 'stream_category_gen',
    'get_cached_desktop_deals', 'get_cached_memory_deals', 'get_cached_cpu_deals',
    'get_cached_gpu_deals', 'get_cached_laptop_deals', 'get_cached_motherboard_deals',
    'get_cached_psu_deals', 'get_cached_ssd_deals', 'get_cached_hdd_deals',
    'get_cached_drives_deals', 'get_cached_coolers_deals', 'get_cached_cases_deals',
]
