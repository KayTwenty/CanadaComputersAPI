import type { Metadata } from 'next';

export const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccdeals.ca';
export const SITE_NAME = 'CCDeals';

export interface CategorySeo {
    /** Path segment, e.g. "desktops" */
    slug: string;
    /** Page H1 / metadata title (without site suffix) */
    title: string;
    /** Plain text description for <meta> + OG */
    description: string;
    /** Optional OG image override */
    ogImage?: string;
}

export function categoryMetadata({
    slug,
    title,
    description,
    ogImage,
}: CategorySeo): Metadata {
    const url = `${SITE_URL}/${slug}`;
    const image = ogImage ?? '/opengraph-image';
    return {
        title,
        description,
        alternates: { canonical: `/${slug}` },
        openGraph: {
            type: 'website',
            locale: 'en_CA',
            siteName: SITE_NAME,
            url,
            title: `${title} | ${SITE_NAME}`,
            description,
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: `${title} | ${SITE_NAME}`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${title} | ${SITE_NAME}`,
            description,
            images: [image],
        },
    };
}

export interface BreadcrumbItem {
    name: string;
    /** Path starting with "/", or absolute URL */
    href: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((it, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: it.name,
            item: it.href.startsWith('http') ? it.href : `${SITE_URL}${it.href}`,
        })),
    };
}

export interface CollectionSeo {
    name: string;
    description: string;
    url: string;
}

export function collectionPageJsonLd({ name, description, url }: CollectionSeo) {
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name,
        description,
        url: url.startsWith('http') ? url : `${SITE_URL}${url}`,
        isPartOf: {
            '@type': 'WebSite',
            name: SITE_NAME,
            url: SITE_URL,
        },
    };
}

export function jsonLdScript(data: object | object[]) {
    return {
        __html: JSON.stringify(data),
    };
}
