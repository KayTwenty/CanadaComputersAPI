import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'RAM & Memory Deals',
    description:
        'Browse every RAM and memory kit currently on sale at Canada Computers, sorted by biggest dollar savings. Filter by your nearest store location.',
    alternates: { canonical: '/memory' },
    openGraph: {
        title: 'RAM & Memory Deals | CCDeals',
        description:
            'Browse every RAM and memory kit currently on sale at Canada Computers, sorted by biggest dollar savings.',
        url: '/memory',
    },
    twitter: {
        title: 'RAM & Memory Deals | CCDeals',
        description:
            'Browse every RAM and memory kit currently on sale at Canada Computers, sorted by biggest dollar savings.',
    },
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'RAM & Memory Deals — CCDeals',
    description: 'RAM and memory kits currently on sale at Canada Computers.',
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccdeals.ca'}/memory`,
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
