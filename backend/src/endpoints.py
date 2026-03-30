from flask_restful import Resource
from flask import jsonify, request
from services import product_search, get_cached_desktop_deals


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
        resp = jsonify(get_cached_desktop_deals())
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.status_code = 200
        return resp