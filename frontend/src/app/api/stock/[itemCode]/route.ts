import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';
import { VALID_STORE_IDS } from '@/lib/cache';
import { fetchPage } from '@/lib/scraper';

const ITEM_CODE_RE = /^[A-Za-z0-9\-]{1,64}$/;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ itemCode: string }> },
) {
    const { itemCode } = await params;
    if (!ITEM_CODE_RE.test(itemCode)) {
        return NextResponse.json({ error: 'Invalid item code' }, { status: 400 });
    }

    const raw = request.nextUrl.searchParams.get('storeId');
    const storeId = raw ? parseInt(raw, 10) : NaN;
    if (isNaN(storeId) || !VALID_STORE_IDS.has(storeId)) {
        return NextResponse.json({ error: 'Invalid store ID' }, { status: 400 });
    }

    // Search CC for this item code filtered by store — fast fetch since store-specific
    const url = `https://www.canadacomputers.com/en/search?s=${encodeURIComponent(itemCode)}&pickup=${storeId}`;

    let html: string;
    try {
        html = await fetchPage(url, true);
    } catch {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 502 });
    }

    const $ = load(html);
    const articles = $('article.product-miniature');

    for (const el of articles.toArray()) {
        const $el = $(el);
        const thumb = $el.find('a.product-thumbnail');
        const code = (thumb.attr('data-id') ?? '').trim();
        if (code.toLowerCase() !== itemCode.toLowerCase()) continue;

        const availDiv = $el.find('div.available-tag');
        let onlineAvail = 'unknown';
        let instoreAvail = 'unknown';
        if (availDiv.length) {
            const smalls = availDiv.find('small.pq-hdr-bolder');
            onlineAvail  = $(smalls[0]).text().trim() || 'unknown';
            instoreAvail = $(smalls[1]).text().trim() || 'unknown';
        }
        return NextResponse.json({
            item_code: itemCode,
            store_id: storeId,
            online_availability: onlineAvail,
            instore_availability: instoreAvail,
        });
    }

    // Product not in this store's filtered results → not available in-store
    return NextResponse.json({
        item_code: itemCode,
        store_id: storeId,
        online_availability: 'unknown',
        instore_availability: 'Not Available',
    });
}
