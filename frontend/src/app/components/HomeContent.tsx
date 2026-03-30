'use client';

import { TbArrowRight, TbCpu, TbDeviceDesktopAnalytics, TbCpu2 } from 'react-icons/tb';
import Deals from './Deals';
import { useStore } from '../contexts/StoreContext';

export default function HomeContent() {
    const { storeId, selectedStore } = useStore();
    const storeName = selectedStore.name;
    return (
        <>
            {/* Desktops section */}
            <div className="max-w-7xl mx-auto w-full px-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                    <div>
                        <p className="text-sm font-semibold text-violet-600 mb-1 flex items-center gap-1.5">
                            <TbDeviceDesktopAnalytics size={14} />
                            Desktops
                        </p>
                        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            Desktop deals
                        </h3>
                        <p className="mt-1.5 text-slate-500 text-sm max-w-md">
                            Prebuilt desktops on sale, sorted by biggest dollar savings first.
                        </p>
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
            <div className="max-w-7xl mx-auto w-full px-6 pt-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                    <div>
                        <p className="text-sm font-semibold text-blue-600 mb-1 flex items-center gap-1.5">
                            <TbCpu size={14} />
                            Memory
                        </p>
                        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            RAM deals
                        </h3>
                        <p className="mt-1.5 text-slate-500 text-sm max-w-md">
                            On-sale memory kits, sorted by biggest dollar savings first.
                        </p>
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
                    baseUrl="http://127.0.0.1:5000/deals/memory"
                />
            </div>

            {/* CPU section */}
            <div className="max-w-7xl mx-auto w-full px-6 pt-4 pb-16">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                    <div>
                        <p className="text-sm font-semibold text-orange-600 mb-1 flex items-center gap-1.5">
                            <TbCpu2 size={14} />
                            Processors
                        </p>
                        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            CPU deals
                        </h3>
                        <p className="mt-1.5 text-slate-500 text-sm max-w-md">
                            On-sale processors, sorted by biggest dollar savings first.
                        </p>
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
                    baseUrl="http://127.0.0.1:5000/deals/cpu"
                />
            </div>
        </>
    );
}
