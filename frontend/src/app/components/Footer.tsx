import Link from 'next/link';
import { TbFlame, TbRefresh, TbExternalLink } from 'react-icons/tb';

const CATEGORIES = [
    { label: 'Desktops',       href: '/desktops' },
    { label: 'Laptops',        href: '/laptops' },
    { label: 'Memory',         href: '/memory' },
    { label: 'Processors',     href: '/cpu' },
    { label: 'Graphics',       href: '/gpu' },
    { label: 'Motherboards',   href: '/motherboards' },
    { label: 'Power Supplies', href: '/psu' },
    { label: 'Drives',         href: '/drives' },
    { label: 'Coolers',        href: '/coolers' },
    { label: 'Cases',          href: '/cases' },
];

const MORE_LINKS = [
    { label: 'Favourites', href: '/favorites' },
    { label: 'FAQ',        href: '/faq' },
    { label: 'Terms',      href: '/terms' },
    { label: 'Privacy',    href: '/privacy' },
];

export default function Footer() {
    return (
        <footer className="relative mt-12 bg-zinc-950 text-zinc-400 border-t border-zinc-900">
            {/* Top accent line */}
            <div className="h-px bg-linear-to-r from-transparent via-violet-500/40 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-8">
                <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8">

                    {/* Brand block */}
                    <div className="col-span-2 md:col-span-5 flex flex-col gap-5">
                        <Link href="/" className="flex items-center gap-2.5 w-fit group">
                            <span className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-violet-500 via-fuchsia-500 to-orange-500 shadow-lg shadow-violet-500/25">
                                <TbFlame size={16} className="text-white" />
                            </span>
                            <span className="text-base font-bold text-white tracking-tight">
                                CC<span className="text-zinc-500 font-semibold">Deals</span>
                            </span>
                        </Link>
                        <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
                            A real-time deal tracker for Canada Computers. Every discounted product, sorted by biggest dollar savings, refreshed automatically every 30 minutes.
                        </p>
                        <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
                            <TbRefresh size={11} className="text-emerald-400 animate-pulse-soft" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                                Auto-refresh active
                            </span>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="md:col-span-4 flex flex-col gap-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Categories</p>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                            {CATEGORIES.map(({ label, href }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="text-[13px] text-zinc-400 hover:text-white transition-colors w-fit"
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="md:col-span-3 flex flex-col gap-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Resources</p>
                        <div className="flex flex-col gap-2">
                            {MORE_LINKS.map(({ label, href }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="text-[13px] text-zinc-400 hover:text-white transition-colors w-fit"
                                >
                                    {label}
                                </Link>
                            ))}
                            <a
                                href="https://www.canadacomputers.com"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[13px] text-zinc-400 hover:text-white transition-colors w-fit"
                            >
                                Canada Computers
                                <TbExternalLink size={11} className="opacity-70" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="mt-12 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                        <span>© {new Date().getFullYear()} CCDeals</span>
                        <span className="text-zinc-700">·</span>
                        <span>Independent project, not affiliated with Canada Computers.</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                        <span>🍁 Built in Canada by{' '}
                            <a
                                href="https://antton.ca"
                                target="_blank"
                                rel="noreferrer"
                                className="text-zinc-300 hover:text-white font-semibold transition-colors"
                            >
                                Anton
                            </a>
                        </span>
                    </div>
                </div>

                <p className="mt-4 text-[10px] text-zinc-600 text-center sm:text-left">
                    Prices and availability are sourced from public listings and may vary. Always verify on the official Canada Computers website before purchasing.
                </p>
            </div>
        </footer>
    );
}

