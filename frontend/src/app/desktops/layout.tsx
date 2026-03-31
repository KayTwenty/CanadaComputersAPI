import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Desktop Deals',
    description:
        'Browse every prebuilt desktop currently on sale at Canada Computers, sorted by biggest dollar savings. Filter by your nearest store location.',
    alternates: { canonical: '/desktops' },
    openGraph: {
        title: 'Desktop Deals | CCDeals',
        description:
            'Browse every prebuilt desktop currently on sale at Canada Computers, sorted by biggest dollar savings.',
        url: '/desktops',
    },
    twitter: {
        title: 'Desktop Deals | CCDeals',
        description:
            'Browse every prebuilt desktop currently on sale at Canada Computers, sorted by biggest dollar savings.',
    },
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Desktop Deals — CCDeals',
    description: 'Prebuilt desktop computers currently on sale at Canada Computers.',
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccdeals.ca'}/desktops`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
        </>
    );
}
