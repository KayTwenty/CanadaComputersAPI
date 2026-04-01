import { NextRequest, NextResponse } from 'next/server';

const FLASK = process.env.FLASK_INTERNAL_URL ?? 'http://127.0.0.1:5000';

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const category = params.get('category') ?? 'desktops';
    const pickup = params.get('pickup');

    let url = `${FLASK}/deals/stream?category=${encodeURIComponent(category)}`;
    if (pickup) url += `&pickup=${encodeURIComponent(pickup)}`;

    try {
        const res = await fetch(url, {
            cache: 'no-store',
            // 2 min — enough time for a full multi-page scrape to stream through
            signal: AbortSignal.timeout(120000),
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
