from flask_restful import Resource
from flask import jsonify, request
from services import product_search, get_cached_desktop_deals, VALID_STORE_IDS


class Search(Resource):
    def get(self, search_string):
        args = request.args
        low = args.get('price_min', None)
        high = args.get('price_max', None)
        resp = jsonify(product_search(search_string, low, high))
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.status_code = 200
        return resp


class DesktopDeals(Resource):
    def get(self):
        pickup_raw = request.args.get('pickup', None)
        store_id = None
        if pickup_raw is not None:
            try:
                store_id = int(pickup_raw)
                if store_id not in VALID_STORE_IDS:
                    store_id = None
            except ValueError:
                store_id = None
        resp = jsonify(get_cached_desktop_deals(store_id=store_id))
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.status_code = 200
        return resp