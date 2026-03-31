import { NextRequest, NextResponse } from 'next/server';

const FLASK = process.env.FLASK_INTERNAL_URL ?? 'http://127.0.0.1:5000';

export async function GET(request: NextRequest) {
    const pickup = request.nextUrl.searchParams.get('pickup');
    const url = pickup
        ? `${FLASK}/deals/memory?pickup=${pickup}`
        : `${FLASK}/deals/memory`;

    try {
        const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(60000) });
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 });
    }
}
