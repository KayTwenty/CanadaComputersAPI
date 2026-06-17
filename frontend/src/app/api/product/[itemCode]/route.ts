import { NextRequest, NextResponse } from 'next/server';
import { getCachedProduct } from '@/lib/cache';

const ITEM_CODE_RE = /^[A-Za-z0-9\-]{1,64}$/;

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ itemCode: string }> },
) {
    const { itemCode } = await params;
    if (!ITEM_CODE_RE.test(itemCode)) {
        return NextResponse.json({ error: 'Invalid item code' }, { status: 400 });
    }
    const product = getCachedProduct(itemCode);
    if (!product) {
        return NextResponse.json({ error: 'Product not found', item_code: itemCode }, { status: 404 });
    }
    return NextResponse.json({ product, item_code: itemCode });
}

