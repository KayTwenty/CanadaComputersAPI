import { NextRequest, NextResponse } from 'next/server';
import { rateLimitCheck } from '@/lib/cache';
import { productSearch } from '@/lib/scraper';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ query: string }> },
) {
    const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();
    if (!rateLimitCheck(ip, 3)) {
        return NextResponse.json({ error: 'Too many requests — slow down.' }, { status: 429 });
    }
    const { query } = await params;
    const { searchParams } = request.nextUrl;
    const products = await productSearch(
        query,
        searchParams.get('price_min'),
        searchParams.get('price_max'),
    );
    return NextResponse.json({ products });
}
