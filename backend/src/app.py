from flask import Flask, Response, request as flask_request, stream_with_context
from flask_restful import Api
import json

from endpoints import Search, DesktopDeals, MemoryDeals, CpuDeals, GpuDeals, LaptopDeals, CacheStatus
from services import start_deals_refresh, stream_category_gen, VALID_STORE_IDS, VALID_CATEGORIES, rate_limit_check

app = Flask(__name__)
api = Api(app)

api.add_resource(Search, '/search/<string:search_string>')
api.add_resource(DesktopDeals, '/deals/desktops')
api.add_resource(MemoryDeals, '/deals/memory')
api.add_resource(CpuDeals, '/deals/cpu')
api.add_resource(GpuDeals, '/deals/gpu')
api.add_resource(LaptopDeals, '/deals/laptops')
api.add_resource(CacheStatus, '/status')


@app.route('/deals/stream')
def deals_stream():
    ip = flask_request.headers.get('X-Forwarded-For', flask_request.remote_addr or '').split(',')[0].strip()
    if not rate_limit_check(ip, cost=1):
        return Response(
            json.dumps({'error': 'Too many requests — slow down.'}) + '\n',
            status=429,
            mimetype='application/json',
            headers={'Access-Control-Allow-Origin': '*'},
        )

    category = flask_request.args.get('category', 'desktops')
    if category not in VALID_CATEGORIES:
        return Response(
            json.dumps({'error': f'Unknown category "{category}". Valid: {sorted(VALID_CATEGORIES)}'}) + '\n',
            status=400,
            mimetype='application/json',
            headers={'Access-Control-Allow-Origin': '*'},
        )

    pickup_raw = flask_request.args.get('pickup')
    store_id = None
    if pickup_raw:
        try:
            store_id = int(pickup_raw)
            if store_id not in VALID_STORE_IDS:
                store_id = None
        except ValueError:
            pass

    def generate():
        try:
            for batch in stream_category_gen(category, store_id):
                yield json.dumps({'batch': batch}) + '\n'
            yield json.dumps({'done': True}) + '\n'
        except Exception as e:
            yield json.dumps({'error': str(e), 'done': True}) + '\n'

    return Response(
        stream_with_context(generate()),
        mimetype='application/x-ndjson',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Access-Control-Allow-Origin': '*',
        },
    )


# Start background scrape when the server process loads
start_deals_refresh()

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)
