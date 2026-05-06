"""
scraper.py — HTTP client, page fetching, HTML parsing, and product search.

Exports:
  fetch_page()          — fetch a CC page via the shared HTTP/2 client
  _parse_product()      — parse one <article> element into a product dict
  _savings_dollars()    — sort key: dollar savings (sale vs regular price)
  _scrape_sale_items()  — scrape all on-sale products from a paginated URL
  product_search()      — full-text search across CC
  MAX_PAGES             — per-category hard page cap
  DESKTOP_ITEM_CODE_RE  — regex for filtering desktop product codes
"""
import random
import re
import time
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup

# Constants
MAX_PAGES = 10
DESKTOP_ITEM_CODE_RE = re.compile(r'^RT|^DT', re.IGNORECASE)

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/124.0.0.0 Safari/537.36',
]

# Shared HTTP/2 client with connection pooling. One TCP+TLS handshake per host
# is reused across every scrape, eliminating ~100-300 ms overhead per request.
_HTTP_CLIENT = httpx.Client(
    http2=True,
    timeout=httpx.Timeout(15.0, connect=10.0),
    limits=httpx.Limits(
        max_keepalive_connections=20,
        max_connections=40,
        keepalive_expiry=60.0,
    ),
    follow_redirects=True,
)

# HTTP fetching
def fetch_page(url: str, fast: bool = False, retries: int = 3) -> str:
    """Fetch a URL via the shared HTTP/2 keep-alive client with retry + backoff."""
    time.sleep(random.uniform(0.1, 0.3) if fast else random.uniform(0.4, 1.0))
    headers = {
        'User-Agent': random.choice(USER_AGENTS),
        'Accept-Language': 'en-CA,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
    last_exc: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            r = _HTTP_CLIENT.get(url, headers=headers)
            r.raise_for_status()
            return r.text
        except Exception as e:
            last_exc = e
            if attempt < retries:
                backoff = 2 ** attempt + random.uniform(0, 1)
                print(f'[deals] fetch_page attempt {attempt} failed ({e}). Retrying in {backoff:.1f}s...')
                time.sleep(backoff)
    raise last_exc  # type: ignore[misc]

# HTML parsing helpers
def _parse_product(product, store_id=None, on_sale_only: bool = True,
                   extra_fields: dict | None = None) -> dict | None:
    """Parse a single <article class="product-miniature"> element.

    Returns a product dict, or None if the item should be filtered out
    (not on sale when on_sale_only=True, or not in stock at store_id).
    extra_fields are merged into the result dict (e.g. {'drive_type': 'SSD'}).
    """
    thumb    = product.find('a', class_='product-thumbnail')
    item_code = thumb.get('data-id', '') if thumb else ''

    desc_div = product.find('div', class_='product-description')
    if not desc_div:
        return None

    price         = desc_div.get('data-price', 'N/A')
    regular_price = desc_div.get('data-regular_price', price)

    if on_sale_only and price == regular_price:
        return None

    title_tag = product.find('h2', class_='product-title')
    if not title_tag:
        return None
    a_tag = title_tag.find('a')
    title = a_tag.text.strip()
    link  = a_tag['href']

    avail_div = product.find('div', class_='available-tag')
    if avail_div:
        smalls = avail_div.find_all('small', class_='pq-hdr-bolder')
        online_availability  = smalls[0].get_text(strip=True) if smalls         else 'unknown'
        instore_availability = smalls[1].get_text(strip=True) if len(smalls) > 1 else 'unknown'
    else:
        online_availability  = 'unknown'
        instore_availability = 'unknown'

    if store_id is not None:
        il = instore_availability.lower()
        if 'not available' in il or il == 'unknown':
            return None

    img_tag   = thumb.find('img') if thumb else None
    image_url = (img_tag.get('data-cc-src') or img_tag.get('src', '')) if img_tag else ''

    item: dict = {
        'title': title,
        'price': price,
        'regular_price': regular_price,
        'item_code': item_code,
        'online_availability': online_availability,
        'instore_availability': instore_availability,
        'link': link,
        'image_url': image_url,
    }
    if extra_fields:
        item.update(extra_fields)
    return item

def _savings_dollars(p: dict) -> float:
    """Sort key: dollar savings descending."""
    try:
        return (
            float(p['regular_price'].replace('$', '').replace(',', ''))
            - float(p['price'].replace('$', '').replace(',', ''))
        )
    except (ValueError, AttributeError):
        return 0.0

# Generic category scraper
def _scrape_sale_items(base_url: str, store_id=None) -> dict:
    """Scrape all on-sale products from a paginated CC category page.
    Returns {'products': [...]} sorted by dollar savings descending."""
    output: dict = {'products': []}
    page = 1

    while page <= MAX_PAGES:
        url = f'{base_url}?page={page}'
        if store_id is not None:
            url += f'&pickup={store_id}'
        print(url)
        data = fetch_page(url, fast=store_id is not None)
        soup = BeautifulSoup(data, 'html.parser')

        articles = soup.find_all('article', class_='product-miniature')
        if not articles:
            break

        for product in articles:
            item = _parse_product(product, store_id=store_id, on_sale_only=True)
            if item:
                output['products'].append(item)

        page += 1

    output['products'].sort(key=_savings_dollars, reverse=True)
    return output

# Product search
def product_search(search_string: str, low, high) -> dict:
    """Full-text product search across Canada Computers, with optional price range."""
    output: dict = {'products': []}
    page = 1

    while page <= MAX_PAGES:
        url = f'https://www.canadacomputers.com/en/search?s={quote_plus(search_string)}&page={page}'
        print(url)
        data = fetch_page(url)
        soup = BeautifulSoup(data, 'html.parser')

        articles = soup.find_all('article', class_='product-miniature')
        if not articles:
            break

        for product in articles:
            title_tag = product.find('h2', class_='product-title')
            if not title_tag:
                continue
            a_tag = title_tag.find('a')
            title = a_tag.text.strip()
            link  = a_tag['href']

            desc_div  = product.find('div', class_='product-description')
            price     = desc_div.get('data-price', 'N/A') if desc_div else 'N/A'

            thumb     = product.find('a', class_='product-thumbnail')
            item_code = thumb.get('data-id', 'No Code') if thumb else 'No Code'

            avail_div = product.find('div', class_='available-tag')
            if avail_div:
                online_flag  = avail_div.get('data-stock_availability_online', '0')
                retail_flag  = avail_div.get('data-stock_availability_retail', '0')
                smalls = avail_div.find_all('small', class_='pq-hdr-bolder')
                online_availability  = (smalls[0].get_text(strip=True) if smalls
                                        else ('Available to Ship' if online_flag == '1'
                                              else 'Not Available Online'))
                instore_availability = (smalls[1].get_text(strip=True) if len(smalls) > 1
                                        else ('Available for Pickup' if retail_flag == '1'
                                              else 'Not Available In Store'))
            else:
                online_availability  = 'unknown'
                instore_availability = 'unknown'

            # Client-side price range filtering
            if low is not None and high is not None:
                try:
                    price_val = float(price.replace('$', '').replace(',', ''))
                    if not (float(low) <= price_val <= float(high)):
                        continue
                except (ValueError, AttributeError):
                    pass

            output['products'].append({
                'title': title,
                'price': price,
                'item_code': item_code,
                'online_availability': online_availability,
                'instore_availability': instore_availability,
                'link': link,
            })

        page += 1

    return output
