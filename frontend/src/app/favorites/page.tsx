'use client';

import { TbHeart, TbArrowLeft, TbTrash, TbExternalLink, TbTag, TbWorld, TbBuildingStore } from 'react-icons/tb';
import { useFavorites } from '../contexts/FavoritesContext';
import FavoriteButton from '../components/FavoriteButton';
import ShareButton from '../components/ShareButton';

function isAvailable(str: string): boolean {
    if (!str) return false;
    const s = str.toLowerCase();
    return s.includes('available') && !s.includes('not available');
}

function savings(price: string, regular: string): { amt: string; pct: string } {
    const p = parseFloat(price.replace(/[$,]/g, ''));
    const r = parseFloat(regular.replace(/[$,]/g, ''));
    const amt = (r - p).toFixed(2);
    const pct = Math.round(((r - p) / r) * 100).toString();
    return { amt, pct };
}

export default function FavoritesPage() {
    const { favorites, toggle, clearAll } = useFavorites();

    return (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-8 sm:pt-12 pb-16 flex-1">
            {/* Header */}
            <a
                href="/"
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-700 mb-3 transition-colors"
            >
                <TbArrowLeft size={13} />
                Back to highlights
            </a>

            <p className="text-sm font-semibold text-rose-500 mb-1 flex items-center gap-1.5">
                <TbHeart size={14} />
                Saved items
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Your favourites
            </h2>
            <p className="mt-2 text-slate-500 text-sm max-w-md">
                {favorites.length === 0
                    ? 'No saved items yet — heart a deal to save it here.'
                    : `${favorites.length} saved deal${favorites.length === 1 ? '' : 's'}. Prices shown are from when you saved them.`}
            </p>

            {/* Empty state */}
            {favorites.length === 0 && (
                <div className="mt-16 flex flex-col items-center gap-4 text-slate-300">
                    <TbHeart size={64} strokeWidth={1} />
                    <p className="text-slate-400 text-sm">Browse deals and tap the heart icon to save them here.</p>
                    <a
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                    >
                        Browse deals
                        <TbArrowLeft size={12} className="rotate-180" />
                    </a>
                </div>
            )}

            {/* Grid */}
            {favorites.length > 0 && (
                <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                                className="group bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col overflow-hidden"
                            >
                                {/* Image */}
                                <div className="relative bg-slate-50 flex items-center justify-center h-44 overflow-hidden">
                                    <div className="absolute top-3 left-3">
                                        <FavoriteButton product={product} variant="icon" />
                                    </div>
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.title}
                                            className="max-h-36 max-w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-xl bg-slate-200" />
                                    )}
                                </div>

                                {/* Body */}
                                <div className="p-4 flex flex-col gap-3 flex-1">
                                    <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-3">
                                        {product.title}
                                    </p>

                                    {/* Price */}
                                    <div className="flex items-end gap-3">
                                        <div>
                                            <p className="text-xs text-slate-400 mb-0.5">Sale</p>
                                            <p className="text-2xl font-black text-slate-900 leading-none">{product.price}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 mb-0.5">Was</p>
                                            <p className="text-base text-slate-400 line-through leading-none">{product.regular_price}</p>
                                        </div>
                                    </div>

                                    {/* Savings */}
                                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                                        <TbTag size={13} className="text-emerald-600 shrink-0" />
                                        <span className="text-sm font-extrabold text-emerald-700">You save ${amt}</span>
                                        <span className="ml-auto text-xs font-semibold text-emerald-500">{pct}% off</span>
                                    </div>

                                    <p className="text-xs text-slate-400 font-mono tracking-wide">{product.item_code}</p>

                                    {/* Availability + actions */}
                                    <div className="flex gap-2 flex-wrap mt-auto">
                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${onlineAvail ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                            <TbWorld size={12} />
                                            {onlineAvail ? 'Online' : 'Not Online'}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${instoreAvail ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                            <TbBuildingStore size={12} />
                                            {instoreAvail ? 'In-Store' : 'Not In-Store'}
                                        </span>
                                        <ShareButton title={product.title} url={product.link} price={product.price} size="sm" />
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}

            {/* Clear all */}
            {favorites.length > 0 && (
                <div className="mt-10 flex justify-center">
                    <button
                        onClick={clearAll}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-500 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 px-5 py-2.5 rounded-xl transition-all"
                    >
                        <TbTrash size={16} />
                        Clear all favourites
                    </button>
                </div>
            )}
        </div>
    );
}
