'use client';

import { useState } from 'react';
import { TbMapPin, TbChevronDown } from 'react-icons/tb';
import Deals from './Deals';

const STORES: { id: number | null; name: string }[] = [
    { id: null,  name: 'All Stores' },
    { id: 1,     name: 'Ajax' },
    { id: 2,     name: 'Barrie' },
    { id: 4,     name: 'Brampton' },
    { id: 67,    name: 'Brossard' },
    { id: 3,     name: 'Burlington' },
    { id: 56,    name: 'Burnaby' },
    { id: 66,    name: 'Cambridge' },
    { id: 57,    name: 'Coquitlam' },
    { id: 5,     name: 'Etobicoke' },
    { id: 60,    name: 'Gatineau' },
    { id: 62,    name: 'Halifax' },
    { id: 8,     name: 'Hamilton' },
    { id: 9,     name: 'Kanata' },
    { id: 11,    name: 'Kingston' },
    { id: 12,    name: 'Laval' },
    { id: 75,    name: 'Lawrence Plaza' },
    { id: 71,    name: 'London Masonville' },
    { id: 68,    name: 'Marche Central' },
    { id: 17,    name: 'Markham Unionville' },
    { id: 15,    name: 'Mississauga' },
    { id: 46,    name: 'Montreal Downtown' },
    { id: 18,    name: 'Newmarket' },
    { id: 64,    name: 'North York' },
    { id: 69,    name: 'Oakville' },
    { id: 23,    name: 'Oshawa' },
    { id: 44,    name: 'Ottawa Downtown' },
    { id: 20,    name: 'Ottawa Merivale' },
    { id: 21,    name: 'Ottawa Orleans' },
    { id: 73,    name: 'QC Vanier' },
    { id: 58,    name: 'Richmond' },
    { id: 26,    name: 'Richmond Hill' },
    { id: 27,    name: 'St Catharines' },
    { id: 72,    name: 'Surrey' },
    { id: 28,    name: 'Toronto Downtown' },
    { id: 29,    name: 'Toronto Kennedy' },
    { id: 51,    name: 'Vancouver Broadway' },
    { id: 32,    name: 'Vaughan' },
    { id: 33,    name: 'Waterloo' },
    { id: 34,    name: 'Whitby' },
];

export default function StoreFilter() {
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

            {/* Deals carousel */}
            <Deals storeId={storeId} storeName={selected.name} />
        </div>
    );
}
