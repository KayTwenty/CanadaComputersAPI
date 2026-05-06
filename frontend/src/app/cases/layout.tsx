import type { Metadata } from 'next';
import { breadcrumbJsonLd, categoryMetadata, collectionPageJsonLd, jsonLdScript } from '../lib/seo';

const SLUG = 'cases';
const TITLE = 'PC Case Deals';
const DESCRIPTION =
    'Mid Tower, Full Tower and ITX/mATX cases on sale at Canada Computers, sorted by biggest savings. Updated every 30 minutes.';

export const metadata: Metadata = categoryMetadata({
    slug: SLUG,
    title: TITLE,
    description: DESCRIPTION,
});

const jsonLd = [
    collectionPageJsonLd({ name: TITLE, description: DESCRIPTION, url: `/${SLUG}` }),
    breadcrumbJsonLd([
        { name: 'Home', href: '/' },
        { name: TITLE, href: `/${SLUG}` },
    ]),
];

export default function CasesLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
            {children}
        </>
    );
}
