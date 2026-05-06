import type { Metadata } from 'next';
import { breadcrumbJsonLd, categoryMetadata, collectionPageJsonLd, jsonLdScript } from '../lib/seo';

const SLUG = 'psu';
const TITLE = 'Power Supply Deals';
const DESCRIPTION =
    'Modular and non-modular PSUs from trusted brands on sale at Canada Computers. Updated every 30 minutes.';

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

export default function PsuLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
            {children}
        </>
    );
}
