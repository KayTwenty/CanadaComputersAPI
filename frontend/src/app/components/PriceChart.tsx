'use client';

import { useId, useRef, useState, useCallback } from 'react';

interface PricePoint {
    price: number;
    regular_price: number;
    recorded_at: number;
}

interface PriceChartProps {
    data: PricePoint[];
}

// SVG canvas dimensions (viewBox units)
const CW = 760;
const CH = 300;
const PL = 56;   // left padding — y-axis labels
const PR = 22;   // right padding
const PT = 24;   // top padding
const PB = 40;   // bottom padding — x-axis labels
const PW = CW - PL - PR;  // plot width
const PH = CH - PT - PB;  // plot height

function formatDate(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function formatDateTime(ts: number): string {
    return new Date(ts * 1000).toLocaleString('en-CA', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
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

/** Fritsch–Carlson monotone cubic interpolation → smooth, non-overshooting curve. */
function monotonePath(pts: { x: number; y: number }[]): string {
    const n = pts.length;
    if (n < 2) return '';
    if (n === 2) return `M ${pts[0].x},${pts[0].y} L ${pts[1].x},${pts[1].y}`;

    const dx: number[] = [], dy: number[] = [], m: number[] = [];
    for (let i = 0; i < n - 1; i++) {
        dx[i] = pts[i + 1].x - pts[i].x;
        dy[i] = pts[i + 1].y - pts[i].y;
        m[i] = dy[i] / dx[i];
    }
    const t: number[] = [];
    t[0] = m[0];
    for (let i = 1; i < n - 1; i++) {
        t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    }
    t[n - 1] = m[n - 2];

    let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
    for (let i = 0; i < n - 1; i++) {
        const x1 = pts[i].x + dx[i] / 3;
        const y1 = pts[i].y + (t[i] * dx[i]) / 3;
        const x2 = pts[i + 1].x - dx[i] / 3;
        const y2 = pts[i + 1].y - (t[i + 1] * dx[i]) / 3;
        d += ` C ${x1.toFixed(2)},${y1.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)} ${pts[i + 1].x.toFixed(2)},${pts[i + 1].y.toFixed(2)}`;
    }
    return d;
}

export default function PriceChart({ data }: PriceChartProps) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
    const wrapRef = useRef<HTMLDivElement>(null);
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);

    const handleMove = useCallback((clientX: number) => {
        const el = wrapRef.current;
        if (!el || data.length < 2) return;
        const rect = el.getBoundingClientRect();
        const frac = (clientX - rect.left) / rect.width;   // 0..1 across container
        const vbX = frac * CW;                              // into viewBox units
        const rel = (vbX - PL) / PW;                        // 0..1 across plot
        const idx = Math.round(rel * (data.length - 1));
        setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
    }, [data.length]);

    if (data.length < 2) return null;

    const prices = data.map(d => d.price);
    const latestReg = data[data.length - 1].regular_price;

    const allPrices = latestReg > 0 ? [...prices, latestReg] : [...prices];
    const dataMin = Math.min(...allPrices);
    const dataMax = Math.max(...allPrices);
    const pad = Math.max((dataMax - dataMin) * 0.12, 5);
    const yMin = Math.max(0, dataMin - pad);
    const yMax = dataMax + pad;

    const toX = (i: number) =>
        PL + (data.length > 1 ? (i / (data.length - 1)) * PW : PW / 2);
    const toY = (p: number) =>
        PT + PH * (1 - (p - yMin) / (yMax - yMin || 1));

    const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.price) }));
    const linePath = monotonePath(pts);
    const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(2)},${(PT + PH).toFixed(2)} L ${pts[0].x.toFixed(2)},${(PT + PH).toFixed(2)} Z`;

    const regY = latestReg > 0 ? toY(latestReg) : null;
    const yTicks = niceYTicks(yMin, yMax);

    const xTickMax = Math.min(data.length, 6);
    const xTickIndices = Array.from({ length: xTickMax }, (_, i) =>
        Math.round(i * (data.length - 1) / Math.max(xTickMax - 1, 1))
    );

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minIdx = prices.lastIndexOf(minPrice);
    const maxIdx = prices.lastIndexOf(maxPrice);
    const lastIdx = data.length - 1;
    const isCurrentLow = prices[lastIdx] <= minPrice + 0.005;

    const active = hoverIdx !== null ? data[hoverIdx] : null;
    const activePt = hoverIdx !== null ? pts[hoverIdx] : null;
    const activeSavings = active && active.regular_price > active.price
        ? active.regular_price - active.price : 0;

    return (
        <div
            ref={wrapRef}
            className="relative w-full select-none"
            onMouseMove={e => handleMove(e.clientX)}
            onMouseLeave={() => setHoverIdx(null)}
            onTouchStart={e => handleMove(e.touches[0].clientX)}
            onTouchMove={e => handleMove(e.touches[0].clientX)}
            onTouchEnd={() => setHoverIdx(null)}
        >
            <svg
                viewBox={`0 0 ${CW} ${CH}`}
                width="100%"
                preserveAspectRatio="xMidYMid meet"
                style={{ display: 'block', overflow: 'visible' }}
            >
                <defs>
                    <linearGradient id={`pcf-${uid}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.28" />
                        <stop offset="55%" stopColor="#8b5cf6" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id={`pcl-${uid}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                    <filter id={`pcg-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#7c3aed" floodOpacity="0.35" />
                    </filter>
                </defs>

                {/* Horizontal grid lines */}
                {yTicks.map((tick, ti) => {
                    const y = toY(tick);
                    if (y < PT - 2 || y > PT + PH + 2) return null;
                    return (
                        <line key={`g${ti}`} x1={PL} x2={PL + PW} y1={y.toFixed(1)} y2={y.toFixed(1)}
                            stroke="#eef2f6" strokeWidth="1" />
                    );
                })}

                {/* Regular price dashed reference line */}
                {regY !== null && regY >= PT - 2 && regY <= PT + PH + 2 && (
                    <>
                        <line x1={PL} x2={PL + PW} y1={regY.toFixed(1)} y2={regY.toFixed(1)}
                            stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="2,5" strokeLinecap="round" />
                        <text x={(PL + PW - 2).toString()} y={(regY - 6).toFixed(1)}
                            textAnchor="end" fontSize="10.5" fill="#94a3b8" fontWeight="600">
                            reg {fmtPrice(latestReg)}
                        </text>
                    </>
                )}

                {/* Area fill */}
                <path d={areaPath} fill={`url(#pcf-${uid})`} className="animate-chart-area" />

                {/* Sale price line */}
                <path d={linePath} fill="none" stroke={`url(#pcl-${uid})`}
                    strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
                    filter={`url(#pcg-${uid})`} pathLength={1} className="animate-chart-draw" />

                {/* Min marker */}
                {minIdx !== lastIdx && (
                    <g className="animate-chart-dot">
                        <circle cx={pts[minIdx].x.toFixed(1)} cy={pts[minIdx].y.toFixed(1)}
                            r="4.5" fill="#10b981" stroke="white" strokeWidth="2.5" />
                    </g>
                )}

                {/* Max marker */}
                {maxIdx !== lastIdx && (
                    <g className="animate-chart-dot">
                        <circle cx={pts[maxIdx].x.toFixed(1)} cy={pts[maxIdx].y.toFixed(1)}
                            r="4.5" fill="#f43f5e" stroke="white" strokeWidth="2.5" />
                    </g>
                )}

                {/* Latest price dot with pulsing halo */}
                <g className="animate-chart-dot">
                    <circle cx={pts[lastIdx].x.toFixed(1)} cy={pts[lastIdx].y.toFixed(1)}
                        r="9" fill={isCurrentLow ? '#10b981' : '#7c3aed'} opacity="0.18">
                        <animate attributeName="r" values="7;12;7" dur="2.4s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.22;0;0.22" dur="2.4s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={pts[lastIdx].x.toFixed(1)} cy={pts[lastIdx].y.toFixed(1)}
                        r="6" fill={isCurrentLow ? '#10b981' : '#7c3aed'} stroke="white" strokeWidth="3" />
                </g>

                {/* Hover crosshair + dot */}
                {activePt && (
                    <g>
                        <line x1={activePt.x.toFixed(1)} x2={activePt.x.toFixed(1)}
                            y1={PT} y2={PT + PH} stroke="#7c3aed" strokeWidth="1.5"
                            strokeDasharray="4,4" opacity="0.5" />
                        <circle cx={activePt.x.toFixed(1)} cy={activePt.y.toFixed(1)}
                            r="6.5" fill="white" stroke="#7c3aed" strokeWidth="3" />
                    </g>
                )}

                {/* Y-axis labels */}
                {yTicks.map((tick, ti) => {
                    const y = toY(tick);
                    if (y < PT - 2 || y > PT + PH + 4) return null;
                    return (
                        <text key={`yl${ti}`} x={(PL - 10).toString()} y={(y + 3.5).toFixed(1)}
                            textAnchor="end" fontSize="11" fill="#94a3b8"
                            fontFamily="ui-monospace,monospace" fontWeight="500">
                            {fmtPrice(tick)}
                        </text>
                    );
                })}

                {/* X-axis labels */}
                {xTickIndices.map((idx, ti) => (
                    <text key={`xl${ti}`} x={pts[idx].x.toFixed(1)} y={(PT + PH + 22).toFixed(1)}
                        textAnchor="middle" fontSize="11" fill="#94a3b8" fontWeight="500">
                        {formatDate(data[idx].recorded_at)}
                    </text>
                ))}
            </svg>

            {/* HTML tooltip — crisp text, positioned over the SVG via % */}
            {active && activePt && (
                <div
                    className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
                    style={{
                        left: `${(activePt.x / CW) * 100}%`,
                        top: `${(activePt.y / CH) * 100}%`,
                        marginTop: '-14px',
                    }}
                >
                    <div className="rounded-xl bg-zinc-900 text-white shadow-xl shadow-zinc-900/30 px-3 py-2 min-w-30 border border-zinc-700/60">
                        <div className="text-[10px] font-medium text-zinc-400 whitespace-nowrap">
                            {formatDateTime(active.recorded_at)}
                        </div>
                        <div className="mt-0.5 flex items-baseline gap-1.5">
                            <span className="text-base font-extrabold tabular-nums">
                                ${active.price.toFixed(2)}
                            </span>
                            {activeSavings > 0 && (
                                <span className="text-[10px] font-bold text-emerald-400 tabular-nums whitespace-nowrap">
                                    −${activeSavings.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* caret */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0
                        border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent
                        border-t-[6px] border-t-zinc-900" />
                </div>
            )}
        </div>
    );
}
