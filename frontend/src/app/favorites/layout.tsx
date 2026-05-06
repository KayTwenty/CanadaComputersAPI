import type { Metadata } from 'next';
import { breadcrumbJsonLd, categoryMetadata, jsonLdScript } from '../lib/seo';

const SLUG = 'favorites';
const TITLE = 'Your Favourites';
const DESCRIPTION =
    'Your saved Canada Computers deals. Stored locally in your browser, never sent to our servers.';

export const metadata: Metadata = {
    ...categoryMetadata({
        slug: SLUG,
        title: TITLE,
        description: DESCRIPTION,
    }),
    robots: { index: false, follow: true },
};

const jsonLd = breadcrumbJsonLd([
    { name: 'Home', href: '/' },
    { name: 'Favourites', href: `/${SLUG}` },
]);

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
            {children}
        </>
    );
}
