import type { Metadata } from 'next';
import { FAQS, faqPageJsonLd } from '../lib/faqs';
import { breadcrumbJsonLd, categoryMetadata, jsonLdScript } from '../lib/seo';

const SLUG = 'faq';
const TITLE = 'Frequently Asked Questions';
const DESCRIPTION =
    'Answers about how CCDeals tracks Canada Computers prices, store filtering, favourites, privacy and more.';

export const metadata: Metadata = categoryMetadata({
    slug: SLUG,
    title: TITLE,
    description: DESCRIPTION,
});

const jsonLd = [
    faqPageJsonLd(FAQS),
    breadcrumbJsonLd([
        { name: 'Home', href: '/' },
        { name: 'FAQ', href: `/${SLUG}` },
    ]),
];

export default function FaqLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
            {children}
        </>
    );
}
