'use client';

import { TbHeart } from 'react-icons/tb';
import { useFavorites, type FavProduct } from '../contexts/FavoritesContext';

export default function FavoriteButton({
    product,
    size = 'md',
    variant = 'pill',
}: {
    product: FavProduct;
    size?: 'sm' | 'md';
    variant?: 'pill' | 'icon';
}) {
    const { isFavorited, toggle } = useFavorites();
    const fav = isFavorited(product.item_code);
    const iconSize = size === 'sm' ? 12 : 14;

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(product);
    };

    if (variant === 'icon') {
        return (
            <button
                onClick={handleClick}
                aria-label={fav ? 'Remove from favourites' : 'Save to favourites'}
                className={`group/fav flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md transition-all duration-200 active:scale-90 ${
                    fav
                        ? 'bg-linear-to-br from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-105'
                        : 'bg-white/90 border border-slate-200/80 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-white hover:scale-105 shadow-sm'
                }`}
            >
                <TbHeart
                    size={15}
                    style={fav ? { fill: 'currentColor' } : undefined}
                    className={fav ? 'drop-shadow-sm' : 'transition-transform group-hover/fav:scale-110'}
                />
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            aria-label={fav ? 'Remove from favourites' : 'Save to favourites'}
            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                fav
                    ? 'bg-linear-to-br from-rose-500 to-rose-600 text-white border-rose-500 shadow-sm shadow-rose-500/30'
                    : 'bg-white text-slate-400 border-slate-200 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200'
            }`}
        >
            <TbHeart
                size={iconSize}
                style={fav ? { fill: 'currentColor' } : undefined}
            />
        </button>
    );
}
