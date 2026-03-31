import { TbArrowLeft, TbShieldCheck } from 'react-icons/tb';

const LAST_UPDATED = 'March 30, 2026';

export const metadata = {
    title: 'Privacy Policy',
    description: 'Privacy Policy for CCDeals — an unofficial Canada Computers deal tracker.',
    alternates: { canonical: '/privacy' },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-3">
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            <div className="text-sm text-slate-500 leading-relaxed flex flex-col gap-2">{children}</div>
        </section>
    );
}

export default function PrivacyPage() {
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
                <TbShieldCheck size={14} />
                Legal
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h2>
            <p className="mt-2 text-xs text-slate-400">Last updated: {LAST_UPDATED}</p>

            <div className="mt-8 flex flex-col gap-8 divide-y divide-slate-100">

                <Section title="1. Overview">
                    <p>
                        CCDeals is committed to your privacy. This policy explains what data (if any) is collected when you use this website and how it is handled.
                    </p>
                    <p className="font-medium text-slate-700">
                        The short version: we collect nothing. No accounts, no tracking, no analytics, no advertising. The developer makes no profit from this website or its domain name.
                    </p>
                </Section>

                <Section title="2. Information We Do Not Collect">
                    <p className="pt-6">We do not collect, store, or transmit:</p>
                    <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
                        <li>Your name, email address, or any personal identifiers</li>
                        <li>Your IP address or device fingerprint</li>
                        <li>Browsing history or session data</li>
                        <li>Analytics or telemetry of any kind</li>
                        <li>Cookies (none are set by this website)</li>
                    </ul>
                </Section>

                <Section title="3. Location Data">
                    <p className="pt-6">
                        If you choose to share your location to find nearby Canada Computers stores, that data is processed entirely within your browser. It is never sent to CCDeals' servers or any third party. You can revoke location permission at any time through your browser settings.
                    </p>
                </Section>

                <Section title="4. Favourites (localStorage)">
                    <p className="pt-6">
                        Items you save to your favourites are stored using your browser's <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-xs font-mono">localStorage</code>. This data never leaves your device and is not accessible to the CCDeals server or any third party. Clearing your browser's site data will erase your saved favourites.
                    </p>
                </Section>

                <Section title="5. Third-Party Links">
                    <p className="pt-6">
                        CCDeals links to product pages on the Canada Computers website. When you follow those links you are subject to Canada Computers' own privacy policy and terms. CCDeals has no control over and takes no responsibility for their data practices.
                    </p>
                </Section>

                <Section title="6. Product Data">
                    <p className="pt-6">
                        Prices and availability are fetched from publicly accessible pages on the Canada Computers website at regular intervals and cached temporarily on our server solely to serve this website. No user data is stored or logged during this process.
                    </p>
                </Section>

                <Section title="7. Children's Privacy">
                    <p className="pt-6">
                        CCDeals does not knowingly collect any information from anyone, including children under the age of 13.
                    </p>
                </Section>

                <Section title="8. Changes to This Policy">
                    <p className="pt-6">
                        This Privacy Policy may be updated from time to time. The "Last updated" date at the top of this page will reflect any changes. Continued use of CCDeals after an update constitutes acceptance of the revised policy.
                    </p>
                </Section>

                <Section title="9. Contact">
                    <p className="pt-6">
                        If you have any questions about this Privacy Policy, contact the developer at{' '}
                        <a href="https://antton.ca" target="_blank" rel="noreferrer" className="text-violet-600 hover:text-violet-800 font-medium transition-colors">
                            antton.ca
                        </a>.
                    </p>
                </Section>
            </div>
        </div>
    );
}
