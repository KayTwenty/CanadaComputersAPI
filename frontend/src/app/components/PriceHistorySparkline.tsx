'use client';

import { useEffect, useRef, useState } from 'react';
import Sparkline from './Sparkline';

interface HistoryPoint {
    price: number;
    regular_price: number;
    recorded_at: number;
}

interface PriceHistorySparklineProps {
    itemCode: string;
    currentPrice: number;
}

export default function PriceHistorySparkline({ itemCode, currentPrice }: PriceHistorySparklineProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<HistoryPoint[] | null>(null);
    const [fetched, setFetched] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !fetched) {
                    setFetched(true);
                    fetch(`/api/history/${encodeURIComponent(itemCode)}`)
                        .then(r => r.ok ? r.json() : null)
                        .then(json => {
                            if (json?.history && Array.isArray(json.history)) {
                                setData(json.history as HistoryPoint[]);
                            }
                        })
                        .catch(() => { /* silently ignore — sparkline is non-critical */ });
                }
            },
            { rootMargin: '100px' },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [itemCode, fetched]);

    // Not yet intersected — reserve no space (don't shift layout)
    if (!fetched) return <div ref={ref} />;

    // Loading shimmer
    if (data === null) {
        return (
            <div ref={ref} className="h-8 rounded bg-slate-100 animate-pulse" />
        );
    }

    // Need at least 2 points to draw a meaningful line
    if (data.length < 2) return <div ref={ref} />;

    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const isAllTimeLow = currentPrice <= minPrice + 0.005;

    return (
        <div ref={ref} className="space-y-1">
            <div className="w-full">
                <Sparkline prices={prices} height={28} />
            </div>
            <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-400 font-medium">
                    30d low <span className="font-semibold text-slate-500">${minPrice.toFixed(2)}</span>
                </span>
                {isAllTimeLow && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 rounded px-1.5 py-0.5">
                        ↓ 30d low
                    </span>
                )}
            </div>
        </div>
    );
}
