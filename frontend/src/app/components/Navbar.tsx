'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
    TbMapPin, TbCurrentLocation, TbChevronDown, TbX, TbCheck, TbRefresh,
    TbMenu2, TbHeart, TbFlame, TbArrowUp, TbApps,
    TbDeviceDesktopAnalytics, TbDeviceLaptop,
    TbCpu2, TbPhoto, TbCpu, TbServer, TbBolt, TbWind, TbDatabase, TbBox,
} from 'react-icons/tb';
import { useStore } from '../contexts/StoreContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { STORES, distanceBetween, type StoreEntry } from '../lib/stores';

interface StoreWithDist extends StoreEntry { dist: number | null }

function fmtKm(km: number): string {
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function StoreRow({ store, selected, onSelect }: {
    store: StoreWithDist;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            onClick={onSelect}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left ${
                selected ? 'bg-violet-50 text-violet-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
            }`}
        >
            <span>{store.name}</span>
            <div className="flex items-center gap-2 shrink-0">
                {store.dist !== null && (
                    <span className={`text-xs ${selected ? 'text-violet-400' : 'text-slate-400'}`}>
                        {fmtKm(store.dist)}
                    </span>
                )}
                {selected && <TbCheck size={14} className="text-violet-600" />}
            </div>
        </button>
    );
}

const CATEGORY_GROUPS = [
    {
        label: 'Systems',
        items: [
            { href: '/desktops', label: 'Desktops',   Icon: TbDeviceDesktopAnalytics },
            { href: '/laptops',  label: 'Laptops',    Icon: TbDeviceLaptop },
        ],
    },
    {
        label: 'Components',
        items: [
            { href: '/cpu',          label: 'Processors',     Icon: TbCpu2 },
            { href: '/gpu',          label: 'Graphics',       Icon: TbPhoto },
            { href: '/memory',       label: 'Memory',         Icon: TbCpu },
            { href: '/motherboards', label: 'Motherboards',   Icon: TbServer },
            { href: '/psu',          label: 'Power Supplies', Icon: TbBolt },
            { href: '/coolers',      label: 'Coolers',        Icon: TbWind },
        ],
    },
    {
        label: 'Storage & Cases',
        items: [
            { href: '/drives', label: 'Drives', Icon: TbDatabase },
            { href: '/cases',  label: 'Cases',  Icon: TbBox },
        ],
    },
] as const;

const ALL_CATEGORY_HREFS: Set<string> = new Set(
    CATEGORY_GROUPS.flatMap(g => g.items.map(i => i.href))
);

export default function Navbar() {
    const { storeId, selectedStore, locationState, userPos, bannerDismissed, selectStore, requestLocation, dismissBanner } = useStore();
    const { favorites } = useFavorites();
    const [catOpen, setCatOpen]           = useState(false);
    const [storeOpen, setStoreOpen]       = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled]         = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const catRef   = useRef<HTMLDivElement>(null);
    const storeRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (catRef.current   && !catRef.current.contains(e.target as Node))   setCatOpen(false);
            if (storeRef.current && !storeRef.current.contains(e.target as Node)) setStoreOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 8);
            setShowBackToTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => { setMobileMenuOpen(false); setCatOpen(false); }, [pathname]);

    const handleSelectStore = (id: number | null) => { selectStore(id); setStoreOpen(false); };

    const storesWithDist: StoreWithDist[] = STORES
        .filter(s => s.id !== null)
        .map(s => ({
            ...s,
            dist: userPos && s.lat !== undefined && s.lng !== undefined
                ? distanceBetween(userPos, { lat: s.lat, lng: s.lng })
                : null,
        }))
        .sort((a, b) => {
            if (a.dist !== null && b.dist !== null) return a.dist - b.dist;
            if (a.dist !== null) return -1;
            if (b.dist !== null) return 1;
            return a.name.localeCompare(b.name);
        });

    const nearbyStores    = storesWithDist.slice(0, userPos ? 5 : 0);
    const remainingStores = storesWithDist.slice(userPos ? 5 : 0);

    const isActive         = (href: string) => pathname === href;
    const isCategoryActive = ALL_CATEGORY_HREFS.has(pathname ?? '');

    return (
        <>
            <header className="sticky top-0 z-40 bg-zinc-950 px-4 pt-3 pb-2">
                <div className="max-w-7xl mx-auto pointer-events-auto">

                    {/* Floating bar */}
                    <div className={`flex items-center justify-between h-13 bg-zinc-950 border border-zinc-800/80 rounded-2xl pl-3 pr-2 transition-all duration-300 ${
                        scrolled ? 'shadow-2xl shadow-violet-950/20 border-zinc-700/70' : 'shadow-lg shadow-black/30'
                    }`}>

                        {/* Logo */}
                        <a href="/" className="flex items-center gap-2.5 shrink-0 group pr-1">
                            <span className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-linear-to-br from-violet-500 via-fuchsia-500 to-orange-500 shadow-lg shadow-violet-500/25">
                                <TbFlame size={15} className="text-white drop-shadow-sm" />
                            </span>
                            <span className="text-[15px] font-bold text-white tracking-tight leading-none">
                                CC<span className="text-zinc-500 font-semibold">Deals</span>
                            </span>
                            <span className="hidden sm:flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300">Live</span>
                            </span>
                        </a>

                        {/* Desktop nav */}
                        <nav className="hidden lg:flex items-center gap-0.5">

                            {/* Categories mega-menu */}
                            <div ref={catRef} className="relative flex items-center">
                                <button
                                    onClick={() => setCatOpen(v => !v)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        isCategoryActive || catOpen
                                            ? 'text-white bg-zinc-800'
                                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                                    }`}
                                >
                                    <TbApps size={15} />
                                    Categories
                                    <TbChevronDown size={12} className={`transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {catOpen && (
                                    <div className="absolute left-0 top-full mt-3 w-125 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                                        <div className="grid grid-cols-3 divide-x divide-slate-100">
                                            {CATEGORY_GROUPS.map(group => (
                                                <div key={group.label} className="py-3">
                                                    <div className="px-4 pb-2 pt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {group.label}
                                                    </div>
                                                    {group.items.map(({ href, label, Icon }) => (
                                                        <a
                                                            key={href}
                                                            href={href}
                                                            onClick={() => setCatOpen(false)}
                                                            className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                                                                isActive(href)
                                                                    ? 'bg-violet-50 text-violet-600 font-semibold'
                                                                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                                            }`}
                                                        >
                                                            <Icon size={15} className={isActive(href) ? 'text-violet-500' : 'text-slate-400'} />
                                                            {label}
                                                        </a>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Favourites */}
                            <a
                                href="/favorites"
                                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    isActive('/favorites')
                                        ? 'text-white bg-zinc-800'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                                }`}
                            >
                                <TbHeart size={15} className={isActive('/favorites') ? 'text-rose-500' : ''} />
                                Favourites
                                {favorites.length > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                                        {favorites.length > 99 ? '99+' : favorites.length}
                                    </span>
                                )}
                            </a>

                            {/* FAQ */}
                            <a
                                href="/faq"
                                className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    isActive('/faq')
                                        ? 'text-white bg-zinc-800'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                                }`}
                            >
                                FAQ
                            </a>
                        </nav>

                        {/* Right actions */}
                        <div className="flex items-center gap-1.5">

                            {/* Store picker */}
                            <div ref={storeRef} className="relative">
                                <button
                                    onClick={() => setStoreOpen(v => !v)}
                                    className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-all ${
                                        storeId !== null
                                            ? 'bg-violet-600 text-white border-violet-600 hover:bg-violet-500 hover:border-violet-500'
                                            : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white hover:border-zinc-600'
                                    }`}
                                >
                                    <TbMapPin size={14} />
                                    <span className="hidden sm:inline max-w-28 truncate">
                                        {storeId !== null ? selectedStore.name : 'All Stores'}
                                    </span>
                                    <TbChevronDown
                                        size={12}
                                        className={`transition-transform duration-200 ${storeOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {storeOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                                        <div className="p-3 border-b border-slate-100">
                                            <button
                                                onClick={requestLocation}
                                                disabled={locationState === 'loading'}
                                                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
                                            >
                                                {locationState === 'loading'
                                                    ? <TbRefresh size={13} className="animate-spin" />
                                                    : <TbCurrentLocation size={13} />}
                                                {locationState === 'loading' ? 'Detecting…'             :
                                                 locationState === 'granted' ? 'Re-detect my location'  :
                                                 locationState === 'denied'  ? 'Location access denied' :
                                                                               'Use my location'}
                                            </button>
                                            {locationState === 'denied' && (
                                                <p className="text-xs text-slate-400 text-center mt-1.5">
                                                    Enable location in your browser settings.
                                                </p>
                                            )}
                                        </div>
                                        <div className="overflow-y-auto max-h-80">
                                            <button
                                                onClick={() => handleSelectStore(null)}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                                                    storeId === null
                                                        ? 'bg-violet-50 text-violet-700 font-semibold'
                                                        : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span>All Stores</span>
                                                {storeId === null && <TbCheck size={13} className="text-violet-600" />}
                                            </button>
                                            {nearbyStores.length > 0 && (
                                                <>
                                                    <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-t border-slate-100">
                                                        Nearest to you
                                                    </div>
                                                    {nearbyStores.map(s => (
                                                        <StoreRow key={s.id} store={s} selected={storeId === s.id} onSelect={() => handleSelectStore(s.id)} />
                                                    ))}
                                                </>
                                            )}
                                            <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-t border-slate-100">
                                                {nearbyStores.length > 0 ? 'More locations' : 'All locations'}
                                            </div>
                                            {remainingStores.map(s => (
                                                <StoreRow key={s.id} store={s} selected={storeId === s.id} onSelect={() => handleSelectStore(s.id)} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Hamburger (mobile/tablet) */}
                            <button
                                onClick={() => setMobileMenuOpen(v => !v)}
                                className="lg:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                aria-label="Toggle menu"
                            >
                                {mobileMenuOpen ? <TbX size={20} /> : <TbMenu2 size={20} />}
                            </button>
                        </div>
                    </div>

                {/* Mobile drawer */}
                {mobileMenuOpen && (
                    <div className="pointer-events-auto mt-2 bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl shadow-black/40">
                        <div className="px-4 py-4 space-y-4">
                            {CATEGORY_GROUPS.map(group => (
                                <div key={group.label}>
                                    <div className="px-1 pb-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                        {group.label}
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                        {group.items.map(({ href, label, Icon }) => (
                                            <a
                                                key={href}
                                                href={href}
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                    isActive(href)
                                                        ? 'text-white bg-zinc-800'
                                                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                                }`}
                                            >
                                                <Icon size={15} className={isActive(href) ? 'text-violet-400' : 'text-zinc-500'} />
                                                {label}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="border-t border-zinc-800 pt-3 grid grid-cols-2 gap-1">
                                <a
                                    href="/favorites"
                                    className={`relative flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                        isActive('/favorites')
                                            ? 'text-white bg-zinc-800'
                                            : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                    }`}
                                >
                                    <TbHeart size={15} className={isActive('/favorites') ? 'text-rose-500' : 'text-zinc-500'} />
                                    Favourites
                                    {favorites.length > 0 && (
                                        <span className="ml-auto min-w-5 h-5 px-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                                            {favorites.length > 99 ? '99+' : favorites.length}
                                        </span>
                                    )}
                                </a>
                                <a
                                    href="/faq"
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                        isActive('/faq')
                                            ? 'text-white bg-zinc-800'
                                            : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                    }`}
                                >
                                    FAQ
                                </a>
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </header>

            {/* Location banner */}
            {bannerDismissed === false && (
                <div className="bg-zinc-950 px-4 pb-2">
                    <div className="max-w-7xl mx-auto bg-linear-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl shadow-lg shadow-violet-500/20">
                        <div className="px-4 sm:px-5 py-2.5 flex items-center gap-3">
                            <span className="shrink-0 w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                                <TbMapPin size={14} />
                            </span>
                            <p className="text-sm flex-1 min-w-0">
                                <span className="font-semibold">Find deals near you!</span>
                                <span className="text-violet-100/80 ml-1.5 hidden sm:inline">Allow location access for store-specific results.</span>
                            </p>
                            <button
                                onClick={requestLocation}
                                className="shrink-0 bg-white text-violet-700 font-semibold text-xs px-3.5 py-1.5 rounded-full hover:bg-violet-50 hover:scale-[1.03] active:scale-100 transition-all"
                            >
                                Allow
                            </button>
                            <button onClick={dismissBanner} className="shrink-0 text-violet-100/80 hover:text-white transition-colors" aria-label="Dismiss">
                                <TbX size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Back to top */}
            {showBackToTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-6 z-40 p-3 bg-zinc-950 text-white border border-zinc-800 rounded-full shadow-xl shadow-black/30 hover:bg-violet-600 hover:border-violet-500 hover:shadow-violet-500/30 hover:scale-105 active:scale-100 transition-all duration-200 animate-fade-up"
                    aria-label="Back to top"
                >
                    <TbArrowUp size={17} />
                </button>
            )}
        </>
    );
}
