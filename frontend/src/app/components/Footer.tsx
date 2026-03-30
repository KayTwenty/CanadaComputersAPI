import { TbDeviceDesktop } from 'react-icons/tb';

export default function Footer() {
    return (
        <footer className="bg-zinc-900">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-white text-zinc-900 p-1.5 rounded-md">
                            <TbDeviceDesktop size={14} />
                        </div>
                        <span className="text-sm font-bold text-white tracking-tight">
                            CC<span className="text-zinc-500">Deals</span>
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
    );
}
