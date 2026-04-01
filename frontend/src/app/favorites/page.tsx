'use client';

import { TbHeart, TbArrowLeft, TbTrash, TbTag, TbWorld, TbBuildingStore } from 'react-icons/tb';
import { useFavorites } from '../contexts/FavoritesContext';
import FavoriteButton from '../components/FavoriteButton';
import ShareButton from '../components/ShareButton';

function isAvailable(str: string): boolean {
    if (!str) return false;
    const s = str.toLowerCase();
    return s.includes('available') && !s.includes('not available');
}

function savings(price: string, regular: string): { amt: string; pct: number } {
    const p = parseFloat(price.replace(/[$,]/g, ''));
    const r = parseFloat(regular.replace(/[$,]/g, ''));
    const amt = (r - p).toFixed(2);
    const pct = r > 0 ? Math.round(((r - p) / r) * 100) : 0;
    return { amt, pct };
}

export default function FavoritesPage() {
    const { favorites, clearAll } = useFavorites();

    return (
        <>
            {/* Hero header */}
            <div className="border-b border-slate-200/60 bg-linear-to-b from-rose-50/50 to-white">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                    <a
                        href="/"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 mb-4 transition-colors"
                    >
                        <TbArrowLeft size={12} />
                        Back to highlights
                    </a>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                                <TbHeart size={20} className="text-rose-500" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                                    Your Favourites
                                </h1>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {favorites.length === 0
                                        ? 'No saved items yet. Heart a deal to save it here.'
                                        : `${favorites.length} saved deal${favorites.length === 1 ? '' : 's'}`}
                                </p>
                            </div>
                        </div>
                        {favorites.length > 0 && (
                            <button
                                onClick={clearAll}
                                className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-rose-500 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all"
                            >
                                <TbTrash size={13} />
                                Clear all
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
                {/* Empty state */}
                {favorites.length === 0 && (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <TbHeart size={32} className="text-slate-300" strokeWidth={1.5} />
                        </div>
                        <p className="text-slate-400 text-sm text-center">Browse deals and tap the heart icon to save them here.</p>
                        <a
                            href="/"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                        >
                            Browse deals
                            <TbArrowLeft size={12} className="rotate-180" />
                        </a>
                    </div>
                )}

                {/* Grid — matches DealsGrid card design */}
                {favorites.length > 0 && (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {favorites.map(product => {
                            const onlineAvail = isAvailable(product.online_availability);
                            const instoreAvail = isAvailable(product.instore_availability);
                            const { amt, pct } = savings(product.price, product.regular_price);

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
                                            <span className="text-xs font-bold text-emerald-700">Save ${amt}</span>
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

                {/* Mobile clear all */}
                {favorites.length > 0 && (
                    <div className="mt-8 flex justify-center sm:hidden">
                        <button
                            onClick={clearAll}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-500 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 px-4 py-2 rounded-lg transition-all"
                        >
                            <TbTrash size={14} />
                            Clear all favourites
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
