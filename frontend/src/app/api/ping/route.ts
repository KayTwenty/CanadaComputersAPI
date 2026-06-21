import { NextResponse } from 'next/server';
import { cacheStatus } from '@/lib/cache';
import { proxyRotator } from '@/lib/proxies';

async function pingHead(url: string, timeoutMs = 8000) {
    const start = Date.now();
    try {
        const ctrl  = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);
        const res   = await fetch(url, {
            method: 'HEAD',
            signal: ctrl.signal,
            cache:  'no-store',
            headers: { 'User-Agent': 'CCDeals-StatusCheck/1.0' },
        });
        clearTimeout(timer);
        return {
            latency_ms: Date.now() - start,
            status_code: res.status,
            up: res.status < 500,
        };
    } catch {
        return { latency_ms: null, status_code: null, up: false };
    }
}

export async function GET() {
    // Check Canada Computers concurrently with internal checks
    const [cc] = await Promise.all([
        pingHead('https://www.canadacomputers.com/'),
    ]);

    const cache   = cacheStatus();
    const proxies = proxyRotator.stats();

    return NextResponse.json({
        timestamp: Date.now(),
        self: { up: true, latency_ms: 0 },     // if we respond, we're up
        cc,
        cache,
        proxies,
    });
}
