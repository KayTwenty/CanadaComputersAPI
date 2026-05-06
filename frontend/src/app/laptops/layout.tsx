import type { Metadata } from 'next';
import { breadcrumbJsonLd, categoryMetadata, collectionPageJsonLd, jsonLdScript } from '../lib/seo';

const SLUG = 'laptops';
const TITLE = 'Laptop Deals';
const DESCRIPTION =
    'Windows, Business and Gaming laptops on sale at Canada Computers. Filter by type, brand or savings. Updated every 30 minutes.';

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

export default function LaptopsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
            {children}
        </>
    );
}
