'use client';

import { TbWind } from 'react-icons/tb';
import { useStore } from '../contexts/StoreContext';
import DealsGrid from '../components/DealsGrid';
import CategoryHero from '../components/CategoryHero';

export default function CoolersPage() {
    const { storeId, selectedStore } = useStore();
    return (
        <>
            <CategoryHero
                title="Cooler Deals"
                description="Air coolers, liquid coolers and case fans on sale at Canada Computers."
                Icon={TbWind}
                storeName={selectedStore.name}
                showStore={storeId !== null}
                cacheKey="__coolers__"
            />
            <div className="bg-slate-50 flex-1">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
                    <DealsGrid
                        storeId={storeId}
                        storeName={selectedStore.name}
                        baseUrl="/api/deals/coolers"
                        cacheKey="__coolers__"
                        defaultDealsOnly={false}
                    />
                </div>
            </div>
        </>
    );
}
