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
                            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Glow accent */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-120px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '700px',
                        height: '400px',
                        borderRadius: '50%',
                        background: 'radial-gradient(ellipse, rgba(220,38,38,0.18) 0%, transparent 70%)',
                    }}
                />

                {/* Badge */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(220,38,38,0.15)',
                        border: '1px solid rgba(220,38,38,0.35)',
                        borderRadius: '999px',
                        padding: '6px 18px',
                        marginBottom: '32px',
                    }}
                >
                    <span style={{ fontSize: '22px' }}>🍁</span>
                    <span style={{ fontSize: '16px', color: '#f87171', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Proudly Canadian
                    </span>
                </div>

                {/* Logo / Site name */}
                <div
                    style={{
                        fontSize: '96px',
                        fontWeight: 800,
                        color: '#ffffff',
                        letterSpacing: '-0.04em',
                        lineHeight: 1,
                        marginBottom: '20px',
                        display: 'flex',
                    }}
                >
                    CCDeals
                </div>

                {/* Tagline */}
                <div
                    style={{
                        fontSize: '28px',
                        color: '#a1a1aa',
                        fontWeight: 400,
                        textAlign: 'center',
                        maxWidth: '760px',
                        lineHeight: 1.5,
                        marginBottom: '48px',
                    }}
                >
                    Canada Computers deals, sorted by biggest savings.
                    <br />
                    Desktops · RAM · CPUs · GPUs
                </div>

                {/* Pill tags */}
                <div style={{ display: 'flex', gap: '16px' }}>
                    {['Updated every 30 min', 'Free to use', 'No account needed'].map((label) => (
                        <div
                            key={label}
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '999px',
                                padding: '8px 20px',
                                fontSize: '16px',
                                color: '#d4d4d8',
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
                        bottom: '32px',
                        display: 'flex',
                        fontSize: '18px',
                        color: '#52525b',
                        fontWeight: 500,
                    }}
                >
                    ccdeals.ca
                </div>
            </div>
        ),
        { ...size }
    );
}
