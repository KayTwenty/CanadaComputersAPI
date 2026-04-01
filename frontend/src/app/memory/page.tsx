'use client';

import { TbArrowLeft, TbCpu } from 'react-icons/tb';
import { useStore } from '../contexts/StoreContext';
import DealsGrid from '../components/DealsGrid';

export default function MemoryPage() {
    const { storeId, selectedStore } = useStore();
    return (
        <>
            <div className="border-b border-slate-200/60 bg-linear-to-b from-amber-50/50 to-white">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                    <a
                        href="/"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 mb-4 transition-colors"
                    >
                        <TbArrowLeft size={12} />
                        Back to highlights
                    </a>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <TbCpu size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                                RAM & Memory Deals
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Every memory kit on sale at Canada Computers{storeId !== null && <> — <span className="font-semibold text-slate-700">{selectedStore.name}</span></>}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
                <DealsGrid
                    storeId={storeId}
                    storeName={selectedStore.name}
                    baseUrl="/api/deals/memory"
                    cacheKey="__memory__"
                />
            </div>
        </>
    );
}

