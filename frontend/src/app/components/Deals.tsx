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

const DESKTOP_CARD_WIDTH = 340;
const GAP = 16;

function isAvailable(str: string): boolean {
    if (!str) return false;
    const s = str.toLowerCase();
    return s.includes('available') && !s.includes('not available');
}

export default function Deals({
    storeId = null,
    storeName = 'All Stores',
    baseUrl = '/api/deals/desktops',
    enabled = true,
    onCount,
}: {
    storeId?: number | null;
    storeName?: string;
    baseUrl?: string;
    enabled?: boolean;
    onCount?: (count: number) => void;
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
    const onCountRef = useRef(onCount);
    onCountRef.current = onCount;

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
        if (!enabled) return;   // wait until section is near the viewport

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
    }, [storeId, baseUrl, fetchKey, enabled]);

    // Notify parent of deal count whenever products change
    useEffect(() => { onCountRef.current?.(products.length); }, [products.length]);

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
                <div className="flex gap-4 overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex-none bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-pulse" style={{ width: cardWidth }}>
                            <div className="bg-slate-100 h-48" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-slate-100 rounded w-5/6" />
                                <div className="h-4 bg-slate-100 rounded w-2/3" />
                                <div className="h-8 bg-slate-100 rounded-lg w-1/2 mt-2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!isLoaded && products.length === 0) {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <svg className="animate-spin h-4 w-4 text-violet-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {storeId
                        ? `Fetching live inventory for ${storeName}. First load may take a minute…`
                        : 'Loading deals…'}
                </div>
                <div className="flex gap-4 overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex-none bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-pulse" style={{ width: cardWidth }}>
                            <div className="bg-slate-100 h-48" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-slate-100 rounded w-5/6" />
                                <div className="h-4 bg-slate-100 rounded w-2/3" />
                                <div className="h-8 bg-slate-100 rounded-lg w-1/2 mt-2" />
                            </div>
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
        <div className="flex flex-col gap-3">
            {/* Sort + count bar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
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
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    {!isLoaded && (
                        <span className="inline-flex items-center gap-1">
                            <svg className="animate-spin h-3 w-3 text-violet-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Scanning…
                        </span>
                    )}
                    <span className="tabular-nums font-medium">{activeIndex + 1} / {sortedProducts.length}</span>
                </div>
            </div>

            {/* Carousel */}
            <div className="relative group/carousel">
                {/* Nav arrows */}
                <button
                    onClick={prev}
                    disabled={activeIndex === 0}
                    className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center bg-white/95 backdrop-blur border border-slate-200 shadow-lg rounded-xl text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all disabled:opacity-0 disabled:pointer-events-none opacity-0 group-hover/carousel:opacity-100"
                    aria-label="Previous"
                >
                    <TbChevronLeft size={18} />
                </button>

                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    onMouseEnter={() => { isPausedRef.current = true; }}
                    onMouseLeave={() => { isPausedRef.current = false; }}
                    className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
                    style={{ gap: GAP, scrollbarWidth: 'none', paddingBottom: 4 }}
                >
                    {sortedProducts.map((product, i) => {
                        const sale = parseFloat(product.price.replace(/[$,]/g, ''));
                        const reg = parseFloat(product.regular_price.replace(/[$,]/g, ''));
                        const savingsAmt = (reg - sale).toFixed(2);
                        const pct = reg > 0 ? Math.round((reg - sale) / reg * 100) : 0;
                        const onlineAvail = isAvailable(product.online_availability);
                        const instoreAvail = isAvailable(product.instore_availability);

                        return (
                            <a
                                key={product.item_code}
                                href={product.link}
                                target="_blank"
                                rel="noreferrer"
                                className="animate-card-in snap-start flex-none rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-xl hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300 flex flex-col overflow-hidden group"
                                style={{ width: cardWidth, animationDelay: `${Math.min(i * 40, 300)}ms` }}
                            >
                                {/* ── Image area ─────────────────────────── */}
                                <div className="relative bg-linear-to-b from-slate-50 to-white flex items-center justify-center h-52 p-5">
                                    {/* Percent-off badge */}
                                    {pct > 0 && (
                                        <div className="absolute top-3 right-3 bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                                            -{pct}%
                                        </div>
                                    )}
                                    {/* Actions */}
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

                                {/* ── Content ────────────────────────────── */}
                                <div className="flex flex-col flex-1 px-5 pb-5 pt-4 gap-3">
                                    {/* Title + item code */}
                                    <div>
                                        <p className="text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-violet-700 transition-colors">
                                            {product.title}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-mono mt-1 tracking-wide">{product.item_code}</p>
                                    </div>

                                    {/* Price block */}
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{product.price}</span>
                                        <span className="text-sm text-slate-400 line-through">{product.regular_price}</span>
                                    </div>

                                    {/* Savings chip */}
                                    <div className="flex items-center gap-1.5 bg-emerald-50 rounded-lg px-3 py-1.5 w-fit">
                                        <TbTag size={13} className="text-emerald-600" />
                                        <span className="text-xs font-bold text-emerald-700">Save ${savingsAmt}</span>
                                    </div>

                                    {/* Availability row */}
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

                <button
                    onClick={next}
                    disabled={activeIndex === products.length - 1}
                    className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center bg-white/95 backdrop-blur border border-slate-200 shadow-lg rounded-xl text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all disabled:opacity-0 disabled:pointer-events-none opacity-0 group-hover/carousel:opacity-100"
                    aria-label="Next"
                >
                    <TbChevronRight size={18} />
                </button>
            </div>

            {/* Progress track */}
            <div className="flex justify-center pt-1">
                <div className="flex items-center gap-1">
                    {sortedProducts.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => scrollToIndex(i)}
                            aria-label={`Go to product ${i + 1}`}
                            className={`rounded-full transition-all duration-300 ${
                                i === activeIndex
                                    ? 'bg-violet-600 w-5 h-1.5'
                                    : 'bg-slate-200 hover:bg-slate-300 w-1.5 h-1.5'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}