import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccdeals.ca';

const CATEGORIES = [
    'desktops',
    'laptops',
    'cpu',
    'gpu',
    'memory',
    'motherboards',
    'drives',
    'psu',
    'coolers',
    'cases',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();

    const home: MetadataRoute.Sitemap[number] = {
        url: SITE_URL,
        lastModified: now,
        changeFrequency: 'hourly',
        priority: 1,
    };

    const categories: MetadataRoute.Sitemap = CATEGORIES.map((slug) => ({
        url: `${SITE_URL}/${slug}`,
        lastModified: now,
        changeFrequency: 'hourly',
        priority: 0.9,
    }));

    const utility: MetadataRoute.Sitemap = [
        {
            url: `${SITE_URL}/favorites`,
            lastModified: now,
            changeFrequency: 'never',
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/faq`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${SITE_URL}/terms`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/privacy`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    return [home, ...categories, ...utility];
}
