'use client';

import { useState } from 'react';
import { TbArrowLeft, TbQuestionMark, TbChevronDown, TbSparkles, TbShieldLock, TbRefresh } from 'react-icons/tb';
import { FAQS } from '../lib/faqs';

function Item({ q, a, idx }: { q: string; a: string; idx: number }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`group rounded-2xl overflow-hidden transition-all duration-200 animate-card-in ${
            open
                ? 'bg-white border border-violet-200 shadow-lg shadow-violet-500/5'
                : 'bg-white border border-slate-200/70 shadow-sm hover:border-slate-300 hover:shadow-md'
        }`} style={{ animationDelay: `${Math.min(idx * 30, 240)}ms` }}>
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
            >
                <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-extrabold tabular-nums transition-colors ${
                    open ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                }`}>
                    {String(idx + 1).padStart(2, '0')}
                </span>
                <span className={`flex-1 text-[14px] font-bold tracking-tight transition-colors ${open ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                    {q}
                </span>
                <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                    open ? 'bg-violet-100 text-violet-600 rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                }`}>
                    <TbChevronDown size={14} />
                </span>
            </button>
            {open && (
                <div className="px-5 pb-5 pt-0 pl-16 animate-fade-up">
                    <p className="text-[13px] text-slate-600 leading-relaxed">{a}</p>
                </div>
            )}
        </div>
    );
}

export default function FaqPage() {
    return (
        <>
            {/* Dark hero */}
            <section className="relative overflow-hidden bg-zinc-950 text-white">
                <div className="absolute inset-0 bg-grid pointer-events-none" />
                <div className="absolute inset-0 bg-spotlight pointer-events-none" />

                <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-10 sm:pt-10 sm:pb-12">
                    <a
                        href="/"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 hover:text-white mb-6 transition-colors group"
                    >
                        <TbArrowLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
                        Back to all deals
                    </a>

                    <div className="flex items-start gap-4">
                        <span className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-violet-500/20 to-fuchsia-500/10 ring-1 ring-violet-500/30 flex items-center justify-center text-violet-300 shadow-lg shadow-violet-500/10">
                            <TbQuestionMark size={26} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight animate-fade-up">
                                Frequently Asked Questions
                            </h1>
                            <p className="mt-2 text-zinc-400 text-sm sm:text-base max-w-xl animate-fade-up" style={{ animationDelay: '40ms' }}>
                                Everything you need to know about how CCDeals works — privacy, pricing, refresh cadence and more.
                            </p>

                            {/* Meta strip */}
                            <div className="mt-4 flex items-center gap-2 flex-wrap text-[11px] animate-fade-up" style={{ animationDelay: '80ms' }}>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-200">
                                    <TbSparkles size={12} className="text-violet-400" />
                                    <span className="font-semibold">{FAQS.length} questions answered</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                                    <TbShieldLock size={12} />
                                    <span className="font-semibold">Privacy-first</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/60 border border-zinc-700/50 text-zinc-400">
                                    <TbRefresh size={12} />
                                    <span>Updates every 30 min</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="bg-slate-50 flex-1">
                <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">
                    <div className="flex flex-col gap-3">
                        {FAQS.map((item, idx) => (
                            <Item key={item.q} q={item.q} a={item.a} idx={idx} />
                        ))}
                    </div>

                    {/* Contact CTA */}
                    <div className="mt-10 relative overflow-hidden rounded-2xl bg-zinc-950 text-white px-6 py-7 text-center">
                        <div className="absolute inset-0 bg-grid pointer-events-none opacity-50" />
                        <div className="absolute inset-0 bg-spotlight pointer-events-none" />
                        <div className="relative">
                            <p className="text-sm font-bold text-white">Still have a question?</p>
                            <p className="text-xs text-zinc-400 mt-1 mb-4">Reach out and the developer will get back to you.</p>
                            <a
                                href="https://antton.ca"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-4 py-2 rounded-full shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] transition-all"
                            >
                                Contact the developer
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
