'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TbTag, TbWorld, TbBuildingStore, TbChevronLeft, TbChevronRight } from 'react-icons/tb';
import ShareButton from './ShareButton';
import FavoriteButton from './FavoriteButton';

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

const DESKTOP_CARD_WIDTH = 400;
const GAP = 20;

function isAvailable(str: string): boolean {
    if (!str) return false;
    const s = str.toLowerCase();
    return s.includes('available') && !s.includes('not available');
}

export default function Deals({
    storeId = null,
    storeName = 'All Stores',
    baseUrl = '/api/deals/desktops',
}: {
    storeId?: number | null;
    storeName?: string;
    baseUrl?: string;
}) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [offline, setOffline] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [sort, setSort] = useState<'savings' | 'price-asc' | 'price-desc'>('savings');
    const [cardWidth, setCardWidth] = useState(DESKTOP_CARD_WIDTH);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [fetchKey, setFetchKey] = useState(0);
    const retryCountRef = useRef(0);
    const lastStoreKeyRef = useRef('');
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Responsive card width: full-ish on mobile, fixed on desktop
    useEffect(() => {
        const update = () => {
            setCardWidth(window.innerWidth < 640 ? Math.min(window.innerWidth - 48, DESKTOP_CARD_WIDTH) : DESKTOP_CARD_WIDTH);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    useEffect(() => {
        const storeKey = `${storeId}|${baseUrl}`;
        if (storeKey !== lastStoreKeyRef.current) {
            retryCountRef.current = 0;
            lastStoreKeyRef.current = storeKey;
        }
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

        setIsLoaded(false);
        setProducts([]);
        setOffline(false);
        setActiveIndex(0);
        if (scrollRef.current) scrollRef.current.scrollLeft = 0;

        const url = storeId
            ? `${baseUrl}?pickup=${storeId}`
            : baseUrl;

        const controller = new AbortController();

        fetch(url, { signal: controller.signal })
            .then(res => {
                if (!res.ok) {
                    if (retryCountRef.current < 3) {
                        retryCountRef.current++;
                        retryTimerRef.current = setTimeout(() => setFetchKey(k => k + 1), 20000);
                    } else {
                        setOffline(true);
                        setIsLoaded(true);
                    }
                    return null;
                }
                return res.json() as Promise<{ products: Product[] }>;
            })
            .then(data => {
                if (!data) return;
                setProducts(data.products ?? []);
                setIsLoaded(true);
            })
            .catch(err => {
                if ((err as Error).name === 'AbortError') return;
                setOffline(true);
                setIsLoaded(true);
            });

        return () => {
            controller.abort();
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        };
    }, [storeId, baseUrl, fetchKey]);

    // Reset carousel position when sort changes
    useEffect(() => {
        setActiveIndex(0);
        if (scrollRef.current) scrollRef.current.scrollLeft = 0;
    }, [sort]);

    const price = (p: Product) => parseFloat(p.price.replace(/[$,]/g, ''));
    const savings = (p: Product) => {
        const reg = parseFloat(p.regular_price.replace(/[$,]/g, ''));
        return reg - price(p);
    };

    const sortedProducts = useMemo(() => {
        const copy = [...products];
        if (sort === 'price-asc') copy.sort((a, b) => price(a) - price(b));
        else if (sort === 'price-desc') copy.sort((a, b) => price(b) - price(a));
        else copy.sort((a, b) => savings(b) - savings(a));
        return copy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products, sort]);

    const isPausedRef = useRef(false);
    const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const idx = Math.round(scrollRef.current.scrollLeft / (cardWidth + GAP));
        setActiveIndex(Math.max(0, Math.min(idx, products.length - 1)));
    }, [products.length, cardWidth]);

    const scrollToIndex = (index: number) => {
        scrollRef.current?.scrollTo({ left: index * (cardWidth + GAP), behavior: 'smooth' });
    };

    const prev = () => {
        isPausedRef.current = true;
        scrollToIndex(Math.max(0, activeIndex - 1));
        setTimeout(() => { isPausedRef.current = false; }, 6000);
    };
    const next = () => {
        isPausedRef.current = true;
        scrollToIndex(Math.min(products.length - 1, activeIndex + 1));
        setTimeout(() => { isPausedRef.current = false; }, 6000);
    };

    // Auto-scroll: advance one card every 3s, loop back to start
    useEffect(() => {
        if (sortedProducts.length === 0) return;
        autoScrollRef.current = setInterval(() => {
            if (isPausedRef.current || !scrollRef.current) return;
            const el = scrollRef.current;
            const maxScroll = el.scrollWidth - el.clientWidth;
            if (el.scrollLeft >= maxScroll - 4) {
                el.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                el.scrollBy({ left: cardWidth + GAP, behavior: 'smooth' });
            }
        }, 3000);
        return () => { if (autoScrollRef.current) clearInterval(autoScrollRef.current); };
    }, [sortedProducts.length, cardWidth]);

    if (offline) {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <span>⚠ Backend temporarily unavailable — deals will appear once the service is back.</span>
                </div>
                <div className="flex gap-5 overflow-hidden">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex-none bg-white rounded-3xl shadow-sm border border-slate-100 p-6 animate-pulse" style={{ width: cardWidth }}>
                            <div className="bg-slate-100 rounded-2xl h-56 mb-6" />
                            <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
                            <div className="h-4 bg-slate-100 rounded w-1/2 mb-6" />
                            <div className="h-12 bg-slate-100 rounded-2xl w-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <svg className="animate-spin h-4 w-4 text-violet-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {storeId
                        ? `Fetching live inventory for ${storeName} — first load may take a minute…`
                        : 'Loading deals…'}
                </div>
                <div className="flex gap-5 overflow-hidden">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex-none bg-white rounded-3xl shadow-sm border border-slate-100 p-6 animate-pulse" style={{ width: cardWidth }}>
                            <div className="bg-slate-100 rounded-2xl h-56 mb-6" />
                            <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
                            <div className="h-4 bg-slate-100 rounded w-1/2 mb-6" />
                            <div className="h-12 bg-slate-100 rounded-2xl w-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return <p className="text-slate-500 p-4">Deals are being fetched in the background. Refresh in a moment.</p>;
    }

    const SORT_OPTIONS: { key: typeof sort; label: string }[] = [
        { key: 'savings',    label: 'Best Savings' },
        { key: 'price-asc',  label: 'Price: Low → High' },
        { key: 'price-desc', label: 'Price: High → Low' },
    ];

    return (
        <div className="flex flex-col gap-4">
            {/* Sort controls */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-slate-400 mr-1">Sort by</span>
                {SORT_OPTIONS.map(opt => (
                    <button
                        key={opt.key}
                        onClick={() => setSort(opt.key)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                            sort === opt.key
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Carousel + arrows */}
            <div className="relative">
                {/* Left arrow — hidden on mobile (swipe instead) */}
                <button
                    onClick={prev}
                    disabled={activeIndex === 0}
                    className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white border border-slate-200 shadow-md rounded-full p-2 text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Previous"
                >
                    <TbChevronLeft size={20} />
                </button>

                {/* Scroll container */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    onMouseEnter={() => { isPausedRef.current = true; }}
                    onMouseLeave={() => { isPausedRef.current = false; }}
                    className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
                    style={{ gap: GAP, scrollbarWidth: 'none', paddingBottom: 4 }}
                >
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
                                className="snap-start flex-none bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all duration-300 flex flex-col overflow-hidden group"
                                style={{ width: cardWidth }}
                            >
                                {/* Image */}
                                <div className="relative bg-slate-50 flex items-center justify-center h-60 p-6">
                                    <div className="absolute top-3 left-3">
                                        <FavoriteButton product={product} variant="icon" />
                                    </div>
                                    {product.image_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={product.image_url}
                                            alt={product.title}
                                            className="object-contain max-h-48 max-w-full"
                                            referrerPolicy="no-referrer"
                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-48 h-48 bg-slate-200 rounded-2xl" />
                                    )}
                                </div>

                                {/* Body */}
                                <div className="flex flex-col flex-1 p-6 gap-4">
                                    {/* Title */}
                                    <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-violet-700 transition-colors min-h-11">
                                        {product.title}
                                    </p>

                                    {/* Divider */}
                                    <div className="border-t border-slate-100" />

                                    {/* Pricing */}
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-xs text-slate-400 mb-0.5">Sale price</p>
                                            <p className="text-3xl font-extrabold text-slate-900 leading-none">{product.price}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 mb-0.5">Was</p>
                                            <p className="text-base text-slate-400 line-through leading-none">{product.regular_price}</p>
                                        </div>
                                    </div>

                                    {/* Savings row */}
                                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
                                        <TbTag size={15} className="text-emerald-600 shrink-0" />
                                        <span className="text-base font-extrabold text-emerald-700">You save ${savings}</span>
                                        <span className="ml-auto text-xs font-semibold text-emerald-500">{pct}% off</span>
                                    </div>

                                    {/* Item code */}
                                    <p className="text-xs text-slate-400 font-mono tracking-wide">{product.item_code}</p>

                                    {/* Availability */}
                                    <div className="flex gap-2 flex-wrap mt-auto">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${onlineAvail ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                            <TbWorld size={13} />
                                            {onlineAvail ? 'Available Online' : 'Not Online'}
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${instoreAvail ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                            <TbBuildingStore size={13} />
                                            {instoreAvail ? 'In-Store' : 'Not In-Store'}
                                        </span>
                                        <ShareButton title={product.title} url={product.link} price={product.price} />
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>

                {/* Right arrow — hidden on mobile (swipe instead) */}
                <button
                    onClick={next}
                    disabled={activeIndex === products.length - 1}
                    className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white border border-slate-200 shadow-md rounded-full p-2 text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Next"
                >
                    <TbChevronRight size={20} />
                </button>
            </div>

            {/* Dots */}
            <div className="flex justify-center items-center gap-1.5 pt-2">
                {sortedProducts.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => scrollToIndex(i)}
                        aria-label={`Go to product ${i + 1}`}
                        className={`rounded-full transition-all duration-300 ${
                            i === activeIndex
                                ? 'bg-slate-800 w-6 h-2'
                                : 'bg-slate-300 hover:bg-slate-400 w-2 h-2'
                        }`}
                    />
                ))}
            </div>

            <p className="text-center text-xs text-slate-400">
                {activeIndex + 1} / {sortedProducts.length}
            </p>
        </div>
    );
}