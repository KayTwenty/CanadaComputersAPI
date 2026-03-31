'use client';

import { useState, useCallback } from 'react';
import { TbShare, TbCheck, TbCopy } from 'react-icons/tb';

interface Props {
    title: string;
    url: string;
    price: string;
    size?: 'sm' | 'md';
}

export default function ShareButton({ title, url, price, size = 'md' }: Props) {
    const [copied, setCopied] = useState(false);

    const handleShare = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault();   // don't follow the parent <a> link
        e.stopPropagation();

        const shareText = `${title} — on sale for ${price}`;

        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({ title: shareText, url });
            } catch {
                // user cancelled — do nothing
            }
            return;
        }

        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // clipboard unavailable — silently ignore
        }
    }, [title, url, price]);

    const iconSize = size === 'sm' ? 13 : 15;

    return (
        <button
            onClick={handleShare}
            title={copied ? 'Link copied!' : 'Share this deal'}
            aria-label={copied ? 'Link copied!' : 'Share this deal'}
            className={`inline-flex items-center justify-center gap-1 rounded-full border transition-all duration-200 font-semibold
                ${size === 'sm'
                    ? 'text-xs px-2.5 py-1'
                    : 'text-xs px-3 py-1.5'}
                ${copied
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700 hover:border-slate-400'
                }`}
        >
            {copied
                ? <><TbCheck size={iconSize} />Copied</>
                : <><TbShare size={iconSize} />Share</>}
        </button>
    );
}
