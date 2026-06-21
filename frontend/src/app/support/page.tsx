'use client';

import {
    TbBolt, TbBell, TbChartLine, TbShieldCheck,
    TbCheck, TbX, TbStar, TbTrendingDown,
    TbSparkles, TbLock, TbInfinity, TbHeart,
    TbArrowRight, TbServer, TbClock,
} from 'react-icons/tb';

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
    { label: 'Live refresh interval',      free: '30 min',     supporter: '15 seconds',  highlight: true  },
    { label: 'Price history',              free: '30 days',    supporter: 'All time',    highlight: true  },
    { label: 'Price drop alerts',          free: false,        supporter: true,          highlight: true  },
    { label: 'Deal score & rating',        free: false,        supporter: true,          highlight: false },
    { label: 'All stores coverage',        free: true,         supporter: true,          highlight: false },
    { label: 'Store stock checker',        free: true,         supporter: true,          highlight: false },
    { label: 'Price history chart',        free: true,         supporter: true,          highlight: false },
    { label: 'Email digest (daily/wkly)',  free: false,        supporter: true,          highlight: false },
    { label: 'Early deal preview',         free: false,        supporter: true,          highlight: true  },
] as const;

const PERKS = [
    {
        icon: TbBolt,
        title: '15-second live refresh',
        body: 'While free users see 30-minute-old prices, supporters see every change the instant it happens.',
        color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-200',
    },
    {
        icon: TbBell,
        title: 'Instant price drop alerts',
        body: 'Set a target price on any product. The moment the price drops below it, you get an email.',
        color: 'text-fuchsia-500', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200',
    },
    {
        icon: TbChartLine,
        title: 'Full price history',
        body: 'See all-time price charts, not just 30 days. Spot seasonal patterns and buy at the true low.',
        color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200',
    },
    {
        icon: TbTrendingDown,
        title: 'Deal score & buy signal',
        body: 'Every deal gets a score based on historical data. Know exactly how good a deal actually is.',
        color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200',
    },
    {
        icon: TbClock,
        title: 'Early deal preview',
        body: 'Supporters see deals before they go public. Flash sales last minutes — get the first shot.',
        color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200',
    },
    {
        icon: TbServer,
        title: 'Keep the lights on',
        body: 'CCDeals runs entirely on your support. Servers, proxies, and development are funded by supporters.',
        color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200',
    },
] as const;

// ── Feature cell ──────────────────────────────────────────────────────────────

function FeatureCell({ value }: { value: string | boolean }) {
    if (value === true)  return <TbCheck size={16} className="text-emerald-500 mx-auto" />;
    if (value === false) return <TbX     size={16} className="text-slate-300 mx-auto" />;
    return <span className="text-sm font-semibold text-slate-900">{value}</span>;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SupportPage() {
    return (
        <div className="flex-1">

            {/* ── Dark hero ── */}
            <section className="relative overflow-hidden bg-zinc-950 text-white">
                <div className="absolute inset-0 bg-grid pointer-events-none" />
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse 85% 55% at 50% 0%, rgba(124,58,237,0.2), transparent 65%)' }} />
                <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-fuchsia-700/8 blur-3xl pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-violet-700/8 blur-3xl pointer-events-none" />

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-20 sm:pb-24 text-center">

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] animate-fade-up" style={{ animationDelay: '40ms' }}>
                        CCDeals is free.
                        <br />
                        <span className="text-brand-gradient">Help keep it that way.</span>
                    </h1>

                    <p className="mt-5 text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '80ms' }}>
                        Running live scrapers, proxies, and servers costs real money. Supporters keep CCDeals
                        running and get exclusive perks in return, starting with <strong className="text-violet-300">15-second live price data</strong>.
                    </p>

                    {/* CTA */}
                    <div className="mt-10 inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-violet-500/10 border border-violet-500/25 animate-fade-up" style={{ animationDelay: '120ms' }}>
                        <TbSparkles size={15} className="text-violet-400 shrink-0" />
                        <span className="font-bold text-violet-200">Supporter access launching Q4 2026</span>
                        <span className="text-zinc-500 hidden sm:inline">Early access coming soon</span>
                    </div>

                    {/* Stats strip */}
                    <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-800/50 rounded-2xl overflow-hidden border border-zinc-800 animate-fade-up" style={{ animationDelay: '160ms' }}>
                        {[
                            { value: '15s',    label: 'live refresh rate' },
                            { value: '$180k+', label: 'saved by users' },
                            { value: '340k+',  label: 'deals tracked' },
                            { value: '99.9%',  label: 'uptime' },
                        ].map(({ value, label }) => (
                            <div key={label} className="bg-zinc-900/80 px-4 py-5 text-center">
                                <p className="text-2xl font-extrabold tabular-nums text-white">{value}</p>
                                <p className="text-xs text-zinc-400 mt-1 font-medium">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Light body ── */}
            <div className="bg-slate-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 space-y-20">

                    {/* Why it costs money */}
                    <section className="animate-fade-up">
                        <div className="text-center mb-10">
                            <p className="text-[11px] font-bold text-violet-600 uppercase tracking-widest mb-2">Why we need support</p>
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                                Free to use doesn&apos;t mean free to run.
                            </h2>
                            <p className="mt-3 text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
                                Every price you see on CCDeals was fetched live from Canada Computers. That means
                                continuous scraping, rotating proxies, and always-on servers. Supporters make that sustainable.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {PERKS.map(({ icon: Icon, title, body, color, bg, border }) => (
                                <div key={title} className={`bg-white rounded-2xl border ${border} p-6 shadow-sm flex flex-col gap-3`}>
                                    <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
                                        <Icon size={20} className={color} />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Live demo callout */}
                    <section className="relative overflow-hidden rounded-2xl bg-zinc-950 text-white px-6 sm:px-10 py-10 sm:py-12 animate-fade-up">
                        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
                        <div className="absolute inset-0 pointer-events-none"
                            style={{ background: 'radial-gradient(ellipse 70% 80% at 30% 50%, rgba(124,58,237,0.16), transparent 70%)' }} />
                        <div className="relative flex flex-col sm:flex-row items-center gap-8">
                            <div className="flex-1 min-w-0">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
                                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Live data</span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                                    The difference <span className="text-brand-gradient">15 seconds</span> makes
                                </h3>
                                <p className="mt-3 text-sm text-zinc-300 leading-relaxed max-w-md">
                                    Flash sales on Canada Computers can appear and sell out within minutes.
                                    A 30-minute cache means you are always looking at old prices.
                                    Supporters see every change as it happens.
                                </p>
                                <div className="mt-6 grid grid-cols-2 gap-3 max-w-xs">
                                    <div className="bg-zinc-800/60 rounded-xl px-3 py-3 text-center border border-zinc-700/50">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-bold">Free</p>
                                        <p className="text-2xl font-extrabold text-zinc-400 mt-1">30m</p>
                                        <p className="text-[10px] text-zinc-500 mt-0.5">refresh</p>
                                    </div>
                                    <div className="bg-violet-600/20 rounded-xl px-3 py-3 text-center border border-violet-500/40 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-linear-to-br from-violet-500/10 to-fuchsia-500/10" />
                                        <p className="relative text-[10px] text-violet-300 uppercase tracking-wide font-bold">Supporter</p>
                                        <p className="relative text-2xl font-extrabold text-white mt-1">15s</p>
                                        <p className="relative text-[10px] text-violet-300 mt-0.5">refresh</p>
                                    </div>
                                </div>
                            </div>
                            {/* Mock live ticker */}
                            <div className="shrink-0 w-full sm:w-64 bg-zinc-900 rounded-2xl border border-zinc-700 overflow-hidden">
                                <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
                                    <span className="text-xs font-bold text-zinc-300">Live price feed</span>
                                </div>
                                {[
                                    { item: 'RTX 4070 Super',   from: '$679.99', to: '$599.99', pct: '−12%' },
                                    { item: 'Ryzen 7 9800X3D',  from: '$529.99', to: '$499.99', pct: '−6%'  },
                                    { item: 'DDR5 32GB Kit',    from: '$139.99', to: '$109.99', pct: '−21%' },
                                    { item: 'Samsung 990 Pro',  from: '$189.99', to: '$159.99', pct: '−16%' },
                                ].map(({ item, from, to, pct }) => (
                                    <div key={item} className="px-4 py-2.5 border-b border-zinc-800/60 flex items-center justify-between gap-2">
                                        <p className="text-xs text-zinc-300 truncate font-medium">{item}</p>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] text-zinc-500 line-through tabular-nums">{from}</p>
                                            <p className="text-xs font-bold text-emerald-400 tabular-nums">{to} <span className="opacity-70">{pct}</span></p>
                                        </div>
                                    </div>
                                ))}
                                <div className="px-4 py-2 text-center text-[10px] text-zinc-600 font-mono">
                                    updated 3 seconds ago
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Free vs Supporter comparison */}
                    <section className="animate-fade-up">
                        <div className="text-center mb-8">
                            <p className="text-[11px] font-bold text-violet-600 uppercase tracking-widest mb-2">Compare</p>
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                                Free vs Supporter
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto mb-8">
                            {/* Free card */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
                                <div className="mb-6">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Free</p>
                                    <p className="mt-1 text-3xl font-extrabold text-slate-900">Always free</p>
                                    <p className="text-sm text-slate-400 mt-0.5">no account needed</p>
                                </div>
                                <ul className="space-y-2.5 flex-1">
                                    {['30-min price refresh', '30-day price history', 'All store stock checker', 'Price chart & stats'].map(f => (
                                        <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                                            <TbCheck size={15} className="text-emerald-500 shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                    {['Price drop alerts', 'All-time history', 'Deal scoring', 'Email digest'].map(f => (
                                        <li key={f} className="flex items-center gap-2.5 text-sm text-slate-400">
                                            <TbX size={15} className="text-slate-300 shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <a href="/" className="mt-6 block text-center px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                                    Continue browsing
                                </a>
                            </div>

                            {/* Supporter card */}
                            <div className="relative bg-zinc-950 rounded-2xl border border-violet-500/40 p-6 flex flex-col overflow-hidden shadow-xl shadow-violet-500/10">
                                <div className="absolute inset-0 bg-linear-to-br from-violet-500/8 to-fuchsia-500/5 pointer-events-none" />
                                <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/25">
                                    <TbHeart size={10} className="text-rose-400" />
                                    <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">Supporter</span>
                                </div>
                                <div className="mb-6 relative">
                                    <p className="text-xs font-bold text-violet-400 uppercase tracking-widest">Supporter</p>
                                    <p className="mt-1 text-2xl font-extrabold text-white">Launching Q4 2026</p>
                                    <p className="mt-1.5 text-xs text-emerald-400 font-bold">Early access pricing locked in at launch</p>
                                </div>
                                <ul className="space-y-2.5 flex-1 relative">
                                    {[
                                        { text: '15-second live refresh',   hot: true  },
                                        { text: 'All-time price history',   hot: false },
                                        { text: 'Instant price drop alerts', hot: true  },
                                        { text: 'Deal score & buy signal',  hot: false },
                                        { text: 'All store stock checker',  hot: false },
                                        { text: 'Email digest (daily/wkly)', hot: false },
                                        { text: 'Early deal preview',       hot: false },
                                    ].map(({ text, hot }) => (
                                        <li key={text} className="flex items-center gap-2.5 text-sm text-zinc-200">
                                            <TbCheck size={15} className="text-emerald-400 shrink-0" />
                                            {text}
                                            {hot && (
                                                <span className="ml-auto text-[9px] font-bold text-violet-300 bg-violet-500/15 border border-violet-500/25 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Soon</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6 relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/25 text-sm font-bold text-violet-300">
                                    <TbSparkles size={14} />
                                    Early access coming Q4 2026
                                </div>
                            </div>
                        </div>

                        {/* Full feature table */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="grid grid-cols-3 border-b border-slate-100">
                                <div className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Feature</div>
                                <div className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Free</div>
                                <div className="px-5 py-4 text-xs font-bold text-violet-600 uppercase tracking-widest text-center bg-violet-50/50">Supporter</div>
                            </div>
                            {FEATURES.map(({ label, free, supporter, highlight }, i) => (
                                <div
                                    key={label}
                                    className={`grid grid-cols-3 border-b border-slate-100 last:border-0 ${i % 2 !== 0 ? 'bg-slate-50/50' : ''} ${highlight ? 'font-semibold' : ''}`}
                                >
                                    <div className={`px-5 py-3.5 text-sm ${highlight ? 'text-slate-900' : 'text-slate-600'}`}>{label}</div>
                                    <div className="px-5 py-3.5 flex items-center justify-center">
                                        <FeatureCell value={free} />
                                    </div>
                                    <div className="px-5 py-3.5 flex items-center justify-center bg-violet-50/30">
                                        <FeatureCell value={supporter} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* FAQ */}
                    <section className="animate-fade-up max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <p className="text-[11px] font-bold text-violet-600 uppercase tracking-widest mb-2">FAQ</p>
                            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Questions answered</h2>
                        </div>
                        <div className="space-y-3">
                            {[
                                {
                                    q: 'When does Supporter access launch?',
                                    a: 'We are targeting Q4 2026. Early access details will be announced closer to launch.',
                                },
                                {
                                    q: 'Will CCDeals always have a free tier?',
                                    a: 'Yes, absolutely. The core deal-browsing experience will always be free. Supporters get enhanced data and features on top of that.',
                                },
                                {
                                    q: 'Is 15-second refresh really necessary?',
                                    a: 'Flash deals on CC can sell out in under 5 minutes. With a 30-minute cache you will almost always miss them. 15 seconds gives you a real chance.',
                                },
                                {
                                    q: 'How do price drop alerts work?',
                                    a: 'You set a target price on any product. The moment the live feed detects a price drop below that threshold, you get an email. No app required.',
                                },
                                {
                                    q: 'Can I cancel anytime?',
                                    a: 'Yes, no contracts, no lock-in. Cancel from your account settings and you will not be charged again.',
                                },
                            ].map(({ q, a }) => (
                                <details key={q} className="group bg-white rounded-xl border border-slate-200 shadow-xs">
                                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-semibold text-sm text-slate-900 select-none">
                                        {q}
                                        <TbArrowRight size={15} className="shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
                                    </summary>
                                    <p className="px-5 pb-4 text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-3">{a}</p>
                                </details>
                            ))}
                        </div>
                    </section>

                    {/* Final CTA */}
                    <section className="relative overflow-hidden rounded-2xl bg-zinc-950 text-white text-center px-6 py-14 sm:py-16 animate-fade-up">
                        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
                        <div className="absolute inset-0 pointer-events-none"
                            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.22), transparent 70%)' }} />
                        <div className="relative">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 mb-5">
                                <TbHeart size={13} className="text-rose-400" />
                                <span className="text-[11px] font-bold text-rose-300 uppercase tracking-widest">Support the project</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Help keep CCDeals free.
                            </h2>
                            <p className="mt-3 text-zinc-300 text-sm max-w-md mx-auto leading-relaxed">
                                Supporter access is launching Q4 2026. In the meantime, spread the word and keep browsing deals for free.
                            </p>
                            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                                <a
                                    href="/"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-100 transition-all"
                                >
                                    Browse deals now
                                    <TbArrowRight size={15} />
                                </a>
                                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium">
                                    <TbStar size={14} className="text-violet-400" />
                                    Supporter access · Q4 2026
                                </div>
                            </div>
                            <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-zinc-500">
                                <span className="flex items-center gap-1.5"><TbLock size={11} /> No credit card</span>
                                <span className="w-px h-3 bg-zinc-700" />
                                <span className="flex items-center gap-1.5"><TbInfinity size={11} /> Cancel any time</span>
                                <span className="w-px h-3 bg-zinc-700" />
                                <span className="flex items-center gap-1.5"><TbShieldCheck size={11} /> Private &amp; secure</span>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
