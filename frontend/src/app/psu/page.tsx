'use client';

import { TbBolt } from 'react-icons/tb';
import { useStore } from '../contexts/StoreContext';
import DealsGrid from '../components/DealsGrid';
import CategoryHero from '../components/CategoryHero';

export default function PsuPage() {
    const { storeId, selectedStore } = useStore();
    return (
        <>
            <CategoryHero
                title="Power Supply Deals"
                description="Modular and non-modular PSUs from trusted brands, on sale now."
                Icon={TbBolt}
                storeName={selectedStore.name}
                showStore={storeId !== null}
                cacheKey="__psu__"
            />
            <div className="bg-slate-50 flex-1">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
                    <DealsGrid
                        storeId={storeId}
                        storeName={selectedStore.name}
                        baseUrl="/api/deals/psu"
                        cacheKey="__psu__"
                        defaultDealsOnly={false}
                    />
                </div>
            </div>
        </>
    );
}
