import type { Metadata } from 'next';
import { breadcrumbJsonLd, categoryMetadata, collectionPageJsonLd, jsonLdScript } from '../lib/seo';

const SLUG = 'desktops';
const TITLE = 'Desktop Deals';
const DESCRIPTION =
    'Every prebuilt desktop on sale at Canada Computers, sorted by biggest savings. Filter by brand and store availability. Updated every 30 minutes.';

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

export default function DesktopsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
            {children}
        </>
    );
}
