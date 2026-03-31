'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
    TbDeviceDesktop, TbMapPin,
    TbCurrentLocation, TbChevronDown, TbX, TbCheck, TbRefresh, TbCpu, TbCpu2, TbPhoto, TbMenu2, TbHeart, TbQuestionMark,
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

export default function Navbar() {
    const { storeId, selectedStore, locationState, userPos, bannerDismissed, selectStore, requestLocation, dismissBanner } = useStore();
    const { favorites } = useFavorites();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Close mobile menu on route change
    useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

    const handleSelectStore = (id: number | null) => {
        selectStore(id);
        setDropdownOpen(false);
    };

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

    const navCls = (path: string) =>
        `flex items-center gap-1.5 text-sm transition-colors ${
            pathname === path
                ? 'font-semibold text-white'
                : 'font-medium text-zinc-400 hover:text-white'
        }`;

    return (
        <>
            <header className="bg-zinc-900 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
                    {/* Logo + desktop nav links */}
                    <div className="flex items-center gap-6">
                        <a href="/" className="flex items-center gap-3 group">
                            <div className="bg-white text-zinc-900 p-1.5 rounded-md group-hover:scale-105 transition-transform duration-200">
                                <TbDeviceDesktop size={18} />
                            </div>
                            <span className="text-sm font-bold text-white tracking-tight">
                                CC<span className="text-zinc-500">Deals</span>
                            </span>
                        </a>
                        <div className="hidden sm:flex items-center gap-5 border-l border-zinc-700 pl-6">
                            <a href="/desktops" className={navCls('/desktops')}>
                                <TbDeviceDesktop size={14} />
                                Desktops
                            </a>
                            <a href="/memory" className={navCls('/memory')}>
                                <TbCpu size={14} />
                                Memory
                            </a>
                            <a href="/cpu" className={navCls('/cpu')}>
                                <TbCpu2 size={14} />
                                Processors
                            </a>
                            <a href="/gpu" className={navCls('/gpu')}>
                                <TbPhoto size={14} />
                                Graphics
                            </a>
                            <div className="w-px h-4 bg-zinc-700" />
                            <a href="/favorites" className={`${navCls('/favorites')} relative`}>
                                <TbHeart size={14} />
                                Favorites
                                {favorites.length > 0 && (
                                    <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                                        {favorites.length > 99 ? '99+' : favorites.length}
                                    </span>
                                )}
                            </a>
                            <a href="/faq" className={navCls('/faq')}>
                                <TbQuestionMark size={14} />
                                FAQ
                            </a>
                        </div>
                    </div>

                    {/* Right side: store picker + browse + hamburger */}
                    <nav className="flex items-center gap-2">
                        <div ref={dropdownRef} className="relative">
                            <button
                                onClick={() => setDropdownOpen(v => !v)}
                                className={`inline-flex items-center gap-2 text-xs font-medium rounded-full px-3.5 py-1.5 border transition-all duration-200 ${
                                    storeId !== null
                                        ? 'bg-violet-600 text-white border-violet-500 hover:bg-violet-500'
                                        : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/50 hover:bg-zinc-700 hover:text-white hover:border-zinc-600'
                                }`}
                            >
                                <TbMapPin size={13} />
                                <span className="max-w-28 truncate">{selectedStore.name}</span>
                                <TbChevronDown
                                    size={12}
                                    className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                                    <div className="p-3 border-b border-slate-100">
                                        <button
                                            onClick={requestLocation}
                                            disabled={locationState === 'loading'}
                                            className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
                                        >
                                            {locationState === 'loading'
                                                ? <TbRefresh size={14} className="animate-spin" />
                                                : <TbCurrentLocation size={14} />}
                                            {locationState === 'loading' ? 'Detecting…'             :
                                             locationState === 'granted' ? 'Re-detect my location'  :
                                             locationState === 'denied'  ? 'Location access denied' :
                                                                           'Detect nearest store'}
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
                                            {storeId === null && <TbCheck size={14} className="text-violet-600" />}
                                        </button>

                                        {nearbyStores.length > 0 && (
                                            <>
                                                <div className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-t border-slate-100">
                                                    Nearest to you
                                                </div>
                                                {nearbyStores.map(s => (
                                                    <StoreRow key={s.id} store={s} selected={storeId === s.id} onSelect={() => handleSelectStore(s.id)} />
                                                ))}
                                            </>
                                        )}

                                        <div className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-t border-slate-100">
                                            {nearbyStores.length > 0 ? 'More locations' : 'All locations'}
                                        </div>
                                        {remainingStores.map(s => (
                                            <StoreRow key={s.id} store={s} selected={storeId === s.id} onSelect={() => handleSelectStore(s.id)} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Hamburger — mobile only */}
                        <button
                            onClick={() => setMobileMenuOpen(v => !v)}
                            className="sm:hidden p-1.5 text-zinc-400 hover:text-white transition-colors"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <TbX size={22} /> : <TbMenu2 size={22} />}
                        </button>
                    </nav>
                </div>

                {/* Mobile nav drawer */}
                {mobileMenuOpen && (
                    <div className="sm:hidden bg-zinc-900 border-t border-zinc-800 px-6 py-4 flex flex-col gap-1">
                        {[
                            { href: '/desktops', label: 'Desktops',   Icon: TbDeviceDesktop },
                            { href: '/memory',   label: 'Memory',     Icon: TbCpu },
                            { href: '/cpu',      label: 'Processors', Icon: TbCpu2 },
                            { href: '/gpu',      label: 'Graphics',   Icon: TbPhoto },
                            { href: '/favorites', label: 'Favorites', Icon: TbHeart },
                            { href: '/faq',       label: 'FAQ',       Icon: TbQuestionMark },
                        ].map(({ href, label, Icon }) => (
                            <a
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                    pathname === href
                                        ? 'bg-zinc-800 text-white'
                                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                }`}
                            >
                                <Icon size={16} />
                                {label}
                            </a>
                        ))}
                        <div className="mt-2 pt-3 border-t border-zinc-800" />
                    </div>
                )}
            </header>

            {/* Location banner — shown only before user has responded */}
            {bannerDismissed === false && (
                <div className="bg-linear-to-r from-violet-700 to-violet-600 text-white">
                    <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center gap-3">
                        <TbMapPin size={15} className="shrink-0" />
                        <p className="text-sm flex-1 min-w-0">
                            <span className="font-semibold">Find deals at your nearest store</span>
                            <span className="text-violet-200 ml-1.5 hidden sm:inline">
                                — allow location access for personalised results.
                            </span>
                        </p>
                        <button
                            onClick={requestLocation}
                            className="shrink-0 bg-white text-violet-700 font-semibold text-xs px-3 py-1.5 rounded-full hover:bg-violet-50 transition-colors"
                        >
                            Allow
                        </button>
                        <button
                            onClick={dismissBanner}
                            className="shrink-0 text-violet-300 hover:text-white transition-colors"
                            aria-label="Dismiss"
                        >
                            <TbX size={16} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
