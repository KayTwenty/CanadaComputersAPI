import { NextRequest, NextResponse } from 'next/server';

// Allow long-running scrapes in production (cold cache can take several minutes)
export const maxDuration = 300;

const FLASK = process.env.FLASK_INTERNAL_URL ?? 'http://127.0.0.1:5000';

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const category = params.get('category') ?? 'desktops';
    const pickup = params.get('pickup');

    let url = `${FLASK}/deals/stream?category=${encodeURIComponent(category)}`;
    if (pickup) url += `&pickup=${encodeURIComponent(pickup)}`;

    try {
        // No timeout — let the Flask stream complete naturally.
        // Flask itself handles retries and page limits; the browser will
        // disconnect if the user navigates away.
        const res = await fetch(url, {
            cache: 'no-store',
        });

        if (!res.ok || !res.body) {
            return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 });
        }

        return new Response(res.body, {
            headers: {
                'Content-Type': 'application/x-ndjson',
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no',
            },
        });
    } catch {
        return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 });
    }
}
