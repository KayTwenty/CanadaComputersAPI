'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
    TbDeviceDesktop, TbMapPin,
    TbCurrentLocation, TbChevronDown, TbX, TbCheck, TbRefresh,
    TbCpu, TbCpu2, TbPhoto, TbMenu2, TbHeart, TbQuestionMark,
    TbDeviceLaptop, TbFlame, TbSearch, TbArrowUp,
} from 'react-icons/tb';
import { useStore } from '../contexts/StoreContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { STORES, distanceBetween, type StoreEntry } from '../lib/stores';

interface StoreWithDist extends StoreEntry { dist: number | null }

function fmtKm(km: number): string {
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

interface SearchResult {
    title: string;
    price: string;
    item_code: string;
    online_availability: string;
    instore_availability: string;
    link: string;
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
    { href: '/desktops', label: 'Desktops',   Icon: TbDeviceDesktop },
    { href: '/laptops',  label: 'Laptops',    Icon: TbDeviceLaptop },
    { href: '/memory',   label: 'Memory',     Icon: TbCpu },
    { href: '/cpu',      label: 'Processors', Icon: TbCpu2 },
    { href: '/gpu',      label: 'Graphics',   Icon: TbPhoto },
];

const SECONDARY_LINKS = [
    { href: '/favorites', label: 'Favorites', Icon: TbHeart },
    { href: '/faq',       label: 'FAQ',       Icon: TbQuestionMark },
];

export default function Navbar() {
    const { storeId, selectedStore, locationState, userPos, bannerDismissed, selectStore, requestLocation, dismissBanner } = useStore();
    const { favorites } = useFavorites();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Track scroll for shadow + back-to-top visibility
    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 8);
            setShowBackToTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Search: debounce live results
    useEffect(() => {
        if (!searchOpen || searchQuery.trim().length < 2) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }
        setSearchLoading(true);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search/${encodeURIComponent(searchQuery.trim())}`);
                const data = await res.json();
                setSearchResults(Array.isArray(data.products) ? data.products : []);
            } catch {
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery, searchOpen]);

    // Search: ESC closes, click-outside closes
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSearchOpen(false); searchInputRef.current?.blur(); } };
        const onMouse = (e: MouseEvent) => {
            if (searchInputRef.current && !searchInputRef.current.closest('div')?.contains(e.target as Node))
                setSearchOpen(false);
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onMouse);
        return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onMouse); };
    }, []);

    useEffect(() => {
        if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
        else { setSearchQuery(''); setSearchResults([]); setSearchLoading(false); }
    }, [searchOpen]);

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

    const isActive = (path: string) => pathname === path;

    return (
        <>
            <header className={`bg-zinc-950 sticky top-0 z-40 transition-shadow duration-300 ${scrolled ? 'shadow-lg shadow-black/20' : ''}`}>
                {/* ── Main row ──────────────────────────────────────────── */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-14">
                        {/* Left: logo */}
                        <div className="flex items-center gap-4">
                            <a href="/" className="flex items-center gap-2.5 group shrink-0">
                                <div className="bg-violet-600 text-white p-1.5 rounded-lg group-hover:bg-violet-500 transition-colors duration-200">
                                    <TbFlame size={16} />
                                </div>
                                <span className="text-sm font-extrabold text-white tracking-tight">
                                    CC<span className="text-zinc-500">Deals</span>
                                </span>
                            </a>

                            {/* Desktop category nav — pill style */}
                            <nav className="hidden lg:flex items-center gap-0.5 ml-4">
                                {NAV_LINKS.map(({ href, label, Icon }) => (
                                    <a
                                        key={href}
                                        href={href}
                                        className={`inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                                            isActive(href)
                                                ? 'bg-zinc-800 text-white'
                                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                                        }`}
                                    >
                                        <Icon size={14} className={isActive(href) ? 'text-violet-400' : ''} />
                                        {label}
                                    </a>
                                ))}
                            </nav>
                        </div>

                        {/* Right: actions */}
                        <div className="flex items-center gap-2">
                            {/* Search bar — inline, left of Favorites */}
                            <div className="relative hidden sm:block" ref={el => { if (el) (el as HTMLDivElement & { _searchRef?: boolean })._searchRef = true; }}>
                                <div className="flex items-center gap-2 bg-zinc-800/80 border border-zinc-700/50 hover:border-zinc-600 rounded-lg px-3 py-1.5 transition-colors focus-within:border-zinc-500">
                                    <TbSearch size={14} className="text-zinc-500 shrink-0" />
                                    <input
                                        ref={searchInputRef}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onFocus={() => setSearchOpen(true)}
                                        placeholder="Search…"
                                        className="w-36 text-[13px] text-zinc-200 placeholder:text-zinc-600 outline-none bg-transparent"
                                    />
                                    {searchLoading && <TbRefresh size={13} className="animate-spin text-zinc-500 shrink-0" />}
                                    {searchQuery && !searchLoading && (
                                        <button onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchOpen(false); }} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                                            <TbX size={13} />
                                        </button>
                                    )}
                                </div>

                                {/* Dropdown results */}
                                {searchOpen && (searchResults.length > 0 || (searchQuery.trim().length >= 2 && !searchLoading)) && (
                                    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                                        {searchResults.length > 0 ? (
                                            <div className="overflow-y-auto max-h-[60vh]">
                                                {searchResults.map((r, i) => (
                                                    <a
                                                        key={i}
                                                        href={r.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                                                        className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors last:border-0"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-slate-900 truncate">{r.title}</p>
                                                            <p className="text-xs text-slate-400 mt-0.5 truncate">{r.online_availability} · {r.instore_availability}</p>
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-900 ml-4 shrink-0">{r.price}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-400 text-center py-8">No results for &ldquo;{searchQuery}&rdquo;.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Favorites — desktop */}
                            <a
                                href="/favorites"
                                className={`hidden sm:inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-lg transition-all duration-200 relative ${
                                    isActive('/favorites')
                                        ? 'bg-zinc-800 text-white'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                                }`}
                            >
                                <TbHeart size={14} className={isActive('/favorites') ? 'text-rose-400' : ''} />
                                Favorites
                                {favorites.length > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                                        {favorites.length > 99 ? '99+' : favorites.length}
                                    </span>
                                )}
                            </a>

                            {/* Store picker */}
                            <div ref={dropdownRef} className="relative">
                                <button
                                    onClick={() => setDropdownOpen(v => !v)}
                                    className={`inline-flex items-center gap-1.5 text-[13px] font-medium rounded-lg px-3 py-1.5 border transition-all duration-200 ${
                                        storeId !== null
                                            ? 'bg-violet-600 text-white border-violet-500 hover:bg-violet-500'
                                            : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/50 hover:bg-zinc-700 hover:text-white hover:border-zinc-600'
                                    }`}
                                >
                                    <TbMapPin size={13} />
                                    <span className="max-w-24 truncate hidden sm:inline">{selectedStore.name}</span>
                                    <TbChevronDown
                                        size={11}
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

                            {/* Search — mobile (icon only, opens modal) */}
                            <button
                                onClick={() => setSearchOpen(true)}
                                className="sm:hidden p-1.5 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800/60"
                                aria-label="Search"
                            >
                                <TbSearch size={18} />
                            </button>

                            {/* FAQ — desktop only */}
                            <a
                                href="/faq"
                                className={`hidden sm:inline-flex items-center gap-1 text-[13px] font-medium px-2.5 py-1.5 rounded-lg transition-all duration-200 ${
                                    isActive('/faq')
                                        ? 'bg-zinc-800 text-white'
                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
                                }`}
                            >
                                <TbQuestionMark size={14} />
                            </a>

                            {/* Hamburger — mobile */}
                            <button
                                onClick={() => setMobileMenuOpen(v => !v)}
                                className="lg:hidden p-1.5 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800/60"
                                aria-label="Toggle menu"
                            >
                                {mobileMenuOpen ? <TbX size={20} /> : <TbMenu2 size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Mobile drawer ─────────────────────────────────────── */}
                {mobileMenuOpen && (
                    <div className="lg:hidden bg-zinc-950 border-t border-zinc-800/60">
                        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 px-3 mb-1">Categories</p>
                            {NAV_LINKS.map(({ href, label, Icon }) => (
                                <a
                                    key={href}
                                    href={href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                        isActive(href)
                                            ? 'bg-zinc-800 text-white'
                                            : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
                                    }`}
                                >
                                    <Icon size={16} className={isActive(href) ? 'text-violet-400' : ''} />
                                    {label}
                                </a>
                            ))}
                            <div className="my-2 border-t border-zinc-800/60" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 px-3 mb-1">More</p>
                            {SECONDARY_LINKS.map(({ href, label, Icon }) => (
                                <a
                                    key={href}
                                    href={href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative ${
                                        isActive(href)
                                            ? 'bg-zinc-800 text-white'
                                            : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
                                    }`}
                                >
                                    <Icon size={16} className={isActive(href) && href === '/favorites' ? 'text-rose-400' : ''} />
                                    {label}
                                    {href === '/favorites' && favorites.length > 0 && (
                                        <span className="ml-auto min-w-5 h-5 px-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                                            {favorites.length > 99 ? '99+' : favorites.length}
                                        </span>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            {/* Location banner — shown only before user has responded */}
            {bannerDismissed === false && (
                <div className="bg-linear-to-r from-violet-700 to-violet-600 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
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

            {/* ── Mobile search modal ────────────────────────────────── */}
            {searchOpen && (
                <div
                    className="sm:hidden fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setSearchOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
                            <TbSearch size={18} className="text-slate-400 shrink-0" />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search products…"
                                className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
                                autoFocus
                            />
                            {searchLoading && <TbRefresh size={15} className="animate-spin text-slate-400 shrink-0" />}
                            <button onClick={() => setSearchOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <TbX size={18} />
                            </button>
                        </div>
                        {searchResults.length > 0 && (
                            <div className="overflow-y-auto max-h-[60vh]">
                                {searchResults.map((r, i) => (
                                    <a key={i} href={r.link} target="_blank" rel="noopener noreferrer"
                                        onClick={() => setSearchOpen(false)}
                                        className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors last:border-0"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">{r.title}</p>
                                            <p className="text-xs text-slate-400 mt-0.5 truncate">{r.online_availability} · {r.instore_availability}</p>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900 ml-4 shrink-0">{r.price}</span>
                                    </a>
                                ))}
                            </div>
                        )}
                        {searchQuery.trim().length >= 2 && !searchLoading && searchResults.length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-8">No results for &ldquo;{searchQuery}&rdquo;.</p>
                        )}
                        {searchQuery.trim().length < 2 && (
                            <p className="text-sm text-slate-400 text-center py-6">Type at least 2 characters to search…</p>
                        )}
                    </div>
                </div>
            )}

            {/* ── Back to top ───────────────────────────────────────── */}
            {showBackToTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-6 z-40 p-3 bg-zinc-900 text-white rounded-full shadow-lg hover:bg-violet-600 transition-all duration-200 hover:scale-110 active:scale-95"
                    aria-label="Back to top"
                >
                    <TbArrowUp size={18} />
                </button>
            )}
        </>
    );
}
