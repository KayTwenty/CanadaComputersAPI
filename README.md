# CCDeals

A full-stack web app that tracks on-sale products at Canada Computers. The backend scrapes the Canada Computers website and caches results in SQLite. The frontend displays deals by category, sorted by biggest dollar savings, with optional filtering by store location.

Not affiliated with Canada Computers.


## Stack

Backend: Python, Flask, BeautifulSoup, SQLite

Frontend: Next.js 15, React, TypeScript, Tailwind CSS


## Setup

Clone the repository.

**Backend**

Create and activate a virtual environment:

    python -m venv env
    ./env/Scripts/activate

Install dependencies:

    pip install -r backend/requirements.txt

Run the API server:

    python backend/src/app.py

The server runs at http://127.0.0.1:5000 and begins caching deals in the background on startup.

**Frontend**

    cd frontend
    npm install
    npm run dev

The frontend runs at http://localhost:3000.


## API Endpoints

    GET /deals/desktops
    GET /deals/memory
    GET /deals/cpu
    GET /deals/gpu

All endpoints accept an optional `pickup` query parameter with a store ID to filter by in-store availability at a specific location.

    GET /search/<query>

Searches Canada Computers for a product by name. Accepts optional `price_min` and `price_max` query parameters.

    GET /status

Returns cache status for all scraped categories and store locations.


## Environment Variables

Set `NEXT_PUBLIC_SITE_URL` to your production domain before deploying the frontend.

