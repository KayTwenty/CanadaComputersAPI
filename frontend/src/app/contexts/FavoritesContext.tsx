'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface FavProduct {
    title: string;
    price: string;
    regular_price: string;
    item_code: string;
    online_availability: string;
    instore_availability: string;
    link: string;
    image_url: string;
}

interface FavoritesCtx {
    favorites: FavProduct[];
    isFavorited: (item_code: string) => boolean;
    toggle: (product: FavProduct) => void;
    clearAll: () => void;
}

const Ctx = createContext<FavoritesCtx>({
    favorites: [],
    isFavorited: () => false,
    toggle: () => {},
    clearAll: () => {},
});

const STORAGE_KEY = 'ccdeals_favorites';

function load(): FavProduct[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as FavProduct[]) : [];
    } catch {
        return [];
    }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const [favorites, setFavorites] = useState<FavProduct[]>([]);

    // Hydrate from localStorage after mount
    useEffect(() => { setFavorites(load()); }, []);

    const toggle = useCallback((product: FavProduct) => {
        setFavorites(prev => {
            const exists = prev.some(p => p.item_code === product.item_code);
            const next = exists
                ? prev.filter(p => p.item_code !== product.item_code)
                : [...prev, product];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const isFavorited = useCallback(
        (item_code: string) => favorites.some(p => p.item_code === item_code),
        [favorites],
    );

    const clearAll = useCallback(() => {
        setFavorites([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return <Ctx.Provider value={{ favorites, isFavorited, toggle, clearAll }}>{children}</Ctx.Provider>;
}

export function useFavorites() {
    return useContext(Ctx);
}
