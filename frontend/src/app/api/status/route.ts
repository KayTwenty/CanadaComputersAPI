import { NextResponse } from 'next/server';
import { cacheStatus } from '@/lib/cache';
import { proxyRotator } from '@/lib/proxies';

export async function GET() {
    return NextResponse.json({
        ...cacheStatus(),
        proxies: proxyRotator.stats(),
    });
}
