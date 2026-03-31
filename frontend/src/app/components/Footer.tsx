import Link from 'next/link';
import { TbDeviceDesktop, TbCpu, TbCpu2, TbPhoto } from 'react-icons/tb';

const NAV_LINKS = [
    { label: 'Desktops', href: '/desktops', Icon: TbDeviceDesktop },
    { label: 'Memory', href: '/memory', Icon: TbCpu },
    { label: 'Processors', href: '/cpu', Icon: TbCpu2 },
    { label: 'Graphics', href: '/gpu', Icon: TbPhoto },
];

export default function Footer() {
    return (
        <footer className="bg-zinc-950 border-t border-zinc-800">
            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex flex-col md:flex-row items-start justify-between gap-8">

                    {/* Brand */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-white text-zinc-900 p-1.5 rounded-md">
                                <TbDeviceDesktop size={16} />
                            </div>
                            <span className="text-base font-bold text-white tracking-tight">
                                CC<span className="text-zinc-500">Deals</span>
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 max-w-[220px] leading-relaxed">
                            Track the best deals at Canada Computers. Updated automatically every 30 minutes.
                        </p>
                    </div>

                    {/* Nav links */}
                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Categories</p>
                        {NAV_LINKS.map(({ label, href, Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors duration-150"
                            >
                                <Icon size={15} />
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* Legal / credit */}
                    <div className="flex flex-col gap-2 text-xs text-zinc-500">
                        <p className="font-semibold text-zinc-400 uppercase tracking-widest mb-1">About</p>
                        <p>🍁 Proudly Canadian</p>
                        <p>Not affiliated with Canada Computers</p>
                        <p>No personal data collected</p>
                        <p>
                            Developed by{' '}
                            <a
                                href="https://antton.ca"
                                target="_blank"
                                rel="noreferrer"
                                className="text-zinc-300 hover:text-white font-medium transition-colors duration-200"
                            >
                                Anton
                            </a>
                        </p>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-600">
                    <span>© {new Date().getFullYear()} CCDeals. All rights reserved.</span>
                    <span>Prices and availability may vary. Verify on Canada Computers before purchasing.</span>
                </div>
            </div>
        </footer>
    );
}
