'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TbTag, TbWorld, TbBuildingStore, TbChevronLeft, TbChevronRight } from 'react-icons/tb';

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

const CACHE_KEY = 'desktop_deals_cache';
const CACHE_TTL_MS = 30 * 60 * 1000;
const CARD_WIDTH = 400;
const GAP = 20;

function isAvailable(str: string): boolean {
    if (!str) return false;
    const s = str.toLowerCase();
    return s.includes('available') && !s.includes('not available');
}

export default function Deals() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
            if (cached && cached.products.length > 0 && Date.now() - cached.timestamp < CACHE_TTL_MS) {
                setProducts(cached.products);
                setIsLoaded(true);
                return;
            }
        } catch {
            localStorage.removeItem(CACHE_KEY);
        }

        fetch('http://127.0.0.1:5000/deals/desktops')
            .then(res => res.json())
            .then((data: { products: Product[] }) => {
                if (data.products.length > 0) {
                    try {
                        localStorage.setItem(CACHE_KEY, JSON.stringify({
                            timestamp: Date.now(),
                            products: data.products,
                        }));
                    } catch {}
                }
                setProducts(data.products);
                setIsLoaded(true);
            })
            .catch(err => {
                setError(err);
                setIsLoaded(true);
            });
    }, []);

    const isPausedRef = useRef(false);
    const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const idx = Math.round(scrollRef.current.scrollLeft / (CARD_WIDTH + GAP));
        setActiveIndex(Math.max(0, Math.min(idx, products.length - 1)));
    }, [products.length]);

    const scrollToIndex = (index: number) => {
        scrollRef.current?.scrollTo({ left: index * (CARD_WIDTH + GAP), behavior: 'smooth' });
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
        if (products.length === 0) return;
        autoScrollRef.current = setInterval(() => {
            if (isPausedRef.current || !scrollRef.current) return;
            const el = scrollRef.current;
            const maxScroll = el.scrollWidth - el.clientWidth;
            if (el.scrollLeft >= maxScroll - 4) {
                el.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                el.scrollBy({ left: CARD_WIDTH + GAP, behavior: 'smooth' });
            }
        }, 3000);
        return () => { if (autoScrollRef.current) clearInterval(autoScrollRef.current); };
    }, [products.length]);

    if (error) return <p className="text-red-500 p-4">Error loading deals: {error.message}</p>;

    if (!isLoaded) {
        return (
            <div className="flex gap-5 overflow-hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-none bg-white rounded-3xl shadow-sm border border-slate-100 p-6 animate-pulse" style={{ width: CARD_WIDTH }}>
                        <div className="bg-slate-100 rounded-2xl h-56 mb-6" />
                        <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
                        <div className="h-4 bg-slate-100 rounded w-1/2 mb-6" />
                        <div className="h-12 bg-slate-100 rounded-2xl w-full" />
                    </div>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return <p className="text-slate-500 p-4">Deals are being fetched in the background — refresh in a moment.</p>;
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Carousel + arrows */}
            <div className="relative">
                {/* Left arrow */}
                <button
                    onClick={prev}
                    disabled={activeIndex === 0}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white border border-slate-200 shadow-md rounded-full p-2 text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Previous"
                >
                    <TbChevronLeft size={20} />
                </button>

                {/* Scroll container */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
                    style={{ gap: GAP, scrollbarWidth: 'none', paddingBottom: 4 }}
                >
                    {products.map(product => {
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
                                style={{ width: CARD_WIDTH }}
                            >
                                {/* Image */}
                                <div className="relative bg-slate-50 flex items-center justify-center h-60 p-6">
                                    <span className="absolute top-4 left-4 bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                                        -{pct}% off
                                    </span>
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

                                    {/* Savings pill */}
                                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
                                        <TbTag size={15} className="text-emerald-600 shrink-0" />
                                        <span className="text-sm font-bold text-emerald-700">You save ${savings}</span>
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
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>

                {/* Right arrow */}
                <button
                    onClick={next}
                    disabled={activeIndex === products.length - 1}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white border border-slate-200 shadow-md rounded-full p-2 text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Next"
                >
                    <TbChevronRight size={20} />
                </button>
            </div>

            {/* Dots */}
            <div className="flex justify-center items-center gap-1.5 pt-2">
                {products.map((_, i) => (
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
                {activeIndex + 1} / {products.length}
            </p>
        </div>
    );
}