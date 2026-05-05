import Link from 'next/link';
import { TbFlame } from 'react-icons/tb';

const CATEGORIES = [
    { label: 'Desktops',       href: '/desktops' },
    { label: 'Laptops',        href: '/laptops' },
    { label: 'Memory',         href: '/memory' },
    { label: 'Processors',     href: '/cpu' },
    { label: 'Graphics',       href: '/gpu' },
    { label: 'Motherboards',   href: '/motherboards' },
    { label: 'Power Supplies', href: '/psu' },
    { label: 'SSDs',           href: '/ssd' },
    { label: 'Hard Drives',    href: '/hdd' },
];

const MORE_LINKS = [
    { label: 'Favorites', href: '/favorites' },
    { label: 'FAQ',       href: '/faq' },
];

export default function Footer() {
    return (
        <footer className="bg-zinc-950 border-t border-zinc-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10">

                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
                        <Link href="/" className="flex items-center gap-2 w-fit group">
                            <TbFlame size={17} className="text-violet-500 group-hover:text-violet-400 transition-colors" />
                            <span className="text-sm font-bold text-white tracking-tight">
                                CC<span className="text-zinc-500">Deals</span>
                            </span>
                        </Link>
                        <p className="text-xs text-zinc-500 max-w-48 leading-relaxed">
                            Real-time deal tracker for Canada Computers. Refreshed every 30 minutes.
                        </p>
                        <p className="text-xs text-zinc-600">🍁 Proudly Canadian</p>
                    </div>

                    {/* Categories */}
                    <div className="flex flex-col gap-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-0.5">Categories</p>
                        {CATEGORIES.map(({ label, href }) => (
                            <Link
                                key={href}
                                href={href}
                                className="text-[13px] text-zinc-500 hover:text-zinc-100 transition-colors"
                            >
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* More */}
                    <div className="flex flex-col gap-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-0.5">More</p>
                        {MORE_LINKS.map(({ label, href }) => (
                            <Link
                                key={href}
                                href={href}
                                className="text-[13px] text-zinc-500 hover:text-zinc-100 transition-colors"
                            >
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* About */}
                    <div className="flex flex-col gap-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-0.5">About</p>
                        <p className="text-[13px] text-zinc-500">Not affiliated with Canada Computers.</p>
                        <p className="text-[13px] text-zinc-500">
                            Built by{' '}
                            <a
                                href="https://antton.ca"
                                target="_blank"
                                rel="noreferrer"
                                className="text-zinc-300 hover:text-white font-medium transition-colors"
                            >
                                Anton
                            </a>
                        </p>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-10 pt-5 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-600">
                    <span>© {new Date().getFullYear()} CCDeals</span>
                    <div className="flex items-center gap-3">
                        <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
                        <span>·</span>
                        <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
                        <span>·</span>
                        <span>Prices may vary. Verify before purchasing.</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
