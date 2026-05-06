export interface FaqEntry {
    q: string;
    a: string;
}

export const FAQS: FaqEntry[] = [
    {
        q: 'What is CCDeals?',
        a: 'CCDeals is an unofficial deal tracker for Canada Computers. It automatically scrapes sale prices across desktops, memory, CPUs, and GPUs every 30 minutes so you can quickly spot the best savings without browsing the full catalogue.',
    },
    {
        q: 'Is this affiliated with Canada Computers?',
        a: 'No. CCDeals is an independent, community-built tool and has no affiliation with Canada Computers & Electronics Ltd. All product data is publicly available on their website.',
    },
    {
        q: 'How often are prices updated?',
        a: 'Prices and availability are refreshed every 30 minutes automatically. You can see exactly how long ago each category was last updated on both the home page and category pages.',
    },
    {
        q: 'Does this show member pricing?',
        a: 'No. CCDeals shows publicly listed sale prices only. It does not have access to your Canada Computers account and will not display member-exclusive pricing.',
    },
    {
        q: 'How does the store filter work?',
        a: 'Click the store picker in the top navigation bar and allow location access (or pick a store manually) to filter deals by in-store availability at your nearest Canada Computers location. Your location is never sent to any server. It stays entirely in your browser.',
    },
    {
        q: 'Does CCDeals collect any of my data?',
        a: 'No. There is no user account system, no analytics, and no tracking. Your location, favourites, and browsing history never leave your device. Favourites are saved locally in your browser\'s localStorage.',
    },
    {
        q: 'What does the "You save" amount mean?',
        a: 'It reflects the difference between the regular (non-sale) price listed on Canada Computers\' website and the current sale price at the time of the last updated price.',
    },
    {
        q: 'Can I save deals to come back to later?',
        a: 'Yes! Tap the heart icon on any product card to save it to your Favourites. Saved items are stored locally in your browser and are accessible from the Favourites page in the navigation bar.',
    },
    {
        q: 'How do I share a deal?',
        a: 'Each card has a share button. On mobile it uses the native share sheet; on desktop it copies the product link to your clipboard.',
    },
    {
        q: 'Why is a product showing as unavailable?',
        a: 'Availability reflects the status at the time of the last 30-minute update. Stock can change faster than that. Always check the product page on Canada Computers directly before making a trip.',
    },
    {
        q: 'How do I request a feature?',
        a: 'At the current time, there is no way to submit feature requests.',
    },
];

export function faqPageJsonLd(items: FaqEntry[] = FAQS) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((it) => ({
            '@type': 'Question',
            name: it.q,
            acceptedAnswer: {
                '@type': 'Answer',
                text: it.a,
            },
        })),
    };
}
