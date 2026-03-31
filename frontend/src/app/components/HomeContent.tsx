'use client';

import { TbArrowRight, TbCpu, TbDeviceDesktopAnalytics, TbCpu2, TbPhoto, TbRefresh } from 'react-icons/tb';
import Deals from './Deals';
import { useStore } from '../contexts/StoreContext';
import { useLastUpdated } from '../hooks/useLastUpdated';

export default function HomeContent() {
    const { storeId, selectedStore } = useStore();
    const storeName = selectedStore.name;

    const desktopsAge = useLastUpdated('__all__');
    const memoryAge   = useLastUpdated('__memory__');
    const cpuAge      = useLastUpdated('__cpu__');
    const gpuAge      = useLastUpdated('__gpu__');
    return (
        <>
            {/* Desktops section */}
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
                    <div>
                        <p className="text-sm font-semibold text-violet-600 mb-1 flex items-center gap-1.5">
                            <TbDeviceDesktopAnalytics size={14} />
                            Desktops
                        </p>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                            Desktop deals
                        </h3>
                        <p className="mt-1.5 text-slate-500 text-sm max-w-md">
                            Prebuilt desktops on sale, sorted by biggest dollar savings first.
                        </p>
                        {desktopsAge && (
                            <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                                <TbRefresh size={11} />{desktopsAge}
                            </p>
                        )}
                    </div>
                    <a
                        href="/desktops"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors shrink-0"
                    >
                        View all desktops
                        <TbArrowRight size={16} />
                    </a>
                </div>
                <Deals storeId={storeId} storeName={storeName} />
            </div>

            {/* RAM section */}
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
                    <div>
                        <p className="text-sm font-semibold text-blue-600 mb-1 flex items-center gap-1.5">
                            <TbCpu size={14} />
                            Memory
                        </p>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                            RAM deals
                        </h3>
                        <p className="mt-1.5 text-slate-500 text-sm max-w-md">
                            On-sale memory kits, sorted by biggest dollar savings first.
                        </p>
                        {memoryAge && (
                            <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                                <TbRefresh size={11} />{memoryAge}
                            </p>
                        )}
                    </div>
                    <a
                        href="/memory"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors shrink-0"
                    >
                        View all memory
                        <TbArrowRight size={16} />
                    </a>
                </div>
                <Deals
                    storeId={storeId}
                    storeName={storeName}
                    baseUrl="/api/deals/memory"
                />
            </div>

            {/* CPU section */}
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4 pb-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
                    <div>
                        <p className="text-sm font-semibold text-orange-600 mb-1 flex items-center gap-1.5">
                            <TbCpu2 size={14} />
                            Processors
                        </p>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                            CPU deals
                        </h3>
                        <p className="mt-1.5 text-slate-500 text-sm max-w-md">
                            On-sale processors, sorted by biggest dollar savings first.
                        </p>
                        {cpuAge && (
                            <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                                <TbRefresh size={11} />{cpuAge}
                            </p>
                        )}
                    </div>
                    <a
                        href="/cpu"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors shrink-0"
                    >
                        View all CPUs
                        <TbArrowRight size={16} />
                    </a>
                </div>
                <Deals
                    storeId={storeId}
                    storeName={storeName}
                    baseUrl="/api/deals/cpu"
                />
            </div>

            {/* GPU section */}
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4 pb-12">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
                    <div>
                        <p className="text-sm font-semibold text-green-600 mb-1 flex items-center gap-1.5">
                            <TbPhoto size={14} />
                            Graphics Cards
                        </p>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                            GPU deals
                        </h3>
                        <p className="mt-1.5 text-slate-500 text-sm max-w-md">
                            On-sale graphics cards, sorted by biggest dollar savings first.
                        </p>
                        {gpuAge && (
                            <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                                <TbRefresh size={11} />{gpuAge}
                            </p>
                        )}
                    </div>
                    <a
                        href="/gpu"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors shrink-0"
                    >
                        View all GPUs
                        <TbArrowRight size={16} />
                    </a>
                </div>
                <Deals
                    storeId={storeId}
                    storeName={storeName}
                    baseUrl="/api/deals/gpu"
                />
            </div>
        </>
    );
}
