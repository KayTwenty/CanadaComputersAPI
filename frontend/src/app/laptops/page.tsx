'use client';

import { TbDeviceLaptop } from 'react-icons/tb';
import { useStore } from '../contexts/StoreContext';
import DealsGrid from '../components/DealsGrid';
import CategoryHero from '../components/CategoryHero';

export default function LaptopsPage() {
    const { storeId, selectedStore } = useStore();
    return (
        <>
            <CategoryHero
                title="Laptop Deals"
                description="Windows, Business and Gaming laptops on sale. Filter by type, brand or savings."
                Icon={TbDeviceLaptop}
                storeName={selectedStore.name}
                showStore={storeId !== null}
                cacheKey="__laptops__"
            />
            <div className="bg-slate-50 flex-1">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
                    <DealsGrid
                        storeId={storeId}
                        storeName={selectedStore.name}
                        baseUrl="/api/deals/laptops"
                        cacheKey="__laptops__"
                        defaultDealsOnly={false}
                    />
                </div>
            </div>
        </>
    );
}
