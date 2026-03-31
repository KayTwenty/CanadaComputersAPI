'use client';

import { TbArrowLeft, TbCpu2 } from 'react-icons/tb';
import { useStore } from '../contexts/StoreContext';
import DealsGrid from '../components/DealsGrid';

export default function CpuPage() {
    const { storeId, selectedStore } = useStore();
    return (
        <>
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8">
                <a
                    href="/"
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-700 mb-3 transition-colors"
                >
                    <TbArrowLeft size={13} />
                    Back to highlights
                </a>
                <p className="text-sm font-semibold text-orange-600 mb-1 flex items-center gap-1.5">
                    <TbCpu2 size={14} />
                    Processors
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    CPU storefront
                </h2>
                <p className="mt-2 text-slate-500 text-sm max-w-md">
                    Every processor currently on sale at Canada Computers.
                    {storeId !== null && (
                        <> Showing results for{' '}
                            <span className="font-semibold text-slate-700">{selectedStore.name}</span>.
                        </>
                    )}
                </p>
            </div>
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pb-12 sm:pb-16 flex-1">
                <DealsGrid
                    storeId={storeId}
                    storeName={selectedStore.name}
                    baseUrl="/api/deals/cpu"
                    cacheKey="__cpu__"
                />
            </div>
        </>
    );
}
