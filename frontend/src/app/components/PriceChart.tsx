'use client';

import { useId } from 'react';

interface PricePoint {
    price: number;
    regular_price: number;
    recorded_at: number;
}

interface PriceChartProps {
    data: PricePoint[];
}

// SVG canvas dimensions
const CW = 600;
const CH = 220;
const PL = 62;   // left padding — y-axis labels
const PR = 20;   // right padding
const PT = 16;   // top padding
const PB = 44;   // bottom padding — x-axis labels
const PW = CW - PL - PR;  // plot width
const PH = CH - PT - PB;  // plot height

function formatDate(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function niceYTicks(min: number, max: number): number[] {
    const range = max - min;
    if (range < 0.5) {
        const v = Math.round(min);
        return [v - 2, v - 1, v, v + 1, v + 2].map(x => Math.max(0, x));
    }
    const rawStep = range / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const niceStep = Math.ceil(rawStep / magnitude) * magnitude;
    const start = Math.floor(min / niceStep) * niceStep;
    const ticks: number[] = [];
    let v = start;
    while (ticks.length < 8 && v <= max + niceStep * 0.5) {
        if (v >= 0) ticks.push(v);
        v += niceStep;
    }
    return ticks;
}

function fmtPrice(n: number): string {
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return `$${Math.round(n)}`;
}

export default function PriceChart({ data }: PriceChartProps) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

    if (data.length < 2) return null;

    const prices = data.map(d => d.price);
    const latestReg = data[data.length - 1].regular_price;

    const allPrices = latestReg > 0 ? [...prices, latestReg] : [...prices];
    const dataMin = Math.min(...allPrices);
    const dataMax = Math.max(...allPrices);
    const pad = Math.max((dataMax - dataMin) * 0.08, 5);
    const yMin = Math.max(0, dataMin - pad);
    const yMax = dataMax + pad;

    const toX = (i: number) =>
        PL + (data.length > 1 ? (i / (data.length - 1)) * PW : PW / 2);
    const toY = (p: number) =>
        PT + PH * (1 - (p - yMin) / (yMax - yMin));

    const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.price) }));
    const polyline = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const lastPt = pts[pts.length - 1];
    const fillD = [
        `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`,
        ...pts.slice(1).map(p => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`),
        `L ${lastPt.x.toFixed(1)},${(PT + PH).toFixed(1)}`,
        `L ${pts[0].x.toFixed(1)},${(PT + PH).toFixed(1)}`,
        'Z',
    ].join(' ');

    const regY = latestReg > 0 ? toY(latestReg) : null;

    const yTicks = niceYTicks(yMin, yMax);

    const xTickMax = Math.min(data.length, 7);
    const xTickIndices = Array.from({ length: xTickMax }, (_, i) =>
        Math.round(i * (data.length - 1) / Math.max(xTickMax - 1, 1))
    );

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minIdx = prices.lastIndexOf(minPrice);
    const maxIdx = prices.lastIndexOf(maxPrice);
    const lastIdx = data.length - 1;
    const isCurrentLow = prices[lastIdx] <= minPrice + 0.005;

    return (
        <svg
            viewBox={`0 0 ${CW} ${CH}`}
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{ display: 'block' }}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={`pcf-${uid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Y grid lines */}
            {yTicks.map((tick, ti) => {
                const y = toY(tick);
                if (y < PT - 2 || y > PT + PH + 2) return null;
                return (
                    <line key={ti} x1={PL} x2={PL + PW} y1={y.toFixed(1)} y2={y.toFixed(1)}
                        stroke="#e2e8f0" strokeWidth="1" />
                );
            })}

            {/* Regular price dashed reference line */}
            {regY !== null && regY >= PT - 2 && regY <= PT + PH + 2 && (
                <line x1={PL} x2={PL + PW} y1={regY.toFixed(1)} y2={regY.toFixed(1)}
                    stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6,4" />
            )}

            {/* Fill under sale line */}
            <path d={fillD} fill={`url(#pcf-${uid})`} />

            {/* Sale price line */}
            <polyline points={polyline} fill="none" stroke="#7c3aed"
                strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

            {/* Min dot (emerald) — only if not the latest point */}
            {minIdx !== lastIdx && (
                <circle cx={pts[minIdx].x.toFixed(1)} cy={pts[minIdx].y.toFixed(1)}
                    r="4" fill="#10b981" stroke="white" strokeWidth="2" />
            )}

            {/* Max dot (rose) — only if not the latest point */}
            {maxIdx !== lastIdx && (
                <circle cx={pts[maxIdx].x.toFixed(1)} cy={pts[maxIdx].y.toFixed(1)}
                    r="4" fill="#f43f5e" stroke="white" strokeWidth="2" />
            )}

            {/* Latest price dot */}
            <circle cx={lastPt.x.toFixed(1)} cy={lastPt.y.toFixed(1)}
                r="5.5" fill={isCurrentLow ? '#10b981' : '#7c3aed'}
                stroke="white" strokeWidth="2.5" />

            {/* Y-axis labels */}
            {yTicks.map((tick, ti) => {
                const y = toY(tick);
                if (y < PT - 2 || y > PT + PH + 4) return null;
                return (
                    <text key={ti} x={(PL - 6).toString()} y={(y + 4).toFixed(1)}
                        textAnchor="end" fontSize="11" fill="#94a3b8" fontFamily="ui-monospace,monospace">
                        {fmtPrice(tick)}
                    </text>
                );
            })}

            {/* X-axis labels */}
            {xTickIndices.map((idx, ti) => (
                <text key={ti} x={pts[idx].x.toFixed(1)} y={(PT + PH + 18).toFixed(1)}
                    textAnchor="middle" fontSize="11" fill="#94a3b8">
                    {formatDate(data[idx].recorded_at)}
                </text>
            ))}

            {/* Axes */}
            <line x1={PL} x2={PL} y1={PT} y2={PT + PH} stroke="#e2e8f0" strokeWidth="1" />
            <line x1={PL} x2={PL + PW} y1={PT + PH} y2={PT + PH} stroke="#e2e8f0" strokeWidth="1" />
        </svg>
    );
}
