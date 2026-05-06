import type { Metadata } from 'next';
import { TbShieldCheck, TbLock, TbEyeOff, TbDatabaseOff } from 'react-icons/tb';
import { breadcrumbJsonLd, categoryMetadata, jsonLdScript } from '../lib/seo';

const LAST_UPDATED = 'March 30, 2026';

export const metadata: Metadata = categoryMetadata({
    slug: 'privacy',
    title: 'Privacy Policy',
    description:
        'Privacy Policy for CCDeals, an unofficial Canada Computers deal tracker. No accounts, no tracking, no analytics.',
});

const jsonLd = breadcrumbJsonLd([
    { name: 'Home', href: '/' },
    { name: 'Privacy Policy', href: '/privacy' },
]);

const SECTIONS: { title: string; body: React.ReactNode }[] = [
    {
        title: 'Overview',
        body: (
            <>
                <p>
                    CCDeals is committed to your privacy. This policy explains what data (if any) is collected when you use this website and how it is handled.
                </p>
                <p className="font-medium text-slate-700">
                    The short version: we collect nothing. No accounts, no tracking, no analytics, no advertising. The developer makes no profit from this website or its domain name.
                </p>
            </>
        ),
    },
    {
        title: 'Information We Do Not Collect',
        body: (
            <>
                <p>We do not collect, store, or transmit:</p>
                <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
                    <li>Your name, email address, or any personal identifiers</li>
                    <li>Your IP address or device fingerprint</li>
                    <li>Browsing history or session data</li>
                    <li>Analytics or telemetry of any kind</li>
                    <li>Cookies (none are set by this website)</li>
                </ul>
            </>
        ),
    },
    {
        title: 'Location Data',
        body: (
            <p>
                If you choose to share your location to find nearby Canada Computers stores, that data is processed entirely within your browser. It is never sent to CCDeals&apos; servers or any third party. You can revoke location permission at any time through your browser settings.
            </p>
        ),
    },
    {
        title: 'Favourites (localStorage)',
        body: (
            <p>
                Items you save to your favourites are stored using your browser&apos;s <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">localStorage</code>. This data never leaves your device and is not accessible to the CCDeals server or any third party. Clearing your browser&apos;s site data will erase your saved favourites.
            </p>
        ),
    },
    {
        title: 'Third-Party Links',
        body: (
            <p>
                CCDeals links to product pages on the Canada Computers website. When you follow those links you are subject to Canada Computers&apos; own privacy policy and terms. CCDeals has no control over and takes no responsibility for their data practices.
            </p>
        ),
    },
    {
        title: 'Product Data',
        body: (
            <p>
                Prices and availability are fetched from publicly accessible pages on the Canada Computers website at regular intervals and cached temporarily on our server solely to serve this website. No user data is stored or logged during this process.
            </p>
        ),
    },
    {
        title: "Children's Privacy",
        body: (
            <p>
                CCDeals does not knowingly collect any information from anyone, including children under the age of 13.
            </p>
        ),
    },
    {
        title: 'Changes to This Policy',
        body: (
            <p>
                This Privacy Policy may be updated from time to time. The &quot;Last updated&quot; date at the top of this page will reflect any changes. Continued use of CCDeals after an update constitutes acceptance of the revised policy.
            </p>
        ),
    },
    {
        title: 'Contact',
        body: (
            <p>
                If you have any questions about this Privacy Policy, contact the developer at{' '}
                <a href="https://antton.ca" target="_blank" rel="noreferrer" className="text-violet-600 hover:text-violet-700 font-semibold transition-colors">
                    antton.ca
                </a>.
            </p>
        ),
    },
];

export default function PrivacyPage() {
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
                            <TbShieldCheck size={30} className="text-violet-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-violet-300/80 mb-2">
                                Legal
                            </p>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                Privacy Policy
                            </h1>
                            <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl">
                                We collect nothing. No accounts, no tracking, no analytics, no cookies. Here&apos;s the long version.
                            </p>
                        </div>
                    </div>

                    {/* Meta strip */}
                    <div className="mt-7 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-300 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                            <TbEyeOff size={12} className="text-violet-300" />
                            Zero tracking
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-300 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                            <TbDatabaseOff size={12} className="text-violet-300" />
                            No cookies
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-300 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                            <TbLock size={12} className="text-emerald-300" />
                            Data stays local
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
                            <p className="mt-1 text-base sm:text-lg font-bold tracking-tight">Read the Terms of Service</p>
                            <p className="mt-1 text-sm text-zinc-400">The fine print on accuracy, IP, and liability.</p>
                        </div>
                        <a
                            href="/terms"
                            className="relative inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white text-sm font-semibold px-5 py-2.5 shadow-md shadow-violet-500/30 transition-all"
                        >
                            View Terms
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
