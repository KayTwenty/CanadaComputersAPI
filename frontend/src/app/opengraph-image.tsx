import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CCDeals | Canada Computers Deals Tracker';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '1200px',
                    height: '630px',
                    background: '#09090b',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Subtle grid background */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Violet spotlight (top) */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-180px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '900px',
                        height: '500px',
                        borderRadius: '50%',
                        background: 'radial-gradient(ellipse, rgba(139,92,246,0.28) 0%, transparent 70%)',
                    }}
                />

                {/* Fuchsia accent (bottom-right) */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-160px',
                        right: '-80px',
                        width: '520px',
                        height: '420px',
                        borderRadius: '50%',
                        background: 'radial-gradient(ellipse, rgba(217,70,239,0.18) 0%, transparent 70%)',
                    }}
                />

                {/* Logo lockup: gradient tile + wordmark */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        marginBottom: '28px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '108px',
                            height: '108px',
                            borderRadius: '28px',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #f97316 100%)',
                            color: '#ffffff',
                            fontSize: '64px',
                            fontWeight: 800,
                            letterSpacing: '-0.05em',
                            boxShadow: '0 20px 60px -15px rgba(139,92,246,0.55)',
                        }}
                    >
                        CC
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: '112px',
                            fontWeight: 800,
                            color: '#ffffff',
                            letterSpacing: '-0.05em',
                            lineHeight: 1,
                        }}
                    >
                        CCDeals
                    </div>
                </div>

                {/* Badge */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'rgba(139,92,246,0.14)',
                        border: '1px solid rgba(139,92,246,0.4)',
                        borderRadius: '999px',
                        padding: '8px 22px',
                        marginBottom: '28px',
                    }}
                >
                    <div
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#34d399',
                            boxShadow: '0 0 12px rgba(52,211,153,0.8)',
                        }}
                    />
                    <span
                        style={{
                            fontSize: '15px',
                            color: '#c4b5fd',
                            fontWeight: 700,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                        }}
                    >
                        Live · Updated every 30 min
                    </span>
                </div>

                {/* Tagline */}
                <div
                    style={{
                        fontSize: '32px',
                        color: '#d4d4d8',
                        fontWeight: 500,
                        textAlign: 'center',
                        maxWidth: '880px',
                        lineHeight: 1.4,
                        marginBottom: '44px',
                    }}
                >
                    Canada Computers deals, sorted by biggest savings.
                </div>

                {/* Pill tags */}
                <div style={{ display: 'flex', gap: '14px' }}>
                    {['Desktops', 'Laptops', 'CPUs', 'GPUs', 'Memory', 'Drives'].map((label) => (
                        <div
                            key={label}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '999px',
                                padding: '10px 22px',
                                fontSize: '17px',
                                color: '#e4e4e7',
                                fontWeight: 600,
                            }}
                        >
                            {label}
                        </div>
                    ))}
                </div>

                {/* Bottom domain */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '18px',
                        color: '#71717a',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                    }}
                >
                    <div
                        style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#8b5cf6',
                        }}
                    />
                    ccdeals.ca
                </div>
            </div>
        ),
        { ...size }
    );
}
