'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { TbTag, TbWorld, TbBuildingStore, TbX, TbRefresh } from 'react-icons/tb';
import ShareButton from './ShareButton';
import FavoriteButton from './FavoriteButton';
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
    desktops: ['ASUS', 'MSI', 'Lenovo', 'HP', 'Dell', 'Acer', 'CyberpowerPC', 'Skytech', 'iBUYPOWER', 'CLX'],
    memory:   ['Kingston', 'Corsair', 'G.Skill', 'Crucial', 'TeamGroup', 'Patriot', 'Samsung', 'A-Data', 'PNY', 'Mushkin'],
    cpu:      ['Intel', 'AMD'],
    gpu:      ['ASUS', 'MSI', 'Gigabyte', 'Zotac', 'Sapphire', 'PowerColor', 'XFX', 'ASRock', 'PNY', 'EVGA'],
    laptops:  ['ASUS', 'MSI', 'Lenovo', 'HP', 'Dell', 'Acer', 'Samsung', 'LG', 'Razer', 'Microsoft'],
};

function detectBrand(title: string, knownBrands: string[]): string | null {
    const t = title.toLowerCase();
    for (const brand of knownBrands) {
        if (t.includes(brand.toLowerCase())) return brand;
    }
    return null;
}

export default function DealsGrid({ storeId, storeName, baseUrl = DEFAULT_BASE_URL, cacheKey = '__all__' }: { storeId: number | null; storeName: string; baseUrl?: string; cacheKey?: string }) {
    const lastUpdated = useLastUpdated(cacheKey);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [offline, setOffline] = useState(false);
    const [sort, setSort] = useState<'savings' | 'price-asc' | 'price-desc'>('savings');
    const [fetchKey, setFetchKey] = useState(0);
    const retryCountRef = useRef(0);
    const lastStoreKeyRef = useRef('');
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [activeBrands, setActiveBrands] = useState<string[]>([]);
    const category = baseUrl.split('/').pop() ?? 'desktops';

    useEffect(() => {
        const storeKey = `${storeId}|${baseUrl}`;
        if (storeKey !== lastStoreKeyRef.current) {
            retryCountRef.current = 0;
            lastStoreKeyRef.current = storeKey;
            setActiveBrands([]);
        }
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

        setIsLoaded(false);
        setProducts([]);
        setOffline(false);

        const category = baseUrl.split('/').pop() ?? 'desktops';
        const url = `/api/deals/stream?category=${category}${storeId ? `&pickup=${storeId}` : ''}`;
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
    }, [storeId, baseUrl, fetchKey]);

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
    }, [products, sort, minPrice, maxPrice, activeBrands, knownBrands]);

    const priceFiltered = minPrice !== '' || maxPrice !== '';
    const brandFiltered = activeBrands.length > 0;
    const clearPriceFilter = () => { setMinPrice(''); setMaxPrice(''); };

    const SORT_OPTIONS: { key: typeof sort; label: string }[] = [
        { key: 'savings', label: 'Best Savings' },
        { key: 'price-asc', label: 'Price: Low → High' },
        { key: 'price-desc', label: 'Price: High → Low' },
    ];

    if (offline) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <span>⚠ Backend temporarily unavailable — deals will appear once the service is back.</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden animate-pulse">
                            <div className="bg-slate-50 h-48" />
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
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <svg className="animate-spin h-4 w-4 text-violet-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {storeId ? `Fetching live inventory for ${storeName}. First load may take a minute…` : 'Loading deals…'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden animate-pulse">
                            <div className="bg-slate-50 h-48" />
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
        return <p className="text-slate-500 p-4">No deals found. Try a different store or check back shortly.</p>;
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 bg-white border border-slate-200/80 rounded-2xl p-4">
                {/* Row 1: count + sort */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-sm text-slate-500">
                            <span className="font-bold text-slate-900 tabular-nums">{sortedProducts.length}</span>
                            {(priceFiltered || brandFiltered) && <span className="text-slate-400"> of {products.length}</span>}
                            {' '}deals
                            {storeName !== 'All Stores' && (
                                <> at <span className="font-semibold text-slate-800">{storeName}</span></>
                            )}
                        </p>
                        <div className="flex items-center gap-3">
                            {lastUpdated && (
                                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                    <TbRefresh size={10} />{lastUpdated}
                                </p>
                            )}
                            {!isLoaded && (
                                <p className="text-[11px] text-violet-500 flex items-center gap-1">
                                    <svg className="animate-spin h-2.5 w-2.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Scanning…
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-slate-400">Sort</span>
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => setSort(opt.key)}
                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-all ${
                                    sort === opt.key
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Row 2: price range */}
                <div className="flex items-center gap-2 flex-wrap border-t border-slate-100 pt-3">
                    <span className="text-xs font-medium text-slate-400">Price</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">$</span>
                        <input
                            type="number"
                            min="0"
                            placeholder="Min"
                            value={minPrice}
                            onChange={e => setMinPrice(e.target.value)}
                            className="w-22 text-xs font-medium px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 placeholder-slate-300 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200 transition-all"
                        />
                    </div>
                    <span className="text-[11px] text-slate-300">—</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">$</span>
                        <input
                            type="number"
                            min="0"
                            placeholder="Max"
                            value={maxPrice}
                            onChange={e => setMaxPrice(e.target.value)}
                            className="w-22 text-xs font-medium px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 placeholder-slate-300 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200 transition-all"
                        />
                    </div>
                    {priceFiltered && (
                        <button
                            onClick={clearPriceFilter}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors"
                        >
                            <TbX size={11} />
                            Clear
                        </button>
                    )}
                </div>

                {/* Row 3: brand filters */}
                {availableBrands.length >= 2 && (
                    <div className="flex items-center gap-1.5 flex-wrap border-t border-slate-100 pt-3">
                        <span className="text-xs font-medium text-slate-400 mr-0.5">Brand</span>
                        {activeBrands.length > 0 && (
                            <button
                                onClick={() => setActiveBrands([])}
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-md border bg-slate-900 text-white border-slate-900"
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
                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-all ${
                                        active
                                            ? 'bg-violet-600 text-white border-violet-600'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                                    }`}
                                >
                                    {brand}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Grid */}
            {sortedProducts.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-slate-500 text-sm">No deals match your filters.</p>
                    <button onClick={clearPriceFilter} className="mt-3 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">
                        Clear filters
                    </button>
                </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedProducts.map(product => {
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
                            className="rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-xl hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300 flex flex-col overflow-hidden group"
                        >
                            {/* Image area */}
                            <div className="relative bg-linear-to-b from-slate-50 to-white flex items-center justify-center h-52 p-5">
                                {pct > 0 && (
                                    <div className="absolute top-3 right-3 bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                                        -{pct}%
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                                    <FavoriteButton product={product} variant="icon" />
                                </div>
                                {product.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={product.image_url}
                                        alt={product.title}
                                        className="object-contain max-h-40 max-w-full drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                                        referrerPolicy="no-referrer"
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-36 h-36 bg-slate-100 rounded-xl" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex flex-col flex-1 px-5 pb-5 pt-4 gap-3">
                                <div>
                                    <p className="text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-violet-700 transition-colors">
                                        {product.title}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-mono mt-1 tracking-wide">{product.item_code}</p>
                                </div>

                                <div className="flex items-baseline gap-3">
                                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{product.price}</span>
                                    <span className="text-sm text-slate-400 line-through">{product.regular_price}</span>
                                </div>

                                <div className="flex items-center gap-1.5 bg-emerald-50 rounded-lg px-3 py-1.5 w-fit">
                                    <TbTag size={13} className="text-emerald-600" />
                                    <span className="text-xs font-bold text-emerald-700">Save ${savings}</span>
                                </div>

                                <div className="flex items-center gap-3 mt-auto pt-2 border-t border-slate-100">
                                    <span className="flex items-center gap-1 text-[11px] font-medium">
                                        <span className={`w-1.5 h-1.5 rounded-full ${onlineAvail ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                        <TbWorld size={12} className={onlineAvail ? 'text-emerald-600' : 'text-slate-400'} />
                                        <span className={onlineAvail ? 'text-emerald-700' : 'text-slate-400'}>
                                            {onlineAvail ? 'Online' : 'Not Online'}
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-1 text-[11px] font-medium">
                                        <span className={`w-1.5 h-1.5 rounded-full ${instoreAvail ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                        <TbBuildingStore size={12} className={instoreAvail ? 'text-emerald-600' : 'text-slate-400'} />
                                        <span className={instoreAvail ? 'text-emerald-700' : 'text-slate-400'}>
                                            {instoreAvail ? 'In-Store' : 'Not In-Store'}
                                        </span>
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
