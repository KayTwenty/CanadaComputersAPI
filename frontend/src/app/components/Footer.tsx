import Link from 'next/link';
import { TbDeviceDesktop, TbDeviceLaptop, TbCpu, TbCpu2, TbPhoto, TbFlame, TbHeart, TbQuestionMark } from 'react-icons/tb';

const CATEGORIES = [
    { label: 'Desktops',   href: '/desktops', Icon: TbDeviceDesktop },
    { label: 'Laptops',    href: '/laptops',  Icon: TbDeviceLaptop },
    { label: 'Memory',     href: '/memory',   Icon: TbCpu },
    { label: 'Processors', href: '/cpu',      Icon: TbCpu2 },
    { label: 'Graphics',   href: '/gpu',      Icon: TbPhoto },
];

const MORE_LINKS = [
    { label: 'Favorites', href: '/favorites', Icon: TbHeart },
    { label: 'FAQ',        href: '/faq',       Icon: TbQuestionMark },
];

export default function Footer() {
    return (
        <footer className="bg-zinc-950 border-t border-zinc-800/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
                        <Link href="/" className="flex items-center gap-2.5 group w-fit">
                            <div className="bg-violet-600 text-white p-1.5 rounded-lg group-hover:bg-violet-500 transition-colors duration-200">
                                <TbFlame size={16} />
                            </div>
                            <span className="text-sm font-extrabold text-white tracking-tight">
                                CC<span className="text-zinc-500">Deals</span>
                            </span>
                        </Link>
                        <p className="text-[11px] text-zinc-500 max-w-52 leading-relaxed">
                            Track the best deals at Canada Computers. Updated automatically every 30 minutes.
                        </p>
                        <p className="text-[11px] text-zinc-600">🍁 Proudly Canadian</p>
                    </div>

                    {/* Categories */}
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Categories</p>
                        {CATEGORIES.map(({ label, href, Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="flex items-center gap-2 text-[13px] text-zinc-500 hover:text-white transition-colors duration-150"
                            >
                                <Icon size={13} className="text-zinc-600" />
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* More */}
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">More</p>
                        {MORE_LINKS.map(({ label, href, Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="flex items-center gap-2 text-[13px] text-zinc-500 hover:text-white transition-colors duration-150"
                            >
                                <Icon size={13} className="text-zinc-600" />
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* About */}
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">About</p>
                        <p className="text-[13px] text-zinc-500">Not affiliated with Canada Computers</p>
                        <p className="text-[13px] text-zinc-500">
                            Built by{' '}
                            <a
                                href="https://antton.ca"
                                target="_blank"
                                rel="noreferrer"
                                className="text-zinc-400 hover:text-white font-medium transition-colors duration-200"
                            >
                                Anton
                            </a>
                        </p>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-8 pt-5 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-600">
                    <span>© {new Date().getFullYear()} CCDeals</span>
                    <div className="flex items-center gap-3">
                        <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
                        <span className="text-zinc-800">·</span>
                        <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
                        <span className="text-zinc-800">·</span>
                        <span>Prices may vary. Verify before purchasing.</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
