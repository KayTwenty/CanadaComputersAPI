import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccdeals.ca';

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();
    return [
        {
            url: SITE_URL,
            lastModified: now,
            changeFrequency: 'hourly',
            priority: 1,
        },
        {
            url: `${SITE_URL}/desktops`,
            lastModified: now,
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/memory`,
            lastModified: now,
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/cpu`,
            lastModified: now,
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/gpu`,
            lastModified: now,
            changeFrequency: 'hourly',
            priority: 0.9,
        },
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
}
