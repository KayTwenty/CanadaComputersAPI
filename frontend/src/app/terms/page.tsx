import type { Metadata } from 'next';
import { TbFileText, TbScale, TbAlertTriangle, TbInfoCircle } from 'react-icons/tb';
import { breadcrumbJsonLd, categoryMetadata, jsonLdScript } from '../lib/seo';

const LAST_UPDATED = 'March 30, 2026';

export const metadata: Metadata = categoryMetadata({
    slug: 'terms',
    title: 'Terms of Service',
    description:
        'Terms of Service for CCDeals, an unofficial Canada Computers deal tracker. Always verify prices before buying.',
});

const jsonLd = breadcrumbJsonLd([
    { name: 'Home', href: '/' },
    { name: 'Terms of Service', href: '/terms' },
]);

const SECTIONS: { title: string; body: React.ReactNode }[] = [
    {
        title: 'About CCDeals',
        body: (
            <>
                <p>
                    CCDeals is a free, independent price-tracking tool that aggregates publicly available sale data from the Canada Computers &amp; Electronics website. It is operated by an individual developer and is not affiliated with, endorsed by, or sponsored by Canada Computers &amp; Electronics Ltd. in any way.
                </p>
                <p className="font-medium text-slate-700">
                    The developer makes no profit from this website or its domain name. CCDeals is provided entirely free of charge with no advertising, subscription fees, or monetisation of any kind.
                </p>
            </>
        ),
    },
    {
        title: 'Acceptance of Terms',
        body: (
            <p>
                By accessing or using CCDeals you agree to these Terms of Service. If you do not agree, please stop using the website.
            </p>
        ),
    },
    {
        title: 'Accuracy of Information',
        body: (
            <>
                <p>
                    Prices, availability, and product details are scraped automatically every 30 minutes from publicly accessible pages and may not reflect the current state of Canada Computers&apos; website at any given moment. CCDeals makes no warranties, express or implied, regarding the accuracy, completeness, or timeliness of any information displayed.
                </p>
                <p>
                    Always verify pricing and availability directly on the Canada Computers website or in store before making a purchase decision. CCDeals is not responsible for any loss arising from reliance on information shown on this site.
                </p>
                <p>
                    Member pricing, loyalty discounts, and account-specific promotions are not considered and will not be reflected.
                </p>
            </>
        ),
    },
    {
        title: 'Intellectual Property',
        body: (
            <p>
                Product names, images, trademarks, and pricing data belong to their respective owners, including Canada Computers &amp; Electronics Ltd. and the original manufacturers. CCDeals does not claim ownership over any third-party content displayed on this site.
            </p>
        ),
    },
    {
        title: 'No Warranty',
        body: (
            <p>
                CCDeals is provided &quot;as is&quot; without warranty of any kind. The developer does not guarantee uninterrupted or error-free operation of the service and may modify or discontinue it at any time without notice.
            </p>
        ),
    },
    {
        title: 'Limitation of Liability',
        body: (
            <p>
                To the fullest extent permitted by applicable law, the developer shall not be liable for any direct, indirect, incidental, or consequential damages arising out of your use of or inability to use CCDeals.
            </p>
        ),
    },
    {
        title: 'Changes to These Terms',
        body: (
            <p>
                These Terms may be updated at any time. Continued use of the website after changes are posted constitutes acceptance of the revised Terms.
            </p>
        ),
    },
    {
        title: 'Contact',
        body: (
            <p>
                Questions about these Terms can be directed to the developer at{' '}
                <a href="https://antton.ca" target="_blank" rel="noreferrer" className="text-violet-600 hover:text-violet-700 font-semibold transition-colors">
                    antton.ca
                </a>.
            </p>
        ),
    },
];

export default function TermsPage() {
    return (
        <div className="flex-1 flex flex-col">
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
            {/* Dark hero */}
            <section className="relative bg-zinc-950 text-white overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-50" />
                <div className="absolute inset-0 bg-spotlight" />
                <div className="relative max-w-4xl mx-auto w-full px-4 sm:px-6 pt-10 sm:pt-14 pb-10 sm:pb-12">
                    <div className="flex items-start gap-4 sm:gap-5">
                        <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br from-violet-500/20 to-fuchsia-500/10 ring-1 ring-violet-500/30 flex items-center justify-center">
                            <TbFileText size={30} className="text-violet-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-violet-300/80 mb-2">
                                Legal
                            </p>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                Terms of Service
                            </h1>
                            <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl">
                                CCDeals is a free, independent tool. Always verify prices on Canada Computers before buying.
                            </p>
                        </div>
                    </div>

                    {/* Meta strip */}
                    <div className="mt-7 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-300 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                            <TbScale size={12} className="text-violet-300" />
                            Independent
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-300 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                            <TbInfoCircle size={12} className="text-violet-300" />
                            Not affiliated with Canada Computers
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-300 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                            <TbAlertTriangle size={12} className="text-amber-300" />
                            Provided as-is
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                            Updated {LAST_UPDATED}
                        </span>
                    </div>
                </div>
            </section>

            {/* Sections */}
            <div className="bg-slate-50 flex-1">
                <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-3">
                    {SECTIONS.map((s, i) => (
                        <article
                            key={s.title}
                            className="group rounded-2xl bg-white border border-slate-200/70 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200 px-5 sm:px-6 py-5 sm:py-6 animate-card-in"
                            style={{ animationDelay: `${Math.min(i * 30, 240)}ms` }}
                        >
                            <div className="flex items-start gap-4">
                                <span className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600 flex items-center justify-center text-[11px] font-extrabold tabular-nums transition-colors">
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                                        {s.title}
                                    </h2>
                                    <div className="mt-2 text-sm text-slate-600 leading-relaxed flex flex-col gap-2">
                                        {s.body}
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}

                    {/* Sister doc CTA */}
                    <div className="mt-6 rounded-2xl bg-zinc-950 text-white px-5 sm:px-7 py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid opacity-30" />
                        <div className="relative">
                            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-violet-300/80">Also relevant</p>
                            <p className="mt-1 text-base sm:text-lg font-bold tracking-tight">Read the Privacy Policy</p>
                            <p className="mt-1 text-sm text-zinc-400">No tracking, no analytics, no cookies.</p>
                        </div>
                        <a
                            href="/privacy"
                            className="relative inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white text-sm font-semibold px-5 py-2.5 shadow-md shadow-violet-500/30 transition-all"
                        >
                            View Privacy
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
