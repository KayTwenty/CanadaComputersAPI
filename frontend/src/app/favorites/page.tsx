'use client';

import { TbHeart, TbArrowLeft, TbTrash, TbTag, TbWorld, TbBuildingStore, TbSparkles } from 'react-icons/tb';
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

    // Aggregate stats
    const totalSavings = favorites.reduce((sum, p) => {
        const sale = parseFloat(p.price.replace(/[$,]/g, ''));
        const reg = parseFloat(p.regular_price.replace(/[$,]/g, ''));
        return sum + Math.max(0, reg - sale);
    }, 0);
    const onlineCount = favorites.filter(p => isAvailable(p.online_availability)).length;

    return (
        <>
            {/* Dark hero — mirrors CategoryHero shape */}
            <section className="relative overflow-hidden bg-zinc-950 text-white">
                <div className="absolute inset-0 bg-grid pointer-events-none" />
                <div className="absolute inset-0 bg-spotlight pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-10 sm:pt-10 sm:pb-12">
                    <a
                        href="/"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 hover:text-white mb-6 transition-colors group"
                    >
                        <TbArrowLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
                        Back to all deals
                    </a>

                    <div className="flex items-start gap-4">
                        <span className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-rose-500/20 to-fuchsia-500/10 ring-1 ring-rose-500/30 flex items-center justify-center text-rose-300 shadow-lg shadow-rose-500/10">
                            <TbHeart size={26} style={{ fill: 'currentColor' }} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight animate-fade-up">
                                Your Favourites
                            </h1>
                            <p className="mt-2 text-zinc-400 text-sm sm:text-base max-w-2xl animate-fade-up" style={{ animationDelay: '40ms' }}>
                                {favorites.length === 0
                                    ? 'No saved items yet — tap the heart on any deal to save it here.'
                                    : 'Your personal watchlist — saved deals, savings tally and live availability.'}
                            </p>

                            {/* Meta strip */}
                            <div className="mt-4 flex items-center gap-2 flex-wrap text-[11px] animate-fade-up" style={{ animationDelay: '80ms' }}>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-200">
                                    <TbHeart size={12} className="text-rose-400" style={{ fill: 'currentColor' }} />
                                    <span className="font-bold">{favorites.length} saved</span>
                                </span>
                                {favorites.length > 0 && (
                                    <>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                                            <TbSparkles size={12} />
                                            <span className="font-bold">${totalSavings.toFixed(2)} total savings</span>
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/60 border border-zinc-700/50 text-zinc-400">
                                            <TbWorld size={12} />
                                            <span>{onlineCount} online</span>
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {favorites.length > 0 && (
                            <button
                                onClick={clearAll}
                                className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-white border border-zinc-800 hover:border-rose-500/40 hover:bg-rose-500/10 px-3 py-1.5 rounded-full transition-all whitespace-nowrap"
                            >
                                <TbTrash size={13} />
                                Clear all
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <div className="bg-slate-50 flex-1">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
                    {/* Empty state */}
                    {favorites.length === 0 && (
                        <div className="py-20 flex flex-col items-center gap-5 bg-white border border-slate-200/70 rounded-2xl shadow-sm">
                            <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-rose-50 to-fuchsia-50 ring-1 ring-rose-100 flex items-center justify-center">
                                <TbHeart size={36} className="text-rose-300" strokeWidth={1.5} />
                            </div>
                            <div className="text-center px-6 max-w-md">
                                <p className="text-slate-700 font-bold text-base">No favourites yet</p>
                                <p className="text-slate-500 text-sm mt-1">Browse deals and tap the heart icon on any product card to save it here for later.</p>
                            </div>
                            <a
                                href="/"
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-zinc-950 hover:bg-violet-600 px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-violet-500/30 hover:scale-[1.02]"
                            >
                                Browse deals
                                <TbArrowLeft size={12} className="rotate-180" />
                            </a>
                        </div>
                    )}

                    {/* Grid — cards mirror DealsGrid for consistency */}
                    {favorites.length > 0 && (
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {favorites.map((product, i) => {
                                const onlineAvail = isAvailable(product.online_availability);
                                const instoreAvail = isAvailable(product.instore_availability);
                                const { amt, pct } = savings(product.price, product.regular_price);

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
                                            {pct > 0 && (
                                                <div className="absolute top-2.5 right-2.5 z-10 inline-flex items-center bg-linear-to-br from-rose-500 to-rose-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow-md shadow-rose-500/30">
                                                    −{pct}%
                                                </div>
                                            )}
                                            <div className="absolute top-2.5 left-2.5 z-10">
                                                <FavoriteButton product={product} variant="icon" />
                                            </div>
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
                                        <div className="flex flex-col flex-1 px-5 pb-5 pt-4 gap-3">
                                            <div>
                                                <p className="text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-violet-700 transition-colors">
                                                    {product.title}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-mono mt-1 tracking-wide">{product.item_code}</p>
                                            </div>

                                            <div className="flex items-baseline gap-3">
                                                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{product.price}</span>
                                                {pct > 0 && <span className="text-sm text-slate-400 line-through">{product.regular_price}</span>}
                                            </div>

                                            {pct > 0 && (
                                                <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 w-fit">
                                                    <TbTag size={12} className="text-emerald-600" />
                                                    <span className="text-[11px] font-bold text-emerald-700">Save ${amt}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-100">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-md px-1.5 py-0.5 ${
                                                    onlineAvail ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'
                                                }`}>
                                                    <TbWorld size={11} />
                                                    {onlineAvail ? 'Online' : '—'}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-md px-1.5 py-0.5 whitespace-nowrap ${
                                                    instoreAvail ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'
                                                }`}>
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

                    {/* Mobile clear all */}
                    {favorites.length > 0 && (
                        <div className="mt-8 flex justify-center sm:hidden">
                            <button
                                onClick={clearAll}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 px-4 py-2 rounded-full transition-all"
                            >
                                <TbTrash size={14} />
                                Clear all favourites
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
