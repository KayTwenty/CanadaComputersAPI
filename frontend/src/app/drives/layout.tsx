import type { Metadata } from 'next';
import { breadcrumbJsonLd, categoryMetadata, collectionPageJsonLd, jsonLdScript } from '../lib/seo';

const SLUG = 'drives';
const TITLE = 'SSD & Hard Drive Deals';
const DESCRIPTION =
    'SSDs and hard drives on sale at Canada Computers, sorted by biggest savings. NVMe, SATA and external storage. Updated every 30 minutes.';

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

export default function DrivesLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
            {children}
        </>
    );
}
