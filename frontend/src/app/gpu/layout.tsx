import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'GPU & Graphics Card Deals',
    description:
        'Browse every graphics card currently on sale at Canada Computers, sorted by biggest dollar savings. Filter by your nearest store location.',
    alternates: { canonical: '/gpu' },
    openGraph: {
        title: 'GPU & Graphics Card Deals | CCDeals',
        description:
            'Browse every graphics card currently on sale at Canada Computers, sorted by biggest dollar savings.',
        url: '/gpu',
    },
    twitter: {
        title: 'GPU & Graphics Card Deals | CCDeals',
        description:
            'Browse every graphics card currently on sale at Canada Computers, sorted by biggest dollar savings.',
    },
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'GPU & Graphics Card Deals — CCDeals',
    description: 'Graphics cards currently on sale at Canada Computers.',
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccdeals.ca'}/gpu`,
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
