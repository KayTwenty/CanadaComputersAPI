'use client';

import { TbCpu } from 'react-icons/tb';
import { useStore } from '../contexts/StoreContext';
import DealsGrid from '../components/DealsGrid';
import CategoryHero from '../components/CategoryHero';

export default function MemoryPage() {
    const { storeId, selectedStore } = useStore();
    return (
        <>
            <CategoryHero
                title="Memory Deals"
                description="DDR4, DDR5 and laptop SO-DIMM kits on sale, sorted by biggest savings."
                Icon={TbCpu}
                storeName={selectedStore.name}
                showStore={storeId !== null}
                cacheKey="__memory__"
            />
            <div className="bg-slate-50 flex-1">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
                    <DealsGrid
                        storeId={storeId}
                        storeName={selectedStore.name}
                        baseUrl="/api/deals/memory"
                        cacheKey="__memory__"
                        defaultDealsOnly={false}
                    />
                </div>
            </div>
        </>
    );
}

