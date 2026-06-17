import { NextRequest, NextResponse } from 'next/server';
import { rateLimitCheck, VALID_CATEGORIES } from '@/lib/cache';
import { streamCategoryGen } from '@/lib/categories';

// Long-running scrapes on cold cache can take several minutes
export const maxDuration = 300;

export async function GET(request: NextRequest) {
    const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();
    if (!rateLimitCheck(ip, 1)) {
        return NextResponse.json({ error: 'Too many requests — slow down.' }, { status: 429 });
    }

    const params   = request.nextUrl.searchParams;
    const category = params.get('category') ?? 'desktops';
    if (!VALID_CATEGORIES.has(category)) {
        return NextResponse.json(
            { error: `Unknown category "${category}". Valid: ${[...VALID_CATEGORIES].sort().join(', ')}` },
            { status: 400 },
        );
    }

    const pickupRaw  = params.get('pickup');
    const onSaleOnly = params.get('deals_only') !== 'false';
    let storeId: number | null = null;
    if (pickupRaw) {
        const n = parseInt(pickupRaw, 10);
        if (!isNaN(n)) storeId = n; // VALID_STORE_IDS check happens inside categories.ts
    }

    const encoder = new TextEncoder();
    const gen     = streamCategoryGen(category, storeId, onSaleOnly);

    const stream = new ReadableStream({
        async start(controller) {
            try {
                for await (const batch of gen) {
                    controller.enqueue(encoder.encode(JSON.stringify({ batch }) + '\n'));
                }
                controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + '\n'));
            } catch (e) {
                controller.enqueue(encoder.encode(JSON.stringify({ error: String(e), done: true }) + '\n'));
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type':    'application/x-ndjson',
            'Cache-Control':   'no-cache',
            'X-Accel-Buffering': 'no',
        },
    });
}
