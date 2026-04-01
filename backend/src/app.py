from flask import Flask, Response, request as flask_request, stream_with_context
from flask_restful import Api
import json

from endpoints import Search, DesktopDeals, MemoryDeals, CpuDeals, GpuDeals, LaptopDeals, CacheStatus
from services import start_deals_refresh, stream_category_gen, VALID_STORE_IDS

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
    category = flask_request.args.get('category', 'desktops')
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
        for batch in stream_category_gen(category, store_id):
            yield json.dumps({'batch': batch}) + '\n'
        yield json.dumps({'done': True}) + '\n'

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
