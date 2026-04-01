'use client';

import { useEffect, useState } from 'react';

const MESSAGES = [
    [
        { text: '🍁 Proudly Canadian' },
        { text: 'Not affiliated with Canada Computers' },
        { text: 'Your location never leaves this device' },
    ],
    [
        { text: '💡 Prices update automatically every 30 minutes' },
        { text: 'Member pricing not included' },
    ],
    [
        { text: '❤️ Save deals to Favourites for quick access' },
        { text: 'Filter by store, brand, and price range' },
    ],
];

export default function TopBanner() {
    const [index, setIndex] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const id = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setIndex(i => (i + 1) % MESSAGES.length);
                setVisible(true);
            }, 350);
        }, 5000);
        return () => clearInterval(id);
    }, []);

    const items = MESSAGES[index];

    return (
        <div className="w-full bg-zinc-950 border-b border-zinc-800 px-6" style={{ height: '41px' }}>
            <div className="relative max-w-7xl mx-auto h-full">
                <div
                    className="absolute inset-0 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center transition-all duration-300"
                    style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(40px)' }}
                >
                    {items.map((item, i) => (
                        <span key={i} className="flex items-center gap-x-6">
                            {i > 0 && <span className="hidden sm:block text-zinc-700">·</span>}
                            <span className="text-sm font-medium text-zinc-400">
                                {item.text}
                            </span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

