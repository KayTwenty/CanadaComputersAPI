'use client';

import { TbArrowLeft, TbClock, TbMapPin } from 'react-icons/tb';
import type { ComponentType } from 'react';
import { useLastUpdated } from '../hooks/useLastUpdated';

interface CategoryHeroProps {
    title: string;
    description: string;
    Icon: ComponentType<{ size?: number; className?: string }>;
    storeName?: string;
    showStore?: boolean;
    cacheKey?: string;
}

export default function CategoryHero({
    title,
    description,
    Icon,
    storeName,
    showStore = false,
    cacheKey,
}: CategoryHeroProps) {
    const lastUpdated = useLastUpdated(cacheKey ?? '__all__');

    return (
        <section className="relative overflow-hidden bg-zinc-950 text-white">
            <div className="absolute inset-0 bg-grid pointer-events-none" />
            <div className="absolute inset-0 bg-spotlight pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-10 sm:pt-10 sm:pb-12">
                <a
                    href="/"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 hover:text-white mb-6 transition-colors group"
                >
                    <TbArrowLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
                    Back to all deals
                </a>

                <div className="flex items-start gap-4">
                    <span className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-violet-500/20 to-fuchsia-500/10 ring-1 ring-violet-500/30 flex items-center justify-center text-violet-300 shadow-lg shadow-violet-500/10">
                        <Icon size={26} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight animate-fade-up">
                            {title}
                        </h1>
                        <p className="mt-2 text-zinc-400 text-sm sm:text-base max-w-2xl animate-fade-up" style={{ animationDelay: '40ms' }}>
                            {description}
                        </p>

                        {/* Meta strip */}
                        <div className="mt-4 flex items-center gap-2 flex-wrap text-[11px] animate-fade-up" style={{ animationDelay: '80ms' }}>
                            {showStore && storeName && storeName !== 'All Stores' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-200">
                                    <TbMapPin size={12} className="text-violet-400" />
                                    <span className="font-semibold">{storeName}</span>
                                </span>
                            )}
                            {lastUpdated && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/60 border border-zinc-700/50 text-zinc-400">
                                    <TbClock size={12} />
                                    <span>{lastUpdated}</span>
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
                                <span className="font-bold uppercase tracking-wider text-[10px]">Live</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
