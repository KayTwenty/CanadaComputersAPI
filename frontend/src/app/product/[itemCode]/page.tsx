'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    TbArrowLeft, TbExternalLink, TbWorld, TbBuildingStore, TbTag,
    TbFlame, TbTrendingDown, TbTrendingUp, TbChartLine, TbClock,
} from 'react-icons/tb';
import PriceChart from '../../components/PriceChart';
import FavoriteButton from '../../components/FavoriteButton';
import ShareButton from '../../components/ShareButton';

interface Product {
    title: string;
    price: string;
    regular_price: string;
    item_code: string;
    online_availability: string;
    instore_availability: string;
    link: string;
    image_url: string;
    laptop_type?: string;
    drive_type?: string;
    cooler_type?: string;
    case_type?: string;
}

interface HistoryPoint {
    price: number;
    regular_price: number;
    recorded_at: number;
}

function isAvailable(str: string): boolean {
    if (!str) return false;
    const s = str.toLowerCase();
    return s.includes('available') && !s.includes('not available');
}

const ACCENT_MAP = {
    violet:  { ring: 'ring-violet-500/20',  bg: 'bg-violet-500/10',  text: 'text-violet-300'  },
    fuchsia: { ring: 'ring-fuchsia-500/20', bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-300' },
    emerald: { ring: 'ring-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-300' },
    rose:    { ring: 'ring-rose-500/20',    bg: 'bg-rose-500/10',    text: 'text-rose-300'    },
    orange:  { ring: 'ring-orange-500/20',  bg: 'bg-orange-500/10',  text: 'text-orange-300'  },
} as const;

function HeroStat({
    Icon, value, label, accent, pulse = false,
}: {
    Icon: React.ComponentType<{ size?: number; className?: string }>;
    value: string | number;
    label: string;
    accent: keyof typeof ACCENT_MAP;
    pulse?: boolean;
}) {
    const a = ACCENT_MAP[accent];
    return (
        <div className="relative bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 sm:p-3.5 backdrop-blur-sm hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-2.5">
                <span className={`shrink-0 w-8 h-8 rounded-lg ${a.bg} ring-1 ${a.ring} flex items-center justify-center ${a.text} ${pulse ? 'animate-pulse-soft' : ''}`}>
                    <Icon size={15} />
                </span>
                <div className="min-w-0">
                    <div className="text-base sm:text-lg font-bold text-white tabular-nums leading-none truncate">{value}</div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mt-1 truncate">{label}</div>
                </div>
            </div>
        </div>
    );
}

function SkeletonBox({ className }: { className: string }) {
    return <div className={`bg-zinc-800/50 rounded animate-pulse ${className}`} />;
}

export default function ProductPage() {
    const params = useParams<{ itemCode: string }>();
    const router = useRouter();
    const itemCode = params.itemCode;

    const [product, setProduct] = useState<Product | null>(null);
    const [history, setHistory] = useState<HistoryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!itemCode) return;
        setNotFound(false);
        setHistory([]);

        let hasStored = false;
        try {
            const stored = sessionStorage.getItem(`product:${itemCode}`);
            if (stored) {
                setProduct(JSON.parse(stored) as Product);
                setLoading(false);
                hasStored = true;
            } else {
                setProduct(null);
                setLoading(true);
            }
        } catch {
            setProduct(null);
            setLoading(true);
        }

        Promise.all([
            fetch(`/api/product/${encodeURIComponent(itemCode)}`).then(r => r.json()).catch(() => null),
            fetch(`/api/history/${encodeURIComponent(itemCode)}`).then(r => r.json()).catch(() => null),
        ]).then(([prodData, histData]) => {
            if (prodData?.product) {
                setProduct(prodData.product as Product);
                try { sessionStorage.setItem(`product:${itemCode}`, JSON.stringify(prodData.product)); } catch {}
            } else if (!hasStored) {
                setNotFound(true);
            }
            if (Array.isArray(histData?.history)) {
                setHistory(histData.history as HistoryPoint[]);
            }
            setLoading(false);
        });
    }, [itemCode]);

    useEffect(() => {
        if (product) document.title = `${product.title} | CCDeals`;
        return () => { document.title = 'CCDeals'; };
    }, [product]);

    /* ---------------- Loading ---------------- */
    if (loading) {
        return (
            <div className="flex-1">
                <section className="relative overflow-hidden bg-zinc-950 text-white">
                    <div className="absolute inset-0 bg-grid pointer-events-none" />
                    <div className="absolute inset-0 bg-spotlight pointer-events-none" />
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-8">
                        <SkeletonBox className="h-4 w-16 mb-6" />
                        <SkeletonBox className="h-3 w-32 mb-4" />
                        <SkeletonBox className="h-9 w-3/4 mb-3" />
                        <SkeletonBox className="h-9 w-1/2 mb-6" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl">
                            <SkeletonBox className="h-16 rounded-xl" />
                            <SkeletonBox className="h-16 rounded-xl" />
                            <SkeletonBox className="h-16 rounded-xl" />
                            <SkeletonBox className="h-16 rounded-xl" />
                        </div>
                    </div>
                </section>
                <div className="bg-slate-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                        <div className="bg-slate-200 rounded-2xl h-80 sm:h-96 animate-pulse" />
                        <div className="space-y-4 pt-2">
                            <div className="bg-slate-200 rounded h-12 w-2/3 animate-pulse" />
                            <div className="bg-slate-200 rounded h-6 w-40 animate-pulse" />
                            <div className="bg-slate-200 rounded h-32 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ---------------- Not found ---------------- */
    if (notFound) {
        return (
            <div className="flex-1">
                <section className="relative overflow-hidden bg-zinc-950 text-white min-h-[60vh] flex items-center">
                    <div className="absolute inset-0 bg-grid pointer-events-none" />
                    <div className="absolute inset-0 bg-spotlight pointer-events-none" />
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center w-full">
                        <button
                            onClick={() => router.back()}
                            className="absolute left-4 sm:left-6 top-6 inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 hover:text-white transition-colors group"
                        >
                            <TbArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
                            Back
                        </button>
                        <p className="text-5xl mb-4">🔍</p>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Product <span className="text-brand-gradient">not found</span>
                        </h1>
                        <p className="mt-3 text-zinc-400 text-sm">
                            <span className="font-mono text-zinc-300">{itemCode}</span> isn&apos;t in the current deal cache.
                        </p>
                        <a href="/"
                            className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 px-5 py-2.5 rounded-full transition-all shadow-md shadow-violet-500/30">
                            Browse all deals
                        </a>
                    </div>
                </section>
            </div>
        );
    }

    if (!product) return null;

    /* ---------------- Derived ---------------- */
    const sale = parseFloat(product.price.replace(/[$,]/g, ''));
    const reg = parseFloat(product.regular_price.replace(/[$,]/g, ''));
    const pct = reg > 0 && reg > sale ? Math.round((reg - sale) / reg * 100) : 0;
    const savingsAmt = pct > 0 ? (reg - sale).toFixed(2) : null;

    const onlineAvail = isAvailable(product.online_availability);
    const instoreAvail = isAvailable(product.instore_availability);
    const anyAvail = onlineAvail || instoreAvail;

    const typeTag = product.laptop_type ?? product.drive_type ?? product.cooler_type ?? product.case_type ?? null;

    const histPrices = history.map(d => d.price);
    const low30 = histPrices.length > 0 ? Math.min(...histPrices) : null;
    const high30 = histPrices.length > 0 ? Math.max(...histPrices) : null;
    const avg30 = histPrices.length > 0
        ? histPrices.reduce((s, p) => s + p, 0) / histPrices.length
        : null;
    const isAllTimeLow = low30 !== null && sale <= low30 + 0.005;

    return (
        <div className="flex-1">

            {/* ── Dark hero ── */}
            <section className="relative overflow-hidden bg-zinc-950 text-white">
                <div className="absolute inset-0 bg-grid pointer-events-none" />
                <div className="absolute inset-0 bg-spotlight pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-10 sm:pt-10 sm:pb-12">

                    {/* Back button */}
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 hover:text-white mb-5 transition-colors group animate-fade-up"
                    >
                        <TbArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
                        Back
                    </button>

                    {/* Eyebrow row */}
                    <div className="flex items-center gap-2 mb-4 animate-fade-up flex-wrap" style={{ animationDelay: '40ms' }}>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300">
                            <span className="text-[10px] font-mono font-bold tracking-wider uppercase">{product.item_code}</span>
                        </span>
                        {typeTag && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300">
                                <span className="text-[10px] font-bold uppercase tracking-widest">{typeTag}</span>
                            </span>
                        )}
                        {isAllTimeLow && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                                <TbTrendingDown size={11} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">30-day low</span>
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.15] animate-fade-up max-w-4xl" style={{ animationDelay: '80ms' }}>
                        {product.title}
                    </h1>

                    {/* Hero stat strip */}
                    <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-3xl animate-fade-up" style={{ animationDelay: '120ms' }}>
                        <HeroStat
                            Icon={TbTag}
                            value={product.price}
                            label="Sale price"
                            accent="violet"
                            pulse={pct > 0}
                        />
                        <HeroStat
                            Icon={TbFlame}
                            value={pct > 0 ? `−${pct}%` : '—'}
                            label={savingsAmt ? `Save $${savingsAmt}` : 'No discount'}
                            accent="rose"
                        />
                        <HeroStat
                            Icon={TbTrendingDown}
                            value={low30 !== null ? `$${low30.toFixed(2)}` : '—'}
                            label="30-day low"
                            accent="emerald"
                        />
                        <HeroStat
                            Icon={anyAvail ? TbBuildingStore : TbClock}
                            value={anyAvail ? (onlineAvail && instoreAvail ? 'Both' : onlineAvail ? 'Online' : 'In-Store') : 'Limited'}
                            label="Availability"
                            accent={anyAvail ? 'emerald' : 'orange'}
                        />
                    </div>
                </div>
            </section>

            {/* ── Body ── */}
            <div className="bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

                    {/* Image + Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

                        {/* Image card */}
                        <div className="relative bg-white rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-center min-h-72 sm:min-h-96 p-8 overflow-hidden animate-fade-up">
                            {pct > 0 && (
                                <div className="absolute top-4 right-4 z-10 inline-flex items-center bg-linear-to-br from-rose-500 to-rose-600 text-white text-sm font-extrabold px-3 py-1 rounded-xl shadow-md shadow-rose-500/30">
                                    −{pct}%
                                </div>
                            )}
                            {product.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={product.image_url}
                                    alt={product.title}
                                    className="object-contain max-h-72 sm:max-h-80 max-w-full drop-shadow-lg"
                                    referrerPolicy="no-referrer"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            ) : (
                                <div className="w-48 h-48 bg-slate-100 rounded-2xl" />
                            )}
                        </div>

                        {/* Details card */}
                        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 sm:p-6 flex flex-col gap-5 animate-fade-up" style={{ animationDelay: '60ms' }}>

                            {/* Price block */}
                            <div className="flex flex-col gap-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price</p>
                                <div className="flex items-baseline gap-3 flex-wrap">
                                    <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                                        {product.price}
                                    </span>
                                    {pct > 0 && (
                                        <span className="text-xl text-slate-400 line-through tabular-nums">
                                            {product.regular_price}
                                        </span>
                                    )}
                                </div>
                                {savingsAmt && (
                                    <span className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
                                        <TbTag size={14} />
                                        Save ${savingsAmt} &nbsp;·&nbsp; {pct}% off
                                    </span>
                                )}
                            </div>

                            <div className="border-t border-slate-100" />

                            {/* Availability */}
                            <div className="flex flex-col gap-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Availability</p>
                                <div className="flex items-start gap-3">
                                    <span className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                                        onlineAvail ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        <TbWorld size={16} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-700">Online</p>
                                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                            {product.online_availability || 'Status unavailable'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                                        instoreAvail ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        <TbBuildingStore size={16} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-700">In-Store</p>
                                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                            {product.instore_availability || 'Status unavailable'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100" />

                            {/* Actions */}
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <FavoriteButton product={product} variant="icon" />
                                <ShareButton title={product.title} url={product.link} price={product.price} />
                                <a
                                    href={product.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ml-auto inline-flex items-center gap-2 bg-zinc-950 hover:bg-violet-600 text-white font-semibold text-sm px-5 py-2.5 rounded-full shadow-md shadow-zinc-900/20 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-100 transition-all"
                                >
                                    Buy at Canada Computers
                                    <TbExternalLink size={15} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* ── Price History ── */}
                    <section className="mt-10 animate-fade-up" style={{ animationDelay: '120ms' }}>
                        {/* Section header (matches HomeContent category headers) */}
                        <header className="flex items-end justify-between mb-5 gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="shrink-0 w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-violet-600">
                                    <TbChartLine size={18} />
                                </span>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-[17px] sm:text-lg font-bold text-slate-900 tracking-tight">Price History</h2>
                                        {history.length > 0 && (
                                            <span className="text-[11px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full tabular-nums">
                                                {history.length} {history.length === 1 ? 'snapshot' : 'snapshots'}
                                            </span>
                                        )}
                                    </div>
                                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                        <TbClock size={10} />
                                        Last 30 days · captured every 30 minutes
                                    </span>
                                </div>
                            </div>
                        </header>

                        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
                            {/* Legend bar */}
                            <div className="px-5 sm:px-6 py-3 border-b border-slate-100 flex items-center gap-3 sm:gap-4 text-[11px] text-slate-400 flex-wrap">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-5 h-0.5 bg-violet-500 rounded inline-block" />
                                    Sale price
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-5 inline-block" style={{ borderTop: '2px dashed #94a3b8' }} />
                                    Regular price
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                                    Low
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0" />
                                    High
                                </span>
                            </div>

                            {history.length < 2 ? (
                                <div className="px-6 py-20 text-center">
                                    <p className="text-3xl mb-3">📈</p>
                                    <p className="font-semibold text-slate-700 text-sm">Tracking just started</p>
                                    <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto">
                                        Price history will appear here once the tracker has captured at least two data points.
                                        New snapshots are taken every 30 minutes.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="px-3 sm:px-5 pt-4 pb-2">
                                        <PriceChart data={history} />
                                    </div>

                                    {low30 !== null && (
                                        <div className="px-5 sm:px-6 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <StatTile
                                                Icon={TbTag}
                                                label="Current"
                                                value={product.price}
                                                tone={isAllTimeLow ? 'emerald' : 'slate'}
                                            />
                                            <StatTile
                                                Icon={TbTrendingDown}
                                                label="30d Low"
                                                value={`$${low30.toFixed(2)}`}
                                                tone="emerald"
                                            />
                                            <StatTile
                                                Icon={TbTrendingUp}
                                                label="30d High"
                                                value={`$${high30!.toFixed(2)}`}
                                                tone="rose"
                                            />
                                            <StatTile
                                                Icon={TbChartLine}
                                                label="30d Avg"
                                                value={`$${avg30!.toFixed(2)}`}
                                                tone="slate"
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}

/* ----------------------------- Sub-components ----------------------------- */

const STAT_TILE_TONE = {
    slate:   { wrap: 'bg-slate-50 border-slate-100',     iconWrap: 'bg-white text-slate-500 border-slate-200',    label: 'text-slate-400',   value: 'text-slate-900' },
    emerald: { wrap: 'bg-emerald-50 border-emerald-100', iconWrap: 'bg-white text-emerald-600 border-emerald-200', label: 'text-emerald-600', value: 'text-emerald-700' },
    rose:    { wrap: 'bg-rose-50 border-rose-100',       iconWrap: 'bg-white text-rose-600 border-rose-200',       label: 'text-rose-600',    value: 'text-rose-700' },
} as const;

function StatTile({
    Icon, label, value, tone,
}: {
    Icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    value: string;
    tone: keyof typeof STAT_TILE_TONE;
}) {
    const t = STAT_TILE_TONE[tone];
    return (
        <div className={`rounded-xl px-4 py-3 border flex items-center gap-3 ${t.wrap}`}>
            <span className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center ${t.iconWrap}`}>
                <Icon size={15} />
            </span>
            <div className="min-w-0">
                <p className={`text-[10px] font-bold uppercase tracking-wide ${t.label}`}>{label}</p>
                <p className={`text-base sm:text-lg font-extrabold mt-0.5 tabular-nums truncate ${t.value}`}>{value}</p>
            </div>
        </div>
    );
}
