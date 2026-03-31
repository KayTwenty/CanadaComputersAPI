import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'CPU & Processor Deals',
    description:
        'Browse every CPU and processor currently on sale at Canada Computers, sorted by biggest dollar savings. Filter by your nearest store location.',
    alternates: { canonical: '/cpu' },
    openGraph: {
        title: 'CPU & Processor Deals | CCDeals',
        description:
            'Browse every CPU and processor currently on sale at Canada Computers, sorted by biggest dollar savings.',
        url: '/cpu',
    },
    twitter: {
        title: 'CPU & Processor Deals | CCDeals',
        description:
            'Browse every CPU and processor currently on sale at Canada Computers, sorted by biggest dollar savings.',
    },
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'CPU & Processor Deals — CCDeals',
    description: 'CPUs and processors currently on sale at Canada Computers.',
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccdeals.ca'}/cpu`,
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
