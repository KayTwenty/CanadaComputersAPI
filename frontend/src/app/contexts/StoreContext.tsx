'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { STORES, distanceBetween, type StoreEntry } from '../lib/stores';

export type LocationState = 'idle' | 'loading' | 'granted' | 'denied';
export interface UserPos { lat: number; lng: number }

interface StoreContextValue {
    storeId: number | null;
    selectedStore: StoreEntry;
    locationState: LocationState;
    userPos: UserPos | null;
    bannerDismissed: boolean | null;
    selectStore: (id: number | null) => void;
    requestLocation: () => void;
    dismissBanner: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
    const [storeId, setStoreId]                 = useState<number | null>(null);
    const [userPos, setUserPos]                 = useState<UserPos | null>(null);
    const [locationState, setLocationState]     = useState<LocationState>('idle');
    const [bannerDismissed, setBannerDismissed] = useState<boolean | null>(null);

    // Hydrate from localStorage (runs client-side only — avoids SSR mismatch)
    useEffect(() => {
        const savedId = localStorage.getItem('cc_storeId');
        if (savedId !== null) setStoreId(savedId === '' ? null : Number(savedId));

        const savedPos = localStorage.getItem('cc_userPos');
        if (savedPos) {
            try {
                setUserPos(JSON.parse(savedPos));
                setLocationState('granted');
                setBannerDismissed(true);
                return;
            } catch { /* ignore malformed data */ }
        }
        setBannerDismissed(localStorage.getItem('cc_bannerDismissed') === '1');
    }, []);

    const selectStore = useCallback((id: number | null) => {
        setStoreId(id);
        localStorage.setItem('cc_storeId', id === null ? '' : String(id));
    }, []);

    const requestLocation = useCallback(() => {
        setLocationState('loading');
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                const pos = { lat: coords.latitude, lng: coords.longitude };
                setUserPos(pos);
                setLocationState('granted');
                localStorage.setItem('cc_userPos', JSON.stringify(pos));
                setBannerDismissed(true);
                localStorage.setItem('cc_bannerDismissed', '1');

                const nearest = STORES
                    .filter((s): s is StoreEntry & { lat: number; lng: number } =>
                        s.id !== null && s.lat !== undefined && s.lng !== undefined)
                    .sort((a, b) => distanceBetween(pos, a) - distanceBetween(pos, b))[0];
                if (nearest) {
                    setStoreId(nearest.id);
                    localStorage.setItem('cc_storeId', String(nearest.id));
                }
            },
            () => {
                setLocationState('denied');
                setBannerDismissed(true);
                localStorage.setItem('cc_bannerDismissed', '1');
            },
            { timeout: 10000 },
        );
    }, []);

    const dismissBanner = useCallback(() => {
        setBannerDismissed(true);
        localStorage.setItem('cc_bannerDismissed', '1');
    }, []);

    const selectedStore = STORES.find(s => s.id === storeId) ?? STORES[0];

    return (
        <StoreContext.Provider value={{
            storeId, selectedStore, locationState,
            userPos, bannerDismissed,
            selectStore, requestLocation, dismissBanner,
        }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore(): StoreContextValue {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
    return ctx;
}
