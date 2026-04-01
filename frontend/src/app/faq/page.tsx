'use client';

import { useState } from 'react';
import { TbArrowLeft, TbQuestionMark, TbChevronDown } from 'react-icons/tb';

const FAQS = [
    {
        q: 'What is CCDeals?',
        a: 'CCDeals is an unofficial deal tracker for Canada Computers. It automatically scrapes sale prices across desktops, memory, CPUs, and GPUs every 30 minutes so you can quickly spot the best savings without browsing the full catalogue.',
    },
    {
        q: 'Is this affiliated with Canada Computers?',
        a: 'No. CCDeals is an independent, community-built tool and has no affiliation with Canada Computers & Electronics Ltd. All product data is publicly available on their website.',
    },
    {
        q: 'How often are prices updated?',
        a: 'Prices and availability are refreshed every 30 minutes automatically. You can see exactly how long ago each category was last updated on both the home page and category pages.',
    },
    {
        q: 'Does this show member pricing?',
        a: 'No. CCDeals shows publicly listed sale prices only. It does not have access to your Canada Computers account and will not display member-exclusive pricing.',
    },
    {
        q: 'How does the store filter work?',
        a: 'Click the store picker in the top navigation bar and allow location access (or pick a store manually) to filter deals by in-store availability at your nearest Canada Computers location. Your location is never sent to any server. It stays entirely in your browser.',
    },
    {
        q: 'Does CCDeals collect any of my data?',
        a: 'No. There is no user account system, no analytics, and no tracking. Your location, favourites, and browsing history never leave your device. Favourites are saved locally in your browser\'s localStorage.',
    },
    {
        q: 'What does the "You save" amount mean?',
        a: 'It reflects the difference between the regular (non-sale) price listed on Canada Computers\' website and the current sale price at the time of the last updated price.',
    },
    {
        q: 'Can I save deals to come back to later?',
        a: 'Yes! Tap the heart icon on any product card to save it to your Favourites. Saved items are stored locally in your browser and are accessible from the Favourites page in the navigation bar.',
    },
    {
        q: 'How do I share a deal?',
        a: 'Each card has a share button. On mobile it uses the native share sheet; on desktop it copies the product link to your clipboard.',
    },
    {
        q: 'Why is a product showing as unavailable?',
        a: 'Availability reflects the status at the time of the last 30-minute update. Stock can change faster than that. Always check the product page on Canada Computers directly before making a trip.',
    },
    {
        q: 'How do I request a feature?',
        a: 'At the current time, there is no way to submit feature requests.',
    }
];

function Item({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`border rounded-xl overflow-hidden transition-colors duration-200 ${open ? 'border-violet-200 bg-violet-50/30' : 'border-slate-200/80 bg-white'}`}>
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between gap-4 px-5 py-3.5 text-left hover:bg-slate-50/60 transition-colors"
            >
                <span className="text-[13px] font-semibold text-slate-800">{q}</span>
                <TbChevronDown
                    size={15}
                    className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-violet-500' : 'text-slate-400'}`}
                />
            </button>
            {open && (
                <div className="px-5 pb-4 pt-0">
                    <p className="text-[13px] text-slate-500 leading-relaxed">{a}</p>
                </div>
            )}
        </div>
    );
}

export default function FaqPage() {
    return (
        <>
            {/* Hero header */}
            <div className="border-b border-slate-200/60 bg-linear-to-b from-violet-50/50 to-white">
                <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                    <a
                        href="/"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 mb-4 transition-colors"
                    >
                        <TbArrowLeft size={12} />
                        Back to highlights
                    </a>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                            <TbQuestionMark size={20} className="text-violet-600" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                                Frequently Asked Questions
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Everything you need to know about how CCDeals works.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
                <div className="flex flex-col gap-2.5">
                    {FAQS.map((item) => (
                        <Item key={item.q} q={item.q} a={item.a} />
                    ))}
                </div>

                <p className="mt-10 text-xs text-slate-400 text-center">
                    Still have a question?{' '}
                    <a
                        href="https://antton.ca"
                        target="_blank"
                        rel="noreferrer"
                        className="text-violet-600 hover:text-violet-800 font-medium transition-colors"
                    >
                        Reach out to the developer.
                    </a>
                </p>
            </div>
        </>
    );
}
