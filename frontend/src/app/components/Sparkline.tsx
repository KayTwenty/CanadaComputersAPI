'use client';

import { useId } from 'react';

interface SparklineProps {
    prices: number[];
    width?: number;
    height?: number;
}

export default function Sparkline({ prices, width = 200, height = 32 }: SparklineProps) {
    const uid = useId();
    const gradId = `sg-${uid.replace(/:/g, '')}`;

    if (prices.length < 2) return null;

    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;

    const pad = 3;
    const w = width - pad * 2;
    const h = height - pad * 2;

    const pts = prices.map((p, i) => ({
        x: pad + (i / (prices.length - 1)) * w,
        y: pad + (1 - (p - minP) / range) * h,
    }));

    const polyline = pts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

    const last = pts[pts.length - 1];
    const isAllTimeLow = prices[prices.length - 1] <= minP + 0.005;

    // Closed fill path
    const fillD =
        `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)} ` +
        pts.slice(1).map(p => `L ${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') +
        ` L ${last.x.toFixed(2)},${(pad + h).toFixed(2)} L ${pts[0].x.toFixed(2)},${(pad + h).toFixed(2)} Z`;

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            fill="none"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Fill under the line */}
            <path d={fillD} fill={`url(#${gradId})`} />
            {/* Line */}
            <polyline
                points={polyline}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            {/* Dot at latest point */}
            <circle
                cx={last.x}
                cy={last.y}
                r="2.5"
                fill={isAllTimeLow ? '#10b981' : '#8b5cf6'}
                stroke="white"
                strokeWidth="1.5"
            />
        </svg>
    );
}
