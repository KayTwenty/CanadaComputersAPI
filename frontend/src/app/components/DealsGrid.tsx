'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { TbTag, TbWorld, TbBuildingStore, TbX, TbRefresh, TbPercentage, TbChevronDown } from 'react-icons/tb';
import ShareButton from './ShareButton';
import FavoriteButton from './FavoriteButton';
import PriceHistorySparkline from './PriceHistorySparkline';
import { useLastUpdated } from '../hooks/useLastUpdated';

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

function isAvailable(str: string): boolean {
    if (!str) return false;
    const s = str.toLowerCase();
    return s.includes('available') && !s.includes('not available');
}

const price = (p: Product) => parseFloat(p.price.replace(/[$,]/g, ''));
const savingsAmt = (p: Product) => {
    const reg = parseFloat(p.regular_price.replace(/[$,]/g, ''));
    return reg - price(p);
};

const DEFAULT_BASE_URL = '/api/deals/desktops';

const CATEGORY_BRANDS: Record<string, string[]> = {
    desktops:     ['ARMOURY', 'iSmart', 'MSI', 'Lenovo', 'HP', 'Dell', 'ASUS', 'Acer', 'CyberpowerPC', 'iBUYPOWER'],
    memory:       ['Kingston', 'Corsair', 'G.Skill', 'Crucial', 'TeamGroup', 'Patriot', 'Samsung', 'A-Data', 'PNY', 'Mushkin'],
    cpu:          ['Intel', 'AMD'],
    gpu:          ['ASUS', 'MSI', 'Gigabyte', 'Zotac', 'Sapphire', 'PowerColor', 'XFX', 'ASRock', 'PNY', 'EVGA'],
    laptops:      ['ASUS', 'MSI', 'Lenovo', 'HP', 'Dell', 'Acer', 'Samsung', 'LG', 'Razer', 'Microsoft'],
    motherboards: ['ASUS', 'MSI', 'Gigabyte', 'ASRock', 'Biostar'],
    psu:          ['Corsair', 'EVGA', 'Seasonic', 'be quiet!', 'Thermaltake', 'ASUS', 'Cooler Master', 'Fractal', 'Antec', 'FSP'],
    ssd:          ['Samsung', 'WD', 'Seagate', 'Crucial', 'Kingston', 'SK hynix', 'Sabrent', 'PNY', 'Lexar', 'Corsair'],
    hdd:          ['Seagate', 'WD', 'Toshiba', 'HGST', 'Samsung'],
    drives:       ['Samsung', 'WD', 'Seagate', 'Crucial', 'Kingston', 'SK hynix', 'Toshiba', 'HGST', 'Sabrent', 'PNY'],
    coolers:      ['Noctua', 'be quiet!', 'Corsair', 'Arctic', 'Cooler Master', 'DeepCool', 'Thermalright', 'ASUS', 'NZXT', 'Lian Li'],
    cases:        ['Lian Li', 'Fractal', 'NZXT', 'Corsair', 'be quiet!', 'Phanteks', 'Cooler Master', 'Thermaltake', 'Silverstone', 'DeepCool'],
};

function detectBrand(title: string, knownBrands: string[]): string | null {
    const t = title.toLowerCase();
    for (const brand of knownBrands) {
        if (t.includes(brand.toLowerCase())) return brand;
    }
    return null;
}

export default function DealsGrid({ storeId, storeName, baseUrl = DEFAULT_BASE_URL, cacheKey = '__all__', defaultDealsOnly = true }: { storeId: number | null; storeName: string; baseUrl?: string; cacheKey?: string; defaultDealsOnly?: boolean }) {
    const lastUpdated = useLastUpdated(cacheKey);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [offline, setOffline] = useState(false);
    const [sort, setSort] = useState<'savings' | 'price-asc' | 'price-desc'>('savings');
    const [dealsOnly, setDealsOnly] = useState(defaultDealsOnly);
    const [fetchKey, setFetchKey] = useState(0);
    const retryCountRef = useRef(0);
    const lastStoreKeyRef = useRef('');
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [activeBrands, setActiveBrands] = useState<string[]>([]);
    const [activeLaptopType, setActiveLaptopType] = useState<string | null>(null);
    const [activeDriveType, setActiveDriveType] = useState<string | null>(null);
    const [activeCoolerType, setActiveCoolerType] = useState<string | null>(null);
    const [activeCaseType, setActiveCaseType] = useState<string | null>(null);
    const category = baseUrl.split('/').pop() ?? 'desktops';

    useEffect(() => {
        const storeKey = `${storeId}|${baseUrl}|${dealsOnly}`;
        if (storeKey !== lastStoreKeyRef.current) {
            retryCountRef.current = 0;
            lastStoreKeyRef.current = storeKey;
            setActiveBrands([]);
            setActiveLaptopType(null);
            setActiveDriveType(null);
            setActiveCoolerType(null);
            setActiveCaseType(null);
        }
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

        setIsLoaded(false);
        setProducts([]);
        setOffline(false);

        const category = baseUrl.split('/').pop() ?? 'desktops';
        const url = `/api/deals/stream?category=${category}${storeId ? `&pickup=${storeId}` : ''}${dealsOnly ? '' : '&deals_only=false'}`;
        const controller = new AbortController();

        async function run() {
            try {
                const res = await fetch(url, { signal: controller.signal });
                if (!res.ok || !res.body) {
                    if (retryCountRef.current < 3) {
                        retryCountRef.current++;
                        retryTimerRef.current = setTimeout(() => setFetchKey(k => k + 1), 20000);
                    } else {
                        setOffline(true);
                        setIsLoaded(true);
                    }
                    return;
                }
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() ?? '';
                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            const msg = JSON.parse(line) as { batch?: Product[]; done?: boolean };
                            if (Array.isArray(msg.batch) && msg.batch.length > 0) {
                                setProducts(prev => [...prev, ...msg.batch!]);
                            }
                            if (msg.done) setIsLoaded(true);
                        } catch { /* ignore malformed lines */ }
                    }
                }
            } catch (err) {
                if ((err as Error).name === 'AbortError') return;
                setOffline(true);
            }
            setIsLoaded(true);
        }

        run();

        return () => {
            controller.abort();
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        };
    }, [storeId, baseUrl, fetchKey, dealsOnly]);

    const knownBrands = CATEGORY_BRANDS[category] ?? [];

    const availableBrands = useMemo(() => {
        if (knownBrands.length === 0) return [];
        const found = new Set<string>();
        for (const p of products) {
            const b = detectBrand(p.title, knownBrands);
            if (b) found.add(b);
        }
        // return in the same order as CATEGORY_BRANDS so chips are stable
        return knownBrands.filter(b => found.has(b));
    }, [products, knownBrands]);

    const toggleBrand = (brand: string) =>
        setActiveBrands(prev =>
            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
        );

    const sortedProducts = useMemo(() => {
        const min = minPrice !== '' ? parseFloat(minPrice) : null;
        const max = maxPrice !== '' ? parseFloat(maxPrice) : null;
        const copy = products.filter(p => {
            // When dealsOnly toggle is off at component level but the user flipped it
            // on in the toolbar, filter out non-sale items client-side.
            if (dealsOnly) {
                const s = parseFloat(p.price.replace(/[$,]/g, ''));
                const r = parseFloat(p.regular_price.replace(/[$,]/g, ''));
                if (s >= r) return false;
            }
            if (activeLaptopType && p.laptop_type !== activeLaptopType) return false;
            if (activeDriveType && p.drive_type !== activeDriveType) return false;
            if (activeCoolerType && p.cooler_type !== activeCoolerType) return false;
            if (activeCaseType && p.case_type !== activeCaseType) return false;
            const p$ = price(p);
            if (min !== null && p$ < min) return false;
            if (max !== null && p$ > max) return false;
            if (activeBrands.length > 0) {
                const b = detectBrand(p.title, knownBrands);
                if (!b || !activeBrands.includes(b)) return false;
            }
            return true;
        });
        if (sort === 'price-asc') copy.sort((a, b) => price(a) - price(b));
        else if (sort === 'price-desc') copy.sort((a, b) => price(b) - price(a));
        else copy.sort((a, b) => savingsAmt(b) - savingsAmt(a));
        return copy;
    }, [products, sort, minPrice, maxPrice, activeBrands, knownBrands, dealsOnly, activeLaptopType, activeDriveType, activeCoolerType, activeCaseType]);

    const priceFiltered = minPrice !== '' || maxPrice !== '';
    const brandFiltered = activeBrands.length > 0;
    const filterCount = (priceFiltered ? 1 : 0) + activeBrands.length + (activeLaptopType ? 1 : 0) + (activeDriveType ? 1 : 0) + (activeCoolerType ? 1 : 0) + (activeCaseType ? 1 : 0);
    const clearPriceFilter = () => { setMinPrice(''); setMaxPrice(''); };
    const clearAllFilters = () => { setMinPrice(''); setMaxPrice(''); setActiveBrands([]); setActiveLaptopType(null); setActiveDriveType(null); setActiveCoolerType(null); setActiveCaseType(null); };

    if (offline) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                    <span>⚠ Backend temporarily unavailable. Deals will appear once the service is back.</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden animate-pulse">
                            <div className="bg-slate-50 h-52" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-slate-100 rounded w-5/6" />
                                <div className="h-3 bg-slate-100 rounded w-1/3" />
                                <div className="h-7 bg-slate-100 rounded w-1/2" />
                                <div className="h-6 bg-slate-100 rounded-lg w-2/5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!isLoaded && products.length === 0) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2.5 text-sm text-slate-500">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-100">
                        <svg className="animate-spin h-3 w-3 text-violet-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    </span>
                    <span>{storeId ? <>Fetching live inventory for <span className="font-semibold text-slate-700">{storeName}</span>. First load may take a minute…</> : 'Loading deals…'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden animate-pulse">
                            <div className="bg-slate-50 h-52" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-slate-100 rounded w-5/6" />
                                <div className="h-3 bg-slate-100 rounded w-1/3" />
                                <div className="h-7 bg-slate-100 rounded w-1/2" />
                                <div className="h-6 bg-slate-100 rounded-lg w-2/5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (sortedProducts.length === 0 && products.length === 0) {
        return (
            <div className="text-center py-24">
                <p className="text-3xl mb-3">📭</p>
                <p className="text-slate-700 font-semibold">No products found</p>
                <p className="text-slate-400 text-sm mt-1">Try a different store or check back shortly.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-w-0">

            {/* ── Sticky Filter Bar ──────────────────────────── */}
            <div className="sticky top-17 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] -mx-4 px-4 sm:-mx-6 sm:px-6 py-3 mb-6 overflow-x-hidden">
                <div className="flex flex-col gap-2.5">

                    {/* Row 1: count · toggle · sort */}
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap min-w-0 flex-1">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-extrabold text-slate-900 tabular-nums leading-none">{sortedProducts.length}</span>
                                <span className="text-sm text-slate-500">{dealsOnly ? 'deals' : 'products'}</span>
                                {!isLoaded && (
                                    <span className="flex items-center gap-1 text-[11px] text-violet-500">
                                        <svg className="animate-spin h-2.5 w-2.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        scanning
                                    </span>
                                )}
                            </div>
                            {storeName !== 'All Stores' && (
                                <span className="text-sm text-slate-400 hidden sm:inline">
                                    at <span className="font-semibold text-slate-600">{storeName}</span>
                                </span>
                            )}
                            {filterCount > 0 && (
                                <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-violet-200">
                                    {filterCount} filter{filterCount > 1 ? 's' : ''}
                                </span>
                            )}
                            {lastUpdated && (
                                <span className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400">
                                    <TbRefresh size={10} />{lastUpdated}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            {/* Deals-only toggle */}
                            <button
                                onClick={() => setDealsOnly(v => !v)}
                                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                                    dealsOnly
                                        ? 'bg-linear-to-br from-rose-500 to-rose-600 text-white border-rose-500 shadow-md shadow-rose-500/25'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-rose-300 hover:text-rose-500'
                                }`}
                            >
                                <TbPercentage size={13} />
                                <span className="hidden xs:inline sm:inline">Deals only</span>
                            </button>

                            {/* Sort dropdown */}
                            <div className="relative">
                                <select
                                    value={sort}
                                    onChange={e => setSort(e.target.value as typeof sort)}
                                    className="appearance-none text-[11px] font-semibold pl-3 pr-7 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200/50 transition-all cursor-pointer hover:border-slate-300"
                                >
                                    <option value="savings">Best Savings</option>
                                    <option value="price-asc">Price ↑</option>
                                    <option value="price-desc">Price ↓</option>
                                </select>
                                <TbChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Row 1.5: laptop subcategory tabs (laptops page only) */}
                    {category === 'laptops' && (
                        <div className="flex items-center gap-1.5 flex-wrap border-t border-slate-100 pt-2.5">
                            {(['All', 'Windows', 'Gaming', 'Business', 'Refurbished'] as const).map(type => {
                                const active = type === 'All' ? activeLaptopType === null : activeLaptopType === type;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setActiveLaptopType(type === 'All' ? null : type)}
                                        className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all whitespace-nowrap ${
                                            active
                                                ? 'bg-zinc-950 text-white shadow-sm shadow-zinc-900/20'
                                                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-800'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Row 1.5: drives subcategory tabs (drives page only) */}
                    {category === 'drives' && (
                        <div className="flex items-center gap-1.5 flex-wrap border-t border-slate-100 pt-2.5">
                            {(['All', 'SSD', 'HDD'] as const).map(type => {
                                const active = type === 'All' ? activeDriveType === null : activeDriveType === type;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setActiveDriveType(type === 'All' ? null : type)}
                                        className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all whitespace-nowrap ${
                                            active
                                                ? 'bg-zinc-950 text-white shadow-sm shadow-zinc-900/20'
                                                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-800'
                                        }`}
                                    >
                                        {type === 'All' ? 'All Drives' : type}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Row 1.5: cooler subcategory tabs (coolers page only) */}
                    {category === 'coolers' && (
                        <div className="flex items-center gap-1.5 flex-wrap border-t border-slate-100 pt-2.5">
                            {(['All', 'Air', 'Liquid', 'Case Fan'] as const).map(type => {
                                const active = type === 'All' ? activeCoolerType === null : activeCoolerType === type;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setActiveCoolerType(type === 'All' ? null : type)}
                                        className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all whitespace-nowrap ${
                                            active
                                                ? 'bg-zinc-950 text-white shadow-sm shadow-zinc-900/20'
                                                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-800'
                                        }`}
                                    >
                                        {type === 'All' ? 'All Coolers' : type}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Row 1.5: case subcategory tabs (cases page only) */}
                    {category === 'cases' && (
                        <div className="flex items-center gap-1.5 flex-wrap border-t border-slate-100 pt-2.5">
                            {(['All', 'Mid Tower', 'Full Tower', 'ITX/mATX'] as const).map(type => {
                                const active = type === 'All' ? activeCaseType === null : activeCaseType === type;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setActiveCaseType(type === 'All' ? null : type)}
                                        className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all whitespace-nowrap ${
                                            active
                                                ? 'bg-zinc-950 text-white shadow-sm shadow-zinc-900/20'
                                                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-800'
                                        }`}
                                    >
                                        {type === 'All' ? 'All Cases' : type}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Row 2: price · brands · clear all */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Price range */}
                        <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 tracking-wide select-none">$</span>
                            <input
                                type="number" min="0" placeholder="Min"
                                value={minPrice} onChange={e => setMinPrice(e.target.value)}
                                className="w-14 text-xs font-medium bg-transparent text-slate-700 placeholder-slate-300 focus:outline-none"
                            />
                            <span className="text-slate-300 text-xs select-none">|</span>
                            <input
                                type="number" min="0" placeholder="Max"
                                value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                                className="w-14 text-xs font-medium bg-transparent text-slate-700 placeholder-slate-300 focus:outline-none"
                            />
                            {priceFiltered && (
                                <button onClick={clearPriceFilter} className="text-slate-400 hover:text-red-500 transition-colors ml-0.5">
                                    <TbX size={12} />
                                </button>
                            )}
                        </div>

                        {availableBrands.length >= 2 && (
                            <>
                                <div className="hidden sm:block w-px h-4 bg-slate-200" />
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {activeBrands.length > 0 && (
                                        <button
                                            onClick={() => setActiveBrands([])}
                                            className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-zinc-950 text-white shadow-sm shadow-zinc-900/20"
                                        >
                                            All
                                        </button>
                                    )}
                                    {availableBrands.map(brand => {
                                        const active = activeBrands.includes(brand);
                                        return (
                                            <button
                                                key={brand}
                                                onClick={() => toggleBrand(brand)}
                                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                                                    active
                                                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-500/30'
                                                        : 'bg-white text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                                                }`}
                                            >
                                                {brand}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {filterCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <TbX size={11} />
                                Clear all
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Product Grid ──────────────────────────────── */}
            {sortedProducts.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-2xl mb-2">🔍</p>
                    <p className="text-slate-600 font-semibold text-sm">No products match your filters</p>
                    <button onClick={clearAllFilters} className="mt-3 text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors">
                        Clear all filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {sortedProducts.map((product, i) => {
                        const sale = parseFloat(product.price.replace(/[$,]/g, ''));
                        const reg = parseFloat(product.regular_price.replace(/[$,]/g, ''));
                        const savings = (reg - sale).toFixed(2);
                        const pct = reg > 0 ? Math.round((reg - sale) / reg * 100) : 0;
                        const onlineAvail = isAvailable(product.online_availability);
                        const instoreAvail = isAvailable(product.instore_availability);

                        return (
                            <a
                                key={product.item_code}
                                href={product.link}
                                target="_blank"
                                rel="noreferrer"
                                className="group flex flex-col bg-white rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-xl hover:shadow-zinc-900/5 hover:border-violet-300/60 hover:-translate-y-1 transition-all duration-300 overflow-hidden animate-card-in"
                                style={{ animationDelay: `${Math.min(i * 25, 250)}ms` }}
                            >
                                {/* Image */}
                                <div className="relative bg-linear-to-b from-slate-50 to-white h-52 flex items-center justify-center p-5">
                                    {/* Badges sit above the overflow-clipped image layer */}
                                    {pct > 0 && (
                                        <div className="absolute top-2.5 right-2.5 z-10 inline-flex items-center bg-linear-to-br from-rose-500 to-rose-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow-md shadow-rose-500/30">
                                            −{pct}%
                                        </div>
                                    )}
                                    <div className="absolute top-2.5 left-2.5 z-10">
                                        <FavoriteButton product={product} variant="icon" />
                                    </div>
                                    {/* Image clipping wrapper — keeps scale animation from overflowing */}
                                    <div className="overflow-hidden w-full h-full flex items-center justify-center">
                                        {product.image_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={product.image_url}
                                                alt={product.title}
                                                className="object-contain max-h-40 max-w-full drop-shadow-sm group-hover:scale-110 transition-transform duration-500 ease-out"
                                                referrerPolicy="no-referrer"
                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div className="w-36 h-36 bg-slate-100 rounded-xl" />
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-col flex-1 px-4 pb-4 pt-3 gap-2.5">
                                    <div>
                                        <p className="text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-violet-700 transition-colors">
                                            {product.title}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-wide">{product.item_code}</p>
                                    </div>

                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-extrabold text-slate-900 tracking-tight">{product.price}</span>
                                            {pct > 0 && <span className="text-sm text-slate-400 line-through">{product.regular_price}</span>}
                                        </div>
                                        {pct > 0 && (
                                            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-md px-2 py-0.5 mt-1.5">
                                                <TbTag size={11} />
                                                Save ${savings}
                                            </div>
                                        )}
                                    </div>

                                    {/* Price history sparkline (lazy-loaded when card enters viewport) */}
                                    <PriceHistorySparkline itemCode={product.item_code} currentPrice={sale} />

                                    <div className="flex items-center gap-1.5 mt-auto pt-2.5 border-t border-slate-100">
                                        <span
                                            title={product.online_availability}
                                            className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-md px-1.5 py-0.5 ${
                                                onlineAvail ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'
                                            }`}
                                        >
                                            <TbWorld size={11} />
                                            {onlineAvail ? 'Online' : '—'}
                                        </span>
                                        <span
                                            title={product.instore_availability}
                                            className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-md px-1.5 py-0.5 whitespace-nowrap ${
                                                instoreAvail ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'
                                            }`}
                                        >
                                            <TbBuildingStore size={11} />
                                            {instoreAvail ? 'In-Store' : '—'}
                                        </span>
                                        <span className="ml-auto">
                                            <ShareButton title={product.title} url={product.link} price={product.price} size="sm" />
                                        </span>
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
