'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
    TbMapPin, TbCurrentLocation, TbChevronDown, TbX, TbCheck, TbRefresh,
    TbMenu2, TbHeart, TbFlame, TbArrowUp,
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

const NAV_LINKS = [
    { href: '/desktops',     label: 'Desktops' },
    { href: '/laptops',      label: 'Laptops' },
    { href: '/memory',       label: 'Memory' },
    { href: '/cpu',          label: 'Processors' },
    { href: '/gpu',          label: 'Graphics' },
    { href: '/motherboards', label: 'Motherboards' },
    { href: '/psu',          label: 'Power Supplies' },
    { href: '/ssd',          label: 'SSDs' },
    { href: '/hdd',          label: 'Hard Drives' },
    { href: '/favorites',    label: 'Favorites' },
    { href: '/faq',          label: 'FAQ' },
];

export default function Navbar() {
    const { storeId, selectedStore, locationState, userPos, bannerDismissed, selectStore, requestLocation, dismissBanner } = useStore();
    const { favorites } = useFavorites();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
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

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 8);
            setShowBackToTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

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

    const isActive = (path: string) => pathname === path;

    return (
        <>
            <header className={`bg-zinc-950 sticky top-0 z-40 border-b border-zinc-800 transition-all duration-200 ${
                scrolled ? 'shadow-lg shadow-black/30' : ''
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-14">

                        {/* Logo */}
                        <a href="/" className="flex items-center gap-2 shrink-0 group">
                            <TbFlame size={18} className="text-violet-500 group-hover:text-violet-400 transition-colors" />
                            <span className="text-sm font-bold text-white tracking-tight">
                                CC<span className="text-zinc-500">Deals</span>
                            </span>
                        </a>

                        {/* Desktop nav */}
                        <nav className="hidden lg:flex items-center h-full ml-8">
                            {NAV_LINKS.slice(0, 9).map(({ href, label }) => (
                                <a
                                    key={href}
                                    href={href}
                                    className={`relative flex items-center h-full px-3.5 text-sm font-medium transition-colors ${
                                        isActive(href)
                                            ? 'text-white'
                                            : 'text-zinc-400 hover:text-zinc-100'
                                    }`}
                                >
                                    {label}
                                    {isActive(href) && (
                                        <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-violet-500 rounded-t-full" />
                                    )}
                                </a>
                            ))}
                        </nav>

                        {/* Right actions */}
                        <div className="flex items-center gap-1.5">

                            {/* Favorites */}
                            <a
                                href="/favorites"
                                className={`relative hidden sm:inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                                    isActive('/favorites')
                                        ? 'text-white bg-zinc-800'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`}
                            >
                                <TbHeart size={15} className={isActive('/favorites') ? 'text-rose-500' : ''} />
                                <span className="hidden md:inline">Favorites</span>
                                {favorites.length > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                                        {favorites.length > 99 ? '99+' : favorites.length}
                                    </span>
                                )}
                            </a>

                            {/* Store picker */}
                            <div ref={dropdownRef} className="relative">
                                <button
                                    onClick={() => setDropdownOpen(v => !v)}
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
                                        className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {dropdownOpen && (
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
                </div>

                {/* Mobile drawer */}
                {mobileMenuOpen && (
                    <div className="lg:hidden border-t border-zinc-800 bg-zinc-950">
                        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col">
                            {NAV_LINKS.map(({ href, label }) => (
                                <a
                                    key={href}
                                    href={href}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                        isActive(href)
                                            ? 'text-white bg-zinc-800'
                                            : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                    }`}
                                >
                                    {label}
                                    {href === '/favorites' && favorites.length > 0 && (
                                        <span className="min-w-5 h-5 px-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                                            {favorites.length > 99 ? '99+' : favorites.length}
                                        </span>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            {/* Location banner */}
            {bannerDismissed === false && (
                <div className="bg-violet-600 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
                        <TbMapPin size={14} className="shrink-0" />
                        <p className="text-sm flex-1 min-w-0">
                            <span className="font-semibold">Find deals near you</span>
                            <span className="text-violet-200 ml-1.5 hidden sm:inline">- allow location access for store-specific results.</span>
                        </p>
                        <button
                            onClick={requestLocation}
                            className="shrink-0 bg-white text-violet-700 font-semibold text-xs px-3 py-1.5 rounded-full hover:bg-violet-50 transition-colors"
                        >
                            Allow
                        </button>
                        <button onClick={dismissBanner} className="shrink-0 text-violet-300 hover:text-white transition-colors" aria-label="Dismiss">
                            <TbX size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Back to top */}
            {showBackToTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-6 z-40 p-2.5 bg-white text-slate-700 border border-slate-200 rounded-full shadow-md hover:shadow-lg hover:text-violet-600 hover:border-violet-300 transition-all duration-200"
                    aria-label="Back to top"
                >
                    <TbArrowUp size={17} />
                </button>
            )}
        </>
    );
}
