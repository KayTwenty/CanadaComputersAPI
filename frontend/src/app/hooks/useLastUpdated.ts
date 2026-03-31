'use client';

import { useState, useEffect } from 'react';

const STATUS_URL = 'http://127.0.0.1:5000/status';

interface CacheEntry {
    store_key: string;
    age_seconds: number;
    fresh: boolean;
}

interface StatusResponse {
    all_stores: CacheEntry | null;
    categories: CacheEntry[];
    stores: CacheEntry[];
}

function formatAge(seconds: number): string {
    if (seconds < 60) return 'Updated just now';
    if (seconds < 3600) {
        const m = Math.floor(seconds / 60);
        return `Updated ${m} min ago`;
    }
    const h = Math.floor(seconds / 3600);
    return `Updated ${h}h ago`;
}

/**
 * Returns a human-readable "Updated X min ago" string for the given cache key.
 * Cache keys: '__all__' | '__memory__' | '__cpu__' | '__gpu__'
 */
export function useLastUpdated(cacheKey: string): string | null {
    const [label, setLabel] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        fetch(STATUS_URL)
            .then(r => r.json())
            .then((data: StatusResponse) => {
                if (cancelled) return;
                let entry: CacheEntry | null = null;
                if (cacheKey === '__all__') {
                    entry = data.all_stores;
                } else {
                    entry = data.categories.find(e => e.store_key === cacheKey) ?? null;
                }
                if (entry) setLabel(formatAge(entry.age_seconds));
            })
            .catch(() => { /* silently ignore if backend is down */ });

        return () => { cancelled = true; };
    }, [cacheKey]);

    return label;
}
