from flask import Flask
from flask_restful import Api

from endpoints import Search, DesktopDeals, MemoryDeals, CpuDeals, GpuDeals, CacheStatus
from services import start_deals_refresh

app = Flask(__name__)
api = Api(app)

api.add_resource(Search, '/search/<string:search_string>')
api.add_resource(DesktopDeals, '/deals/desktops')
api.add_resource(MemoryDeals, '/deals/memory')
api.add_resource(CpuDeals, '/deals/cpu')
api.add_resource(GpuDeals, '/deals/gpu')
api.add_resource(CacheStatus, '/status')

# Start background scrape when the server process loads
start_deals_refresh()

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)