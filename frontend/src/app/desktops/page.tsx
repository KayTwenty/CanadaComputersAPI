'use client';

import { TbDeviceDesktop } from 'react-icons/tb';
import { useStore } from '../contexts/StoreContext';
import DealsGrid from '../components/DealsGrid';
import CategoryHero from '../components/CategoryHero';

export default function DesktopsPage() {
    const { storeId, selectedStore } = useStore();
    return (
        <>
            <CategoryHero
                title="Desktop Deals"
                description="Every prebuilt desktop on sale at Canada Computers, sorted by biggest savings."
                Icon={TbDeviceDesktop}
                storeName={selectedStore.name}
                showStore={storeId !== null}
                cacheKey="__all__"
            />
            <div className="bg-slate-50 flex-1">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
                    <DealsGrid storeId={storeId} storeName={selectedStore.name} cacheKey="__all__" defaultDealsOnly={false} />
                </div>
            </div>
        </>
    );
}

