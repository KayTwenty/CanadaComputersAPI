'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
    TbArrowRight, TbCpu, TbDeviceDesktopAnalytics, TbCpu2,
    TbPhoto, TbRefresh, TbDeviceLaptop, TbFlame, TbServer, TbBolt, TbDatabase, TbWind, TbBox,
    TbBolt as TbLive, TbTag, TbClock, TbMapPin,
} from 'react-icons/tb';
import Deals from './Deals';
import { useStore } from '../contexts/StoreContext';
import { useLastUpdated } from '../hooks/useLastUpdated';

const CATEGORIES = [
    { id: 'desktops',     label: 'Desktops',       Icon: TbDeviceDesktopAnalytics, baseUrl: '/api/deals/desktops',     href: '/desktops',     cacheKey: '__all__' },
    { id: 'laptops',      label: 'Laptops',        Icon: TbDeviceLaptop,           baseUrl: '/api/deals/laptops',      href: '/laptops',      cacheKey: '__laptops__' },
    { id: 'memory',       label: 'Memory',         Icon: TbCpu,                    baseUrl: '/api/deals/memory',       href: '/memory',       cacheKey: '__memory__' },
    { id: 'cpu',          label: 'Processors',     Icon: TbCpu2,                   baseUrl: '/api/deals/cpu',          href: '/cpu',          cacheKey: '__cpu__' },
    { id: 'gpu',          label: 'Graphics',       Icon: TbPhoto,                  baseUrl: '/api/deals/gpu',          href: '/gpu',          cacheKey: '__gpu__' },
    { id: 'motherboards', label: 'Motherboards',   Icon: TbServer,                 baseUrl: '/api/deals/motherboards', href: '/motherboards', cacheKey: '__motherboards__' },
    { id: 'psu',          label: 'Power Supplies', Icon: TbBolt,                   baseUrl: '/api/deals/psu',          href: '/psu',          cacheKey: '__psu__' },
    { id: 'drives',       label: 'Drives',         Icon: TbDatabase,               baseUrl: '/api/deals/drives',       href: '/drives',       cacheKey: '__drives__' },
    { id: 'coolers',      label: 'Coolers',        Icon: TbWind,                   baseUrl: '/api/deals/coolers',      href: '/coolers',      cacheKey: '__coolers__' },
    { id: 'cases',        label: 'Cases',          Icon: TbBox,                    baseUrl: '/api/deals/cases',        href: '/cases',        cacheKey: '__cases__' },
] as const;

export default function HomeContent() {
    const { storeId, selectedStore } = useStore();
    const storeName = selectedStore.name;

    const [activeTab, setActiveTab] = useState<string>('desktops');
    const [enabledCats, setEnabledCats] = useState<Set<string>>(() => new Set(['desktops']));
    const [catCounts, setCatCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        const total = Object.values(catCounts).reduce((s, n) => s + n, 0);
        document.title = total > 0 ? `🔥 ${total} Deals | CCDeals` : 'CCDeals';
        return () => { document.title = 'CCDeals'; };
    }, [catCounts]);

    const sectionRefs   = useRef<Record<string, HTMLDivElement | null>>({});
    const tabBarRef     = useRef<HTMLDivElement>(null);
    const isScrollingRef = useRef(false);

    // Cache ages
    const ages: Record<string, string | null> = {
        desktops:     useLastUpdated('__all__'),
        laptops:      useLastUpdated('__laptops__'),
        memory:       useLastUpdated('__memory__'),
        cpu:          useLastUpdated('__cpu__'),
        gpu:          useLastUpdated('__gpu__'),
        motherboards: useLastUpdated('__motherboards__'),
        psu:          useLastUpdated('__psu__'),
        drives:       useLastUpdated('__drives__'),
        coolers:      useLastUpdated('__coolers__'),
        cases:        useLastUpdated('__cases__'),
    };

    // Freshest age across categories for hero pill
    const freshestAge = useMemo(() => {
        const candidates = Object.values(ages).filter(Boolean) as string[];
        return candidates[0] ?? null;
    }, [ages]);

    // Intersection observer: auto-highlights tab + enables lazy fetch
    useEffect(() => {
        const observers: IntersectionObserver[] = [];
        for (const cat of CATEGORIES) {
            const el = sectionRefs.current[cat.id];
            if (!el) continue;
            const obs = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        if (!isScrollingRef.current) setActiveTab(cat.id);
                        setEnabledCats(prev => {
                            if (prev.has(cat.id)) return prev;
                            const next = new Set(prev);
                            next.add(cat.id);
                            return next;
                        });
                    }
                },
                { rootMargin: '0px 0px 400px 0px', threshold: 0 },
            );
            obs.observe(el);
            observers.push(obs);
        }
        return () => observers.forEach(o => o.disconnect());
    }, []);

    const scrollToCategory = (id: string) => {
        isScrollingRef.current = true;
        setActiveTab(id);
        const el = sectionRefs.current[id];
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 130;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
        setTimeout(() => { isScrollingRef.current = false; }, 800);
    };

    const totalDeals    = Object.values(catCounts).reduce((s, n) => s + n, 0);
    const activeCats    = Object.values(catCounts).filter(n => n > 0).length;

    return (
        <>
            {/* Hero — dark, gradient, grid pattern */}
            <section className="relative overflow-hidden bg-zinc-950 text-white">
                <div className="absolute inset-0 bg-grid pointer-events-none" />
                <div className="absolute inset-0 bg-spotlight pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-slate-50/0 pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-10 sm:pt-16 sm:pb-14">
                    {/* Headline */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] animate-fade-up" style={{ animationDelay: '40ms' }}>
                        Canada Computers,{' '}
                        <span className="text-brand-gradient">on sale right now.</span>
                    </h1>

                    {/* Subhead */}
                    <p className="mt-4 text-zinc-400 text-base sm:text-lg max-w-2xl leading-relaxed animate-fade-up" style={{ animationDelay: '80ms' }}>
                        {storeId !== null ? (
                            <>
                                Tracking discounted products at{' '}
                                <span className="inline-flex items-center gap-1 font-semibold text-zinc-100">
                                    <TbMapPin size={14} className="text-violet-400" />
                                    {selectedStore.name}
                                </span>
                                , sorted by biggest dollar savings.
                            </>
                        ) : (
                            <>Every discounted product across all locations &mdash; sorted by biggest dollar savings, refreshed every 30 minutes.</>
                        )}
                    </p>

                    {/* Stat strip */}
                    <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-3xl animate-fade-up" style={{ animationDelay: '120ms' }}>
                        <StatCard
                            Icon={TbFlame}
                            value={totalDeals > 0 ? totalDeals.toLocaleString() : '—'}
                            label="Live deals"
                            accent="violet"
                            pulse={totalDeals > 0}
                        />
                        <StatCard
                            Icon={TbTag}
                            value={CATEGORIES.length}
                            label="Categories"
                            accent="fuchsia"
                        />
                        <StatCard
                            Icon={TbLive}
                            value={activeCats || '—'}
                            label="Loaded"
                            accent="emerald"
                        />
                        <StatCard
                            Icon={TbRefresh}
                            value="30m"
                            label="Refresh cycle"
                            accent="orange"
                        />
                    </div>
                </div>
            </section>

            {/* Sticky tab bar */}
            <div ref={tabBarRef} className="sticky top-17 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_12px_-6px_rgba(15,23,42,0.08)]">
                <div className="max-w-7xl mx-auto">
                    <div className="flex overflow-x-auto no-scrollbar gap-1 py-2.5 px-4 sm:px-6">
                        {CATEGORIES.map(cat => {
                            const active = activeTab === cat.id;
                            const count  = catCounts[cat.id];
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => scrollToCategory(cat.id)}
                                    className={`group relative shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all ${
                                        active
                                            ? 'bg-zinc-950 text-white shadow-md shadow-zinc-900/20'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    <cat.Icon size={14} className={active ? 'text-violet-300' : 'text-slate-400 group-hover:text-slate-600'} />
                                    {cat.label}
                                    {count > 0 && (
                                        <span className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${
                                            active ? 'bg-white/15 text-violet-200' : 'bg-slate-200/70 text-slate-500'
                                        }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Category sections */}
            <div className="bg-slate-50">
                {CATEGORIES.map((cat, idx) => {
                    const age    = ages[cat.id];
                    const count  = catCounts[cat.id];
                    const isLast = idx === CATEGORIES.length - 1;

                    return (
                        <section
                            key={cat.id}
                            ref={(el: HTMLDivElement | null) => { sectionRefs.current[cat.id] = el; }}
                            className={`max-w-7xl mx-auto w-full px-4 sm:px-6 pt-10 ${isLast ? 'pb-20' : 'pb-6'}`}
                        >
                            <header className="flex items-end justify-between mb-5 gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="shrink-0 w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-violet-600">
                                        <cat.Icon size={18} />
                                    </span>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="text-[17px] sm:text-lg font-bold text-slate-900 tracking-tight">{cat.label}</h2>
                                            {count > 0 && (
                                                <span className="text-[11px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full tabular-nums">
                                                    {count} {count === 1 ? 'deal' : 'deals'}
                                                </span>
                                            )}
                                        </div>
                                        {age && (
                                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                                <TbRefresh size={10} />
                                                {age}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <a
                                    href={cat.href}
                                    className="group shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-violet-600 px-3 py-1.5 rounded-full border border-slate-200 hover:border-violet-300 bg-white hover:bg-violet-50 transition-all"
                                >
                                    Browse all
                                    <TbArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                                </a>
                            </header>
                            <Deals
                                storeId={storeId}
                                storeName={storeName}
                                baseUrl={cat.baseUrl}
                                enabled={enabledCats.has(cat.id)}
                                onCount={(n) => setCatCounts(prev => ({ ...prev, [cat.id]: n }))}
                            />
                        </section>
                    );
                })}
            </div>
        </>
    );
}

/* ----------------------------- Sub-components ----------------------------- */

const ACCENT_MAP = {
    violet:  { ring: 'ring-violet-500/20',  bg: 'bg-violet-500/10',  text: 'text-violet-300'  },
    fuchsia: { ring: 'ring-fuchsia-500/20', bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-300' },
    emerald: { ring: 'ring-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-300' },
    orange:  { ring: 'ring-orange-500/20',  bg: 'bg-orange-500/10',  text: 'text-orange-300'  },
} as const;

function StatCard({
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
                    <div className="text-base sm:text-lg font-bold text-white tabular-nums leading-none">{value}</div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mt-1">{label}</div>
                </div>
            </div>
        </div>
    );
}

