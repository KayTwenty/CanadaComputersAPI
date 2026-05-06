'use client';

import { TbDatabase } from 'react-icons/tb';
import { useStore } from '../contexts/StoreContext';
import DealsGrid from '../components/DealsGrid';
import CategoryHero from '../components/CategoryHero';

export default function DrivesPage() {
    const { storeId, selectedStore } = useStore();
    return (
        <>
            <CategoryHero
                title="Storage Drive Deals"
                description="SSDs and Hard Drives on sale, sorted by biggest savings."
                Icon={TbDatabase}
                storeName={selectedStore.name}
                showStore={storeId !== null}
                cacheKey="__drives__"
            />
            <div className="bg-slate-50 flex-1">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
                    <DealsGrid
                        storeId={storeId}
                        storeName={selectedStore.name}
                        baseUrl="/api/deals/drives"
                        cacheKey="__drives__"
                        defaultDealsOnly={false}
                    />
                </div>
            </div>
        </>
    );
}
