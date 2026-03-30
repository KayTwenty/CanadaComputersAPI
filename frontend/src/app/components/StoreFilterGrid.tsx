'use client';

import { useState } from 'react';
import { TbMapPin, TbChevronDown } from 'react-icons/tb';
import DealsGrid from './DealsGrid';
import { STORES } from '../lib/stores';

export default function StoreFilterGrid() {
    const [storeId, setStoreId] = useState<number | null>(null);
    const selected = STORES.find(s => s.id === storeId) ?? STORES[0];

    return (
        <div className="flex flex-col gap-6">
            {/* Filter bar */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <TbMapPin size={15} className="text-violet-500" />
                    Store
                </div>
                <div className="relative">
                    <select
                        value={storeId ?? ''}
                        onChange={e => setStoreId(e.target.value === '' ? null : Number(e.target.value))}
                        className="appearance-none bg-white border border-slate-200 text-slate-800 text-sm font-medium rounded-xl pl-3.5 pr-9 py-2 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all cursor-pointer"
                    >
                        {STORES.map(store => (
                            <option key={store.id ?? 'all'} value={store.id ?? ''}>
                                {store.name}
                            </option>
                        ))}
                    </select>
                    <TbChevronDown
                        size={15}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                </div>
                {storeId !== null && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-3 py-1">
                        <TbMapPin size={12} />
                        {selected.name}
                        <button
                            onClick={() => setStoreId(null)}
                            className="ml-1 text-violet-400 hover:text-violet-700 font-bold transition-colors"
                            aria-label="Clear filter"
                        >
                            ×
                        </button>
                    </span>
                )}
            </div>

            {/* Full grid */}
            <DealsGrid storeId={storeId} storeName={selected.name} />
        </div>
    );
}
