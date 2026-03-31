import { NextResponse } from 'next/server';

const FLASK = process.env.FLASK_INTERNAL_URL ?? 'http://127.0.0.1:5000';

export async function GET() {
    try {
        const res = await fetch(`${FLASK}/status`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 });
    }
}
