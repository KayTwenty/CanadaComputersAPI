from flask import request, jsonify
from bs4 import BeautifulSoup

from urllib.request import urlopen, Request
from urllib.parse import quote_plus

import re
import time
import random
import threading

# --- Background deals cache ---
_deals_cache = {'products': []}
_deals_lock = threading.Lock()
_deals_fetching = False

def get_cached_desktop_deals():
    with _deals_lock:
        return dict(_deals_cache)

def _refresh_deals_background():
    global _deals_fetching
    with _deals_lock:
        if _deals_fetching:
            return
        _deals_fetching = True
    try:
        print('[deals] Starting background scrape...')
        result = desktop_deals()
        with _deals_lock:
            _deals_cache['products'] = result['products']
        print(f"[deals] Done. {len(result['products'])} deals cached.")
    except Exception as e:
        print(f'[deals] Background scrape failed: {e}')
    finally:
        with _deals_lock:
            _deals_fetching = False

def start_deals_refresh():
    """Kick off a background thread to (re)populate the deals cache."""
    t = threading.Thread(target=_refresh_deals_background, daemon=True)
    t.start()

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/124.0.0.0 Safari/537.36',
]

def fetch_page(url):
    """Fetch a URL with a random User-Agent and a random delay to avoid rate limiting."""
    time.sleep(random.uniform(1.5, 3.5))
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


def desktop_deals():
    output = {'products': []}
    page = 1

    while True:
        url = f'https://www.canadacomputers.com/en/931/desktop-computers?page={page}'
        print(url)
        data = fetch_page(url)
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

            # Only include items on sale and under $2500
            if price == regular_price:
                continue

            try:
                price_val = float(price.replace('$', '').replace(',', ''))
                if price_val >= 2500:
                    continue
            except (ValueError, AttributeError):
                pass

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

    def discount_pct(p):
        try:
            sale = float(p['price'].replace('$', '').replace(',', ''))
            reg = float(p['regular_price'].replace('$', '').replace(',', ''))
            return (reg - sale) / reg if reg > 0 else 0
        except (ValueError, AttributeError):
            return 0

    output['products'].sort(key=discount_pct, reverse=True)
    return output