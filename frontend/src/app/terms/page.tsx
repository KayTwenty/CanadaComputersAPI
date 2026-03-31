import { TbArrowLeft, TbFileText } from 'react-icons/tb';

const LAST_UPDATED = 'March 30, 2026';

export const metadata = {
    title: 'Terms of Service',
    description: 'Terms of Service for CCDeals — an unofficial Canada Computers deal tracker.',
    alternates: { canonical: '/terms' },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-3">
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            <div className="text-sm text-slate-500 leading-relaxed flex flex-col gap-2">{children}</div>
        </section>
    );
}

export default function TermsPage() {
    return (
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 pt-8 sm:pt-12 pb-16 flex-1">
            <a
                href="/"
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-700 mb-3 transition-colors"
            >
                <TbArrowLeft size={13} />
                Back to highlights
            </a>

            <p className="text-sm font-semibold text-violet-600 mb-1 flex items-center gap-1.5">
                <TbFileText size={14} />
                Legal
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h2>
            <p className="mt-2 text-xs text-slate-400">Last updated: {LAST_UPDATED}</p>

            <div className="mt-8 flex flex-col gap-8 divide-y divide-slate-100">

                <Section title="1. About CCDeals">
                    <p>
                        CCDeals is a free, independent price-tracking tool that aggregates publicly available sale data from the Canada Computers &amp; Electronics website. It is operated by an individual developer and is not affiliated with, endorsed by, or sponsored by Canada Computers &amp; Electronics Ltd. in any way.
                    </p>
                    <p className="font-medium text-slate-700">
                        The developer makes no profit from this website or its domain name. CCDeals is provided entirely free of charge with no advertising, subscription fees, or monetisation of any kind.
                    </p>
                </Section>

                <Section title="2. Acceptance of Terms">
                    <p className="pt-6">
                        By accessing or using CCDeals you agree to these Terms of Service. If you do not agree, please stop using the website.
                    </p>
                </Section>

                <Section title="3. Accuracy of Information">
                    <p className="pt-6">
                        Prices, availability, and product details are scraped automatically every 30 minutes from publicly accessible pages and may not reflect the current state of Canada Computers' website at any given moment. CCDeals makes no warranties — express or implied — regarding the accuracy, completeness, or timeliness of any information displayed.
                    </p>
                    <p>
                        Always verify pricing and availability directly on the Canada Computers website or in store before making a purchase decision. CCDeals is not responsible for any loss arising from reliance on information shown on this site.
                    </p>
                    <p>
                        Member pricing, loyalty discounts, and account-specific promotions are not considered and will not be reflected.
                    </p>
                </Section>

                <Section title="4. Intellectual Property">
                    <p className="pt-6">
                        Product names, images, trademarks, and pricing data belong to their respective owners, including Canada Computers &amp; Electronics Ltd. and the original manufacturers. CCDeals does not claim ownership over any third-party content displayed on this site.
                    </p>
                </Section>

                <Section title="5. No Warranty">
                    <p className="pt-6">
                        CCDeals is provided "as is" without warranty of any kind. The developer does not guarantee uninterrupted or error-free operation of the service and may modify or discontinue it at any time without notice.
                    </p>
                </Section>

                <Section title="6. Limitation of Liability">
                    <p className="pt-6">
                        To the fullest extent permitted by applicable law, the developer shall not be liable for any direct, indirect, incidental, or consequential damages arising out of your use of or inability to use CCDeals.
                    </p>
                </Section>

                <Section title="7. Changes to These Terms">
                    <p className="pt-6">
                        These Terms may be updated at any time. Continued use of the website after changes are posted constitutes acceptance of the revised Terms.
                    </p>
                </Section>

                <Section title="8. Contact">
                    <p className="pt-6">
                        Questions about these Terms can be directed to the developer at{' '}
                        <a href="https://antton.ca" target="_blank" rel="noreferrer" className="text-violet-600 hover:text-violet-800 font-medium transition-colors">
                            antton.ca
                        </a>.
                    </p>
                </Section>
            </div>
        </div>
    );
}
