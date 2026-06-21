'use client';

import {
    TbFlame, TbBrandGoogle, TbBrandApple, TbLock,
    TbMail, TbSparkles, TbBell, TbHeart, TbChartLine,
} from 'react-icons/tb';

const HIGHLIGHTS = [
    { icon: TbHeart,     label: 'Save favourites' },
    { icon: TbBell,      label: 'Price-drop alerts' },
    { icon: TbChartLine, label: 'Full price history' },
] as const;

export default function SignInPage() {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-zinc-950 relative flex items-center justify-center px-4 py-16 overflow-hidden">

            {/* Grid + spotlight — matches landing hero */}
            <div className="absolute inset-0 bg-grid pointer-events-none" />
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124,58,237,0.18), transparent 65%)' }} />
            <div className="absolute -top-20 left-1/4 w-96 h-96 rounded-full bg-violet-700/10 blur-3xl pointer-events-none" />
            <div className="absolute -top-20 right-1/4 w-96 h-96 rounded-full bg-fuchsia-700/10 blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-3xl">

                {/* Card */}
                <div className="relative bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-zinc-800 shadow-2xl shadow-black/50 overflow-hidden">

                    {/* Top accent line */}
                    <div className="h-1 w-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-orange-500" />

                    <div className="grid md:grid-cols-2">

                        {/* ── Left rail — brand / pitch ── */}
                        <div className="relative hidden md:flex flex-col justify-between p-8 lg:p-10 bg-linear-to-br from-zinc-900 to-zinc-950 border-r border-zinc-800/80 overflow-hidden">
                            <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
                            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

                            <div className="relative">
                                {/* Logo */}
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-linear-to-br from-violet-500 via-fuchsia-500 to-orange-500 shadow-lg shadow-violet-500/30 mb-6">
                                    <TbFlame size={24} className="text-white" />
                                </div>

                                <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
                                    Welcome to
                                    <br />
                                    <span className="text-brand-gradient">CCDeals</span>
                                </h1>
                                <p className="text-sm text-zinc-400 mt-3 leading-relaxed max-w-60">
                                    Create a free account to unlock the full experience.
                                </p>

                                {/* Highlights */}
                                <ul className="mt-8 space-y-3">
                                    {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                                        <li key={label} className="flex items-center gap-3 text-sm text-zinc-300">
                                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 shrink-0">
                                                <Icon size={15} className="text-violet-400" />
                                            </span>
                                            {label}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Coming soon chip */}
                            <div className="relative mt-10 inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25">
                                <TbSparkles size={13} className="text-violet-400" />
                                <span className="text-[11px] font-bold text-violet-300 uppercase tracking-widest">
                                    Launching Q4 2026
                                </span>
                            </div>
                        </div>

                        {/* ── Right — auth form ── */}
                        <div className="p-8 lg:p-10">

                            {/* Mobile logo (left rail hidden on small screens) */}
                            <div className="md:hidden flex items-center gap-3 mb-7">
                                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 via-fuchsia-500 to-orange-500 shadow-lg shadow-violet-500/30">
                                    <TbFlame size={20} className="text-white" />
                                </span>
                                <div>
                                    <p className="text-base font-extrabold text-white leading-none">Sign in to CCDeals</p>
                                    <p className="text-xs text-violet-300 font-semibold mt-1">Launching Q4 2026</p>
                                </div>
                            </div>

                            <div className="hidden md:block mb-7">
                                <h2 className="text-xl font-extrabold text-white tracking-tight">Sign in</h2>
                                <p className="text-sm text-zinc-500 mt-1">Welcome back. Pick how you&apos;d like to continue.</p>
                            </div>

                            {/* SSO buttons */}
                            <div className="space-y-2.5">
                                <SsoButton icon={TbBrandGoogle} label="Continue with Google" />
                                <SsoButton icon={TbBrandApple} label="Continue with Apple" />
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-3 my-6">
                                <div className="flex-1 h-px bg-zinc-800" />
                                <span className="text-[11px] text-zinc-600 font-medium uppercase tracking-widest">or</span>
                                <div className="flex-1 h-px bg-zinc-800" />
                            </div>

                            {/* Email + password */}
                            <fieldset disabled className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-500 mb-1.5">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <TbMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-700 pointer-events-none" />
                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950/60 text-zinc-400 placeholder:text-zinc-700 text-sm outline-none cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-semibold text-zinc-500">
                                            Password
                                        </label>
                                        <span className="text-xs text-zinc-700 font-medium">Forgot?</span>
                                    </div>
                                    <div className="relative">
                                        <TbLock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-700 pointer-events-none" />
                                        <input
                                            type="password"
                                            placeholder="••••••••••"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950/60 text-zinc-400 placeholder:text-zinc-700 text-sm outline-none cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 text-white/70 text-sm font-bold opacity-60 cursor-not-allowed select-none"
                                >
                                    <TbLock size={15} />
                                    Sign In
                                </button>
                            </fieldset>

                            {/* Coming soon note */}
                            <div className="mt-6 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                                <TbSparkles size={14} className="text-violet-400 shrink-0" />
                                <p className="text-xs text-zinc-400 text-center">
                                    Accounts arrive <span className="text-violet-300 font-semibold">Q4 2026</span>. Browsing stays free.
                                </p>
                            </div>

                            <p className="text-center text-xs text-zinc-600 mt-5">
                                Don&apos;t have an account?{' '}
                                <span className="text-zinc-500 font-medium">Sign up coming soon</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Below-card note */}
                <p className="text-center text-xs text-zinc-500 mt-5">
                    Interested in early access?{' '}
                    <a href="/support" className="text-violet-400 font-semibold hover:underline">
                        Learn about Supporter access
                    </a>
                </p>
            </div>
        </div>
    );
}

function SsoButton({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string }) {
    return (
        <button
            disabled
            className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950/40 text-zinc-400 text-sm font-semibold cursor-not-allowed select-none transition-colors"
        >
            <Icon size={18} className="text-zinc-500 shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/25 px-2 py-0.5 rounded-full shrink-0">
                Soon
            </span>
        </button>
    );
}
