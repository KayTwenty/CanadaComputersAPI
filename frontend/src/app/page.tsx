import Deals from './components/Deals';
import { TbDeviceDesktop } from 'react-icons/tb';
import { BsGithub } from 'react-icons/bs';
import { TbExternalLink } from 'react-icons/tb';

export default function Home() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-900 text-white p-2 rounded-xl">
                        <TbDeviceDesktop size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase leading-none mb-0.5">Canada Computers</p>
                        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">Desktop Deals</h1>
                    </div>
                </div>
                <a
                    href="https://www.canadacomputers.com/en/931/desktop-computers"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors border border-slate-200 hover:border-slate-400 rounded-lg px-3 py-2"
                >
                    View on site
                    <TbExternalLink size={14} />
                </a>
            </header>

            {/* Hero */}
            <div className="px-8 pt-10 pb-6">
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Best deals right now
                </p>
                <p className="mt-1.5 text-slate-500 text-sm">
                    Prebuilt desktops on sale under $2,500 &mdash; sorted by biggest discount
                </p>
            </div>

            {/* Content */}
            <div className="px-8 pb-12 flex-1">
                <Deals />
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 px-8 py-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <p className="text-sm font-semibold text-slate-700">Canada Computers Deal Tracker</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Not affiliated with Canada Computers. Prices may vary.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-slate-700 transition-colors"
                            aria-label="GitHub"
                        >
                            <BsGithub size={20} />
                        </a>
                        <a
                            href="https://www.canadacomputers.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
                        >
                            canadacomputers.com
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
