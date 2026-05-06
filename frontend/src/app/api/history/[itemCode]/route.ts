import { NextRequest, NextResponse } from 'next/server';

const FLASK = process.env.FLASK_INTERNAL_URL ?? 'http://127.0.0.1:5000';

// Only allow alphanumeric + hyphens to guard against path traversal
const ITEM_CODE_RE = /^[A-Za-z0-9\-]{1,64}$/;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ itemCode: string }> },
) {
    const { itemCode } = await params;
    if (!ITEM_CODE_RE.test(itemCode)) {
        return NextResponse.json({ error: 'Invalid item code' }, { status: 400 });
    }
    try {
        const res = await fetch(`${FLASK}/history/${encodeURIComponent(itemCode)}`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(10000),
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 });
    }
}
