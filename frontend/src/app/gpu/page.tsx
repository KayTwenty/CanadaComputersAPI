'use client';

import { TbPhoto } from 'react-icons/tb';
import { useStore } from '../contexts/StoreContext';
import DealsGrid from '../components/DealsGrid';
import CategoryHero from '../components/CategoryHero';

export default function GpuPage() {
    const { storeId, selectedStore } = useStore();
    return (
        <>
            <CategoryHero
                title="Graphics Card Deals"
                description="GPUs from every major brand, sorted by biggest savings."
                Icon={TbPhoto}
                storeName={selectedStore.name}
                showStore={storeId !== null}
                cacheKey="__gpu__"
            />
            <div className="bg-slate-50 flex-1">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
                    <DealsGrid
                        storeId={storeId}
                        storeName={selectedStore.name}
                        baseUrl="/api/deals/gpu"
                        cacheKey="__gpu__"
                        defaultDealsOnly={false}
                    />
                </div>
            </div>
        </>
    );
}
