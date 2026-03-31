export default function TopBanner() {
    return (
        <div className="w-full bg-zinc-950 border-b border-zinc-800 py-2.5 px-6">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center">
                <span className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
                    <span>🍁</span>
                    <span>Proudly Canadian</span>
                </span>
                <span className="hidden sm:block text-zinc-700">·</span>
                <span className="text-sm font-medium text-zinc-400">
                    Not affiliated with Canada Computers
                </span>
                <span className="hidden sm:block text-zinc-700">·</span>
                <span className="text-sm font-medium text-zinc-400">
                    No data collected &amp; your location never leaves your device
                </span>
            </div>
        </div>
    );
}
