import { NextRequest, NextResponse } from 'next/server';
import { VALID_STORE_IDS } from '@/lib/cache';
import { getPsuDeals } from '@/lib/categories';

export async function GET(request: NextRequest) {
    const raw = request.nextUrl.searchParams.get('pickup');
    const storeId = raw && VALID_STORE_IDS.has(parseInt(raw, 10)) ? parseInt(raw, 10) : null;
    return NextResponse.json(await getPsuDeals(storeId));
}
