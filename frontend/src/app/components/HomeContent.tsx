'use client';

import { useState, useRef, useEffect } from 'react';
import {
    TbArrowRight, TbCpu, TbDeviceDesktopAnalytics, TbCpu2,
    TbPhoto, TbRefresh, TbDeviceLaptop, TbFlame,
} from 'react-icons/tb';
import Deals from './Deals';
import { useStore } from '../contexts/StoreContext';
import { useLastUpdated } from '../hooks/useLastUpdated';

const CATEGORIES = [
    { id: 'desktops', label: 'Desktops',   Icon: TbDeviceDesktopAnalytics, color: 'violet',  baseUrl: '/api/deals/desktops',  href: '/desktops',  cacheKey: '__all__',      desc: 'Prebuilt desktops on sale' },
    { id: 'laptops',  label: 'Laptops',    Icon: TbDeviceLaptop,           color: 'blue',    baseUrl: '/api/deals/laptops',   href: '/laptops',   cacheKey: '__laptops__',  desc: 'Windows, Business & Gaming laptops' },
    { id: 'memory',   label: 'Memory',     Icon: TbCpu,                    color: 'sky',     baseUrl: '/api/deals/memory',    href: '/memory',    cacheKey: '__memory__',   desc: 'On-sale memory kits' },
    { id: 'cpu',      label: 'Processors', Icon: TbCpu2,                   color: 'orange',  baseUrl: '/api/deals/cpu',       href: '/cpu',       cacheKey: '__cpu__',      desc: 'On-sale CPUs' },
    { id: 'gpu',      label: 'Graphics',   Icon: TbPhoto,                  color: 'emerald', baseUrl: '/api/deals/gpu',       href: '/gpu',       cacheKey: '__gpu__',      desc: 'On-sale graphics cards' },
] as const;

const COLOR_MAP: Record<string, { badge: string; ring: string; text: string; bg: string; pill: string; pillActive: string }> = {
    violet:  { badge: 'bg-violet-100 text-violet-700',  ring: 'ring-violet-200',  text: 'text-violet-600',  bg: 'bg-violet-50',  pill: 'text-slate-500 hover:text-violet-700 hover:bg-violet-50',  pillActive: 'bg-violet-600 text-white shadow-sm' },
    blue:    { badge: 'bg-blue-100 text-blue-700',      ring: 'ring-blue-200',    text: 'text-blue-600',    bg: 'bg-blue-50',    pill: 'text-slate-500 hover:text-blue-700 hover:bg-blue-50',      pillActive: 'bg-blue-600 text-white shadow-sm' },
    sky:     { badge: 'bg-sky-100 text-sky-700',        ring: 'ring-sky-200',     text: 'text-sky-600',     bg: 'bg-sky-50',     pill: 'text-slate-500 hover:text-sky-700 hover:bg-sky-50',        pillActive: 'bg-sky-600 text-white shadow-sm' },
    orange:  { badge: 'bg-orange-100 text-orange-700',  ring: 'ring-orange-200',  text: 'text-orange-600',  bg: 'bg-orange-50',  pill: 'text-slate-500 hover:text-orange-700 hover:bg-orange-50',  pillActive: 'bg-orange-600 text-white shadow-sm' },
    emerald: { badge: 'bg-emerald-100 text-emerald-700', ring: 'ring-emerald-200', text: 'text-emerald-600', bg: 'bg-emerald-50', pill: 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50', pillActive: 'bg-emerald-600 text-white shadow-sm' },
};

export default function HomeContent() {
    const { storeId, selectedStore } = useStore();
    const storeName = selectedStore.name;

    const [activeTab, setActiveTab] = useState<string>('desktops');
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const tabBarRef = useRef<HTMLDivElement>(null);
    const isScrollingRef = useRef(false);

    // Cache ages
    const ages: Record<string, string | null> = {
        desktops: useLastUpdated('__all__'),
        laptops:  useLastUpdated('__laptops__'),
        memory:   useLastUpdated('__memory__'),
        cpu:      useLastUpdated('__cpu__'),
        gpu:      useLastUpdated('__gpu__'),
    };

    // Intersection observer for auto-highlighting the tab as user scrolls
    useEffect(() => {
        const observers: IntersectionObserver[] = [];
        for (const cat of CATEGORIES) {
            const el = sectionRefs.current[cat.id];
            if (!el) continue;
            const obs = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting && !isScrollingRef.current) {
                        setActiveTab(cat.id);
                    }
                },
                { rootMargin: '-120px 0px -60% 0px', threshold: 0 },
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

    return (
        <>
            {/* ── Hero ────────────────────────────────────────────────────── */}
            <div className="bg-linear-to-b from-slate-50 to-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8 sm:pb-10">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
                            <TbFlame size={13} />
                            Live deals
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-2xl">
                        Best electronics deals<br className="hidden sm:block" /> right now
                    </h1>
                    <p className="mt-3 text-slate-500 text-sm sm:text-base max-w-lg">
                        {storeId !== null
                            ? <>Every sale at <span className="font-semibold text-slate-700">{selectedStore.name}</span>, sorted by biggest savings.</>
                            : 'Every on-sale product from Canada Computers, sorted by biggest dollar savings.'}
                    </p>

                    {/* Quick-nav category cards */}
                    <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {CATEGORIES.map(cat => {
                            const c = COLOR_MAP[cat.color];
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => scrollToCategory(cat.id)}
                                    className={`group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 text-left transition-all hover:shadow-md hover:border-slate-200 hover:scale-[1.02] active:scale-[0.98]`}
                                >
                                    <div className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl ${c.badge} transition-colors`}>
                                        <cat.Icon size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{cat.label}</p>
                                        <p className="text-xs text-slate-400 truncate">{cat.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Sticky tab bar ──────────────────────────────────────────── */}
            <div ref={tabBarRef} className="sticky top-14 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-2.5 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                        {CATEGORIES.map(cat => {
                            const active = activeTab === cat.id;
                            const c = COLOR_MAP[cat.color];
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => scrollToCategory(cat.id)}
                                    className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-full whitespace-nowrap transition-all ${
                                        active ? c.pillActive : c.pill
                                    }`}
                                >
                                    <cat.Icon size={14} />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Category sections ───────────────────────────────────────── */}
            {CATEGORIES.map((cat, idx) => {
                const c = COLOR_MAP[cat.color];
                const age = ages[cat.id];
                const isLast = idx === CATEGORIES.length - 1;

                return (
                    <div
                        key={cat.id}
                        ref={el => { sectionRefs.current[cat.id] = el; }}
                        className={`max-w-7xl mx-auto w-full px-4 sm:px-6 pt-10 ${isLast ? 'pb-16' : 'pb-6'}`}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
                            <div>
                                <p className={`text-sm font-semibold ${c.text} mb-1 flex items-center gap-1.5`}>
                                    <cat.Icon size={14} />
                                    {cat.label}
                                </p>
                                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                                    {cat.label} deals
                                </h3>
                                <p className="mt-1.5 text-slate-500 text-sm max-w-md">
                                    {cat.desc}, sorted by biggest dollar savings first.
                                </p>
                                {age && (
                                    <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                                        <TbRefresh size={11} />{age}
                                    </p>
                                )}
                            </div>
                            <a
                                href={cat.href}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors shrink-0"
                            >
                                View all {cat.label.toLowerCase()}
                                <TbArrowRight size={16} />
                            </a>
                        </div>
                        <Deals storeId={storeId} storeName={storeName} baseUrl={cat.baseUrl} />

                        {/* Divider between sections */}
                        {!isLast && <div className="mt-10 border-t border-slate-100" />}
                    </div>
                );
            })}
        </>
    );
}
