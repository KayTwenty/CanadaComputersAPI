import { NextRequest, NextResponse } from 'next/server';

const FLASK = process.env.FLASK_INTERNAL_URL ?? 'http://127.0.0.1:5000';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ query: string }> }
) {
    const { query } = await params;
    const { searchParams } = request.nextUrl;
    const price_min = searchParams.get('price_min');
    const price_max = searchParams.get('price_max');

    const upstream = new URL(`${FLASK}/search/${encodeURIComponent(query)}`);
    if (price_min) upstream.searchParams.set('price_min', price_min);
    if (price_max) upstream.searchParams.set('price_max', price_max);

    try {
        const res = await fetch(upstream.toString(), { cache: 'no-store' });
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 });
    }
}
