import Deals from './components/Deals';
import { TbDeviceDesktop, TbExternalLink, TbArrowRight } from 'react-icons/tb';

export default function Home() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-zinc-900">
                <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-3 group">
                        <div className="bg-white text-zinc-900 p-1.5 rounded-md group-hover:scale-105 transition-transform duration-200">
                            <TbDeviceDesktop size={18} />
                        </div>
                        <span className="text-sm font-bold text-white tracking-tight">
                            Desktop<span className="text-zinc-500">Deals</span>
                        </span>
                    </a>
                    <nav className="flex items-center gap-6">
                        <span className="hidden sm:block text-xs text-zinc-500">
                            Data from Canada Computers
                        </span>
                        <a
                            href="https://www.canadacomputers.com/en/931/desktop-computers"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/50 hover:border-zinc-600 rounded-full px-4 py-1.5 transition-all duration-200"
                        >
                            Browse source
                            <TbExternalLink size={12} />
                        </a>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <div className="max-w-7xl mx-auto w-full px-6 pt-12 pb-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-violet-600 mb-1">Curated picks</p>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Best deals right now
                        </h2>
                        <p className="mt-2 text-slate-500 text-sm max-w-md">
                            Prebuilt desktops on sale under $2,500, automatically sorted by biggest discount so the best value is always first.
                        </p>
                    </div>
                    <a
                        href="https://www.canadacomputers.com/en/931/desktop-computers"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors shrink-0"
                    >
                        View all desktops
                        <TbArrowRight size={16} />
                    </a>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto w-full px-6 pb-16 flex-1">
                <Deals />
            </div>

            {/* Footer */}
            <footer className="bg-zinc-900">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-white text-zinc-900 p-1.5 rounded-md">
                                <TbDeviceDesktop size={14} />
                            </div>
                            <span className="text-sm font-bold text-white tracking-tight">
                                Desktop<span className="text-zinc-500">Deals</span>
                            </span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-xs text-zinc-500">
                            <span>Not affiliated with Canada Computers</span>
                            <span className="hidden sm:block text-zinc-700">|</span>
                            <span>
                                Developed by{' '}
                                <a
                                    href="https://antton.ca"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-zinc-300 hover:text-white font-medium transition-colors duration-200"
                                >
                                    Anton
                                </a>
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
