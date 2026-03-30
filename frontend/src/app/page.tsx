'use client';

import { useStore } from './contexts/StoreContext';
import HomeContent from './components/HomeContent';

export default function Home() {
    const { storeId, selectedStore } = useStore();
    return (
        <>
            <div className="max-w-7xl mx-auto w-full px-6 pt-12 pb-6">
                <p className="text-sm font-semibold text-violet-600 mb-1">Curated picks</p>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Best deals right now
                </h2>
                <p className="mt-2 text-slate-500 text-sm max-w-md">
                    {storeId !== null
                        ? `On-sale products at ${selectedStore.name}, sorted by biggest dollar savings.`
                        : 'On-sale products from Canada Computers, sorted by biggest dollar savings.'}
                </p>
            </div>
            <HomeContent />
        </>
    );
}

