'use client';

import { TbServer } from 'react-icons/tb';
import { useStore } from '../contexts/StoreContext';
import DealsGrid from '../components/DealsGrid';
import CategoryHero from '../components/CategoryHero';

export default function MotherboardsPage() {
    const { storeId, selectedStore } = useStore();
    return (
        <>
            <CategoryHero
                title="Motherboard Deals"
                description="ATX, mATX and ITX motherboards from trusted brands, on sale."
                Icon={TbServer}
                storeName={selectedStore.name}
                showStore={storeId !== null}
                cacheKey="__motherboards__"
            />
            <div className="bg-slate-50 flex-1">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
                    <DealsGrid
                        storeId={storeId}
                        storeName={selectedStore.name}
                        baseUrl="/api/deals/motherboards"
                        cacheKey="__motherboards__"
                        defaultDealsOnly={false}
                    />
                </div>
            </div>
        </>
    );
}
