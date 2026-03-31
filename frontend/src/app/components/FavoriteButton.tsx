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
                aria-label={fav ? 'Remove from favorites' : 'Save to favorites'}
                className={`flex items-center justify-center w-8 h-8 rounded-full shadow-sm border transition-all ${
                    fav
                        ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100'
                        : 'bg-white/90 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white'
                }`}
            >
                <TbHeart
                    size={15}
                    style={fav ? { fill: 'currentColor' } : undefined}
                />
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            aria-label={fav ? 'Remove from favorites' : 'Save to favorites'}
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                fav
                    ? 'bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-100'
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
            }`}
        >
            <TbHeart
                size={iconSize}
                style={fav ? { fill: 'currentColor' } : undefined}
            />
        </button>
    );
}
