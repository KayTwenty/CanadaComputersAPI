'use client';

import { TbBox } from 'react-icons/tb';
import { useStore } from '../contexts/StoreContext';
import DealsGrid from '../components/DealsGrid';
import CategoryHero from '../components/CategoryHero';

export default function CasesPage() {
    const { storeId, selectedStore } = useStore();
    return (
        <>
            <CategoryHero
                title="Case Deals"
                description="Mid Tower, Full Tower and ITX/mATX cases on sale at Canada Computers."
                Icon={TbBox}
                storeName={selectedStore.name}
                showStore={storeId !== null}
                cacheKey="__cases__"
            />
            <div className="bg-slate-50 flex-1">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
                    <DealsGrid
                        storeId={storeId}
                        storeName={selectedStore.name}
                        baseUrl="/api/deals/cases"
                        cacheKey="__cases__"
                        defaultDealsOnly={false}
                    />
                </div>
            </div>
        </>
    );
}
