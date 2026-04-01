from flask_restful import Resource
from flask import jsonify, request
from services import (
    product_search,
    get_cached_desktop_deals, get_cached_memory_deals,
    get_cached_cpu_deals, get_cached_gpu_deals, get_cached_laptop_deals,
    cache_status, VALID_STORE_IDS, rate_limit_check,
)


def _parse_store_id(raw) -> int | None:
    """Parse and validate a pickup store ID. Returns None if absent or invalid."""
    if raw is None:
        return None
    try:
        sid = int(raw)
        return sid if sid in VALID_STORE_IDS else None
    except (ValueError, TypeError):
        return None


def _cors(resp, status: int = 200):
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.status_code = status
    return resp


class MemoryDeals(Resource):
    def get(self):
        store_id = _parse_store_id(request.args.get('pickup'))
        return _cors(jsonify(get_cached_memory_deals(store_id=store_id)))


class CacheStatus(Resource):
    def get(self):
        return _cors(jsonify(cache_status()))


class Search(Resource):
    def get(self, search_string):
        ip = request.headers.get('X-Forwarded-For', request.remote_addr or '').split(',')[0].strip()
        if not rate_limit_check(ip, cost=3):  # search costs 3 tokens — hits live site
            return _cors(jsonify({'error': 'Too many requests — slow down.'}), 429)
        low  = request.args.get('price_min')
        high = request.args.get('price_max')
        return _cors(jsonify(product_search(search_string, low, high)))


class DesktopDeals(Resource):
    def get(self):
        store_id = _parse_store_id(request.args.get('pickup'))
        return _cors(jsonify(get_cached_desktop_deals(store_id=store_id)))


class CpuDeals(Resource):
    def get(self):
        store_id = _parse_store_id(request.args.get('pickup'))
        return _cors(jsonify(get_cached_cpu_deals(store_id=store_id)))


class GpuDeals(Resource):
    def get(self):
        store_id = _parse_store_id(request.args.get('pickup'))
        return _cors(jsonify(get_cached_gpu_deals(store_id=store_id)))


class LaptopDeals(Resource):
    def get(self):
        store_id = _parse_store_id(request.args.get('pickup'))
        return _cors(jsonify(get_cached_laptop_deals(store_id=store_id)))
