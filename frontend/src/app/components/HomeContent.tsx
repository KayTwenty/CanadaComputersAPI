'use client';

import { useState, useRef, useEffect } from 'react';
import {
    TbArrowRight, TbCpu, TbDeviceDesktopAnalytics, TbCpu2,
    TbPhoto, TbRefresh, TbDeviceLaptop, TbFlame, TbServer, TbBolt, TbDatabase, TbDisc,
} from 'react-icons/tb';
import Deals from './Deals';
import { useStore } from '../contexts/StoreContext';
import { useLastUpdated } from '../hooks/useLastUpdated';

const CATEGORIES = [
    { id: 'desktops',     label: 'Desktops',     Icon: TbDeviceDesktopAnalytics, baseUrl: '/api/deals/desktops',     href: '/desktops',     cacheKey: '__all__' },
    { id: 'laptops',      label: 'Laptops',      Icon: TbDeviceLaptop,           baseUrl: '/api/deals/laptops',      href: '/laptops',      cacheKey: '__laptops__' },
    { id: 'memory',       label: 'Memory',       Icon: TbCpu,                    baseUrl: '/api/deals/memory',       href: '/memory',       cacheKey: '__memory__' },
    { id: 'cpu',          label: 'Processors',   Icon: TbCpu2,                   baseUrl: '/api/deals/cpu',          href: '/cpu',          cacheKey: '__cpu__' },
    { id: 'gpu',          label: 'Graphics',     Icon: TbPhoto,                  baseUrl: '/api/deals/gpu',          href: '/gpu',          cacheKey: '__gpu__' },
    { id: 'motherboards', label: 'Motherboards',    Icon: TbServer, baseUrl: '/api/deals/motherboards', href: '/motherboards', cacheKey: '__motherboards__' },
    { id: 'psu',          label: 'Power Supplies',  Icon: TbBolt,      baseUrl: '/api/deals/psu',          href: '/psu',          cacheKey: '__psu__' },
    { id: 'ssd',          label: 'SSDs',             Icon: TbDatabase,  baseUrl: '/api/deals/ssd',          href: '/ssd',          cacheKey: '__ssd__' },
    { id: 'hdd',          label: 'Hard Drives',      Icon: TbDisc,      baseUrl: '/api/deals/hdd',          href: '/hdd',          cacheKey: '__hdd__' },
] as const;

export default function HomeContent() {
    const { storeId, selectedStore } = useStore();
    const storeName = selectedStore.name;

    const [activeTab, setActiveTab] = useState<string>('desktops');
    // Track which categories have been enabled for fetching.
    // Desktops is first, enable it immediately. Others unlock when they
    // scroll within 400 px of the viewport.
    const [enabledCats, setEnabledCats] = useState<Set<string>>(
        () => new Set(['desktops'])
    );
    const [catCounts, setCatCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        const total = Object.values(catCounts).reduce((s, n) => s + n, 0);
        document.title = total > 0 ? `🔥 ${total} Deals | CCDeals` : 'CCDeals';
        return () => { document.title = 'CCDeals'; };
    }, [catCounts]);
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const tabBarRef = useRef<HTMLDivElement>(null);
    const isScrollingRef = useRef(false);

    // Cache ages
    const ages: Record<string, string | null> = {
        desktops:     useLastUpdated('__all__'),
        laptops:      useLastUpdated('__laptops__'),
        memory:       useLastUpdated('__memory__'),
        cpu:          useLastUpdated('__cpu__'),
        gpu:          useLastUpdated('__gpu__'),
        motherboards: useLastUpdated('__motherboards__'),
    };

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
                        // Unlock fetching for this category once it is near view
                        setEnabledCats(prev => {
                            if (prev.has(cat.id)) return prev;
                            const next = new Set(prev);
                            next.add(cat.id);
                            return next;
                        });
                    }
                },
                // 400 px bottom margin = start fetching before the section
                // actually enters the visible area
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
            const y = el.getBoundingClientRect().top + window.scrollY - 110;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
        setTimeout(() => { isScrollingRef.current = false; }, 800);
    };

    const totalDeals = Object.values(catCounts).reduce((s, n) => s + n, 0);

    return (
        <>
            {/* Hero */}
            <div className="border-b border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
                    <div className="flex items-center gap-2 mb-3">
                        <TbFlame size={14} className="text-violet-600" />
                        <span className="text-xs font-bold uppercase tracking-widest text-violet-600">Live Deals</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        Canada Computers on sale,<br className="hidden sm:block" /> right now.
                    </h1>
                    <p className="mt-2.5 text-slate-500 text-sm sm:text-base max-w-xl">
                        {storeId !== null
                            ? <>Showing deals at <span className="font-semibold text-slate-700">{selectedStore.name}</span>, sorted by biggest savings.</>
                            : 'Every discounted product across all locations, sorted by biggest dollar savings.'}
                    </p>
                    {totalDeals > 0 && (
                        <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            {totalDeals} deals tracked
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky tab bar */}
            <div ref={tabBarRef} className="sticky top-14 z-30 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                        {CATEGORIES.map(cat => {
                            const active = activeTab === cat.id;
                            const count = catCounts[cat.id];
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => scrollToCategory(cat.id)}
                                    className={`relative flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                                        active ? 'text-violet-600' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <cat.Icon size={14} />
                                    {cat.label}
                                    {count > 0 && (
                                        <span className={`text-[10px] font-bold tabular-nums ${
                                            active ? 'text-violet-400' : 'text-slate-400'
                                        }`}>
                                            {count}
                                        </span>
                                    )}
                                    {active && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-t-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Category sections */}
            {CATEGORIES.map((cat, idx) => {
                const age = ages[cat.id];
                const count = catCounts[cat.id];
                const isLast = idx === CATEGORIES.length - 1;

                return (
                    <div
                        key={cat.id}
                        ref={el => { sectionRefs.current[cat.id] = el; }}
                        className={`max-w-7xl mx-auto w-full px-4 sm:px-6 pt-8 ${isLast ? 'pb-16' : 'pb-4'}`}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-base font-bold text-slate-900">{cat.label}</h2>
                                {count > 0 && (
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full tabular-nums">
                                        {count}
                                    </span>
                                )}
                                {age && (
                                    <span className="hidden sm:inline-flex items-center gap-0.5 text-[11px] text-slate-400">
                                        <TbRefresh size={10} />{age}
                                    </span>
                                )}
                            </div>
                            <a
                                href={cat.href}
                                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-violet-600 transition-colors"
                            >
                                View all
                                <TbArrowRight size={13} />
                            </a>
                        </div>
                        <Deals
                            storeId={storeId}
                            storeName={storeName}
                            baseUrl={cat.baseUrl}
                            enabled={enabledCats.has(cat.id)}
                            onCount={(n) => setCatCounts(prev => ({ ...prev, [cat.id]: n }))}
                        />
                        {!isLast && <div className="mt-8 border-t border-slate-100" />}
                    </div>
                );
            })}
        </>
    );
}
