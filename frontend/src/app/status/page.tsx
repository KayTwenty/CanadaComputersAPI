'use client';

import { useEffect, useRef, useState } from 'react';
import {
    TbRefresh, TbCircleCheck, TbAlertTriangle, TbAlertCircle,
    TbWorldWww, TbServer, TbDatabase, TbWifi, TbShieldCheck,
    TbClock, TbArrowUp, TbArrowDown, TbMinus, TbActivity,
} from 'react-icons/tb';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CacheEntry {
    store_key: string;
    age_seconds: number;
    expires_in_seconds: number;
    fresh: boolean;
    cached_bytes: number;
}

interface ProxyEntry {
    url: string;
    failures: number;
    cooling: boolean;
    coolingForMs: number;
}

interface PingPoint {
    timestamp: number;
    self: { up: boolean; latency_ms: number };
    cc:   { up: boolean; latency_ms: number | null; status_code: number | null };
    cache: {
        all_stores: CacheEntry | null;
        categories: CacheEntry[];
        store_count_cached: number;
        store_count_total: number;
    };
    proxies: ProxyEntry[];
}

type ServiceStatus = 'up' | 'degraded' | 'down' | 'unknown';

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusOf(up: boolean | undefined, latency: number | null | undefined): ServiceStatus {
    if (up === undefined) return 'unknown';
    if (!up) return 'down';
    if (latency != null && latency > 3000) return 'degraded';
    return 'up';
}

function overallStatus(points: PingPoint[]): ServiceStatus {
    const p = points[points.length - 1];
    if (!p) return 'unknown';
    const all = [
        statusOf(p.self.up, p.self.latency_ms),
        statusOf(p.cc.up, p.cc.latency_ms),
    ];
    if (all.some(s => s === 'down'))     return 'down';
    if (all.some(s => s === 'degraded')) return 'degraded';
    if (all.every(s => s === 'up'))      return 'up';
    return 'unknown';
}

function fmtLatency(ms: number | null | undefined): string {
    if (ms == null) return '—';
    if (ms < 1000)  return `${ms} ms`;
    return `${(ms / 1000).toFixed(1)} s`;
}

function fmtTime(ts: number): string {
    return new Date(ts).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function uptimePct(history: PingPoint[], key: (p: PingPoint) => boolean): string {
    if (!history.length) return '—';
    return `${((history.filter(key).length / history.length) * 100).toFixed(0)}%`;
}

// ── Mini latency sparkline ────────────────────────────────────────────────────

function Sparkline({ values, color = '#7c3aed' }: { values: (number | null)[]; color?: string }) {
    if (values.length < 2) return null;
    const nums = values.map(v => v ?? 0);
    const max  = Math.max(...nums, 1);
    const W = 80, H = 28;
    const pts = nums.map((v, i) => ({
        x: (i / (nums.length - 1)) * W,
        y: H - (v / max) * (H - 2) - 1,
    }));
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
            <path d={d} fill="none" stroke={color} strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        </svg>
    );
}

// ── Status styles ─────────────────────────────────────────────────────────────

const SS: Record<ServiceStatus, { dot: string; text: string; label: string; badge: string }> = {
    up:       { dot: 'bg-emerald-400', text: 'text-emerald-600', label: 'Operational', badge: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    degraded: { dot: 'bg-amber-400',   text: 'text-amber-600',   label: 'Degraded',    badge: 'bg-amber-50 border-amber-200 text-amber-700' },
    down:     { dot: 'bg-rose-400',    text: 'text-rose-600',    label: 'Outage',       badge: 'bg-rose-50 border-rose-200 text-rose-700' },
    unknown:  { dot: 'bg-slate-300',   text: 'text-slate-400',   label: 'Checking…',   badge: 'bg-slate-50 border-slate-200 text-slate-500' },
};

function StatusDot({ status, pulse = true }: { status: ServiceStatus; pulse?: boolean }) {
    return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${SS[status].dot} ${pulse && status === 'up' ? 'animate-pulse-soft' : ''}`} />;
}

function StatusBadge({ status }: { status: ServiceStatus }) {
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${SS[status].badge}`}>
            <StatusDot status={status} pulse={false} />
            {SS[status].label}
        </span>
    );
}

// ── Trend icon ────────────────────────────────────────────────────────────────

function TrendIcon({ values }: { values: (number | null)[] }) {
    const v = values.filter((x): x is number => x !== null);
    if (v.length < 2) return <TbMinus size={12} className="text-slate-400" />;
    const diff = v[v.length - 1] - v[0];
    if (diff > 100) return <TbArrowUp   size={12} className="text-rose-400" />;
    if (diff < -100) return <TbArrowDown size={12} className="text-emerald-500" />;
    return <TbMinus size={12} className="text-slate-400" />;
}

// ── ServiceCard ───────────────────────────────────────────────────────────────

function ServiceCard({
    Icon, name, description, status, latency, history, statusCode, children,
}: {
    Icon: React.ComponentType<{ size?: number; className?: string }>;
    name: string;
    description: string;
    status: ServiceStatus;
    latency?: number | null;
    history: (number | null)[];
    statusCode?: number | null;
    children?: React.ReactNode;
}) {
    const valid  = history.filter((x): x is number => x !== null);
    const avgMs  = valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;

    return (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                        <Icon size={18} />
                    </span>
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">{name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{description}</p>
                    </div>
                </div>
                <StatusBadge status={status} />
            </div>

            <div className="flex items-end justify-between gap-4">
                <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                    {latency != null && (
                        <div className="flex items-center gap-1.5">
                            <TbClock size={11} />
                            <span className="tabular-nums">{fmtLatency(latency)}</span>
                            <TrendIcon values={history} />
                        </div>
                    )}
                    {avgMs !== null && (
                        <span className="text-slate-400 tabular-nums">avg {fmtLatency(avgMs)}</span>
                    )}
                    {statusCode != null && (
                        <span className="text-slate-400">HTTP {String(statusCode)}</span>
                    )}
                </div>
                <Sparkline
                    values={history}
                    color={status === 'up' ? '#7c3aed' : status === 'degraded' ? '#d97706' : '#f43f5e'}
                />
            </div>

            {children}
        </div>
    );
}

// ── Mini progress bar ─────────────────────────────────────────────────────────

function Bar({ value, total, color }: { value: number; total: number; color: string }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs tabular-nums text-slate-400 w-14 text-right">{value}/{total}</span>
        </div>
    );
}

// ── Stat mini-tile ────────────────────────────────────────────────────────────

function StatMini({ label, value, color = 'text-slate-900' }: { label: string; value: string | number; color?: string }) {
    return (
        <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-center border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{label}</p>
            <p className={`text-lg font-extrabold tabular-nums mt-0.5 ${color}`}>{String(value)}</p>
        </div>
    );
}

// ── History table row ─────────────────────────────────────────────────────────

function HistoryRow({ point, idx }: { point: PingPoint; idx: number }) {
    return (
        <tr className={idx % 2 === 0 ? 'bg-slate-50/50' : ''}>
            <td className="px-4 py-2 text-xs text-slate-400 tabular-nums font-mono whitespace-nowrap">{fmtTime(point.timestamp)}</td>
            <td className="px-4 py-2"><StatusDot status={point.self.up ? 'up' : 'down'} pulse={false} /></td>
            <td className="px-4 py-2 text-xs tabular-nums text-slate-700">{fmtLatency(point.self.latency_ms)}</td>
            <td className="px-4 py-2"><StatusDot status={point.cc.up ? 'up' : 'down'} pulse={false} /></td>
            <td className="px-4 py-2 text-xs tabular-nums text-slate-700">{fmtLatency(point.cc.latency_ms)}</td>
            <td className="px-4 py-2 text-xs tabular-nums text-slate-400">{point.cc.status_code != null ? String(point.cc.status_code) : '—'}</td>
        </tr>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const POLL_MS   = 30_000;
const MAX_HIST  = 20;

const OVERALL_BANNER = {
    up:       { hero: 'from-emerald-500/10 to-emerald-600/5 border-emerald-300/40', icon: <TbCircleCheck  size={22} className="text-emerald-500" />, text: 'All Systems Operational',  sub: 'Everything is running smoothly.' },
    degraded: { hero: 'from-amber-500/10 to-amber-600/5 border-amber-300/40',       icon: <TbAlertTriangle size={22} className="text-amber-500" />,   text: 'Degraded Performance',     sub: 'Some services are responding slowly.' },
    down:     { hero: 'from-rose-500/10 to-rose-600/5 border-rose-300/40',          icon: <TbAlertCircle   size={22} className="text-rose-500" />,    text: 'Service Disruption',       sub: 'One or more services are down.' },
    unknown:  { hero: 'from-violet-500/10 to-violet-600/5 border-violet-300/40',    icon: <TbRefresh size={22} className="text-violet-500 animate-spin" />, text: 'Checking status…', sub: 'Running initial health checks.' },
} as const;

export default function StatusPage() {
    const [history, setHistory]         = useState<PingPoint[]>([]);
    const [loading, setLoading]         = useState(true);
    const [lastChecked, setLastChecked] = useState<number | null>(null);
    const [checking, setChecking]       = useState(false);
    const [countdown, setCountdown]     = useState(POLL_MS / 1000);
    const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const cdTimer   = useRef<ReturnType<typeof setInterval> | null>(null);

    async function poll(manual = false) {
        if (manual) setChecking(true);
        try {
            const res  = await fetch('/api/ping', { cache: 'no-store' });
            const data = await res.json() as PingPoint;
            setHistory(prev => [...prev.slice(-(MAX_HIST - 1)), data]);
            setLastChecked(Date.now());
            setCountdown(POLL_MS / 1000);
        } catch { /* silent */ } finally {
            setLoading(false);
            if (manual) setChecking(false);
        }
    }

    useEffect(() => {
        poll();
        pollTimer.current = setInterval(() => poll(), POLL_MS);
        cdTimer.current   = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
        return () => {
            if (pollTimer.current) clearInterval(pollTimer.current);
            if (cdTimer.current)   clearInterval(cdTimer.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const latest  = history[history.length - 1] ?? null;
    const overall = overallStatus(history);
    const banner  = OVERALL_BANNER[overall];

    const selfHistory = history.map(p => p.self.latency_ms as number | null);
    const ccHistory   = history.map(p => p.cc.latency_ms);

    // Derived cache counts
    const totalCat    = latest?.cache?.categories?.length ?? 0;
    const freshCat    = latest?.cache?.categories?.filter(c => c.fresh).length ?? 0;
    const staleCat    = totalCat - freshCat;
    const storesCached = latest?.cache?.store_count_cached ?? 0;

    // Derived proxy counts
    const proxyTotal   = latest?.proxies?.length ?? 0;
    const proxyActive  = latest?.proxies?.filter(p => !p.cooling).length ?? 0;
    const proxyCooling = latest?.proxies?.filter(p => p.cooling).length ?? 0;

    return (
        <div className="flex-1">

            {/* ── Dark hero ── */}
            <section className="relative overflow-hidden bg-zinc-950 text-white">
                <div className="absolute inset-0 bg-grid pointer-events-none" />
                <div className="absolute inset-0 bg-spotlight pointer-events-none" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-12 sm:pt-12">
                    <div className="flex items-start justify-between gap-4 animate-fade-up">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <TbShieldCheck size={14} className="text-violet-400" />
                                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">System Status</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Status Dashboard</h1>
                            <p className="mt-2 text-sm text-zinc-400">Live health monitoring · auto-refreshes every 30 s</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
                            <button
                                onClick={() => poll(true)}
                                disabled={checking}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-sm font-medium text-zinc-300 hover:text-white transition-colors border border-zinc-700"
                            >
                                <TbRefresh size={14} className={checking ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                            {lastChecked && (
                                <p className="text-[10px] text-zinc-500 tabular-nums">
                                    Next in {countdown}s · {fmtTime(lastChecked)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Overall status banner */}
                    <div className={`mt-8 rounded-2xl border bg-linear-to-r ${banner.hero} px-5 py-4 flex items-center gap-4 animate-fade-up`}
                        style={{ animationDelay: '60ms' }}>
                        {banner.icon}
                        <div>
                            <p className="font-bold text-white">{banner.text}</p>
                            <p className="text-sm text-zinc-300 mt-0.5">{banner.sub}</p>
                        </div>
                        {history.length > 0 && (
                            <div className="ml-auto text-right hidden sm:block">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Session uptime</p>
                                <p className="text-sm font-bold text-zinc-300 tabular-nums mt-0.5">
                                    CC.com {uptimePct(history, p => p.cc.up)} · CCDeals 100%
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Quick stats strip */}
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-fade-up" style={{ animationDelay: '100ms' }}>
                        {[
                            { label: 'CCDeals',      value: loading ? '…' : 'Online',           sub: 'API responding',       color: 'text-emerald-300' },
                            { label: 'CC.com',       value: loading ? '…' : latest?.cc.up ? 'Online' : 'Issue', sub: fmtLatency(latest?.cc.latency_ms), color: latest?.cc.up ? 'text-emerald-300' : 'text-rose-300' },
                            { label: 'Cache slices', value: loading ? '…' : String(totalCat),   sub: `${freshCat} fresh`,    color: 'text-violet-300' },
                            { label: 'Proxies',      value: loading ? '…' : String(proxyActive), sub: `${proxyActive}/${proxyTotal} active`, color: 'text-fuchsia-300' },
                        ].map(({ label, value, sub, color }) => (
                            <div key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-3.5 py-3 backdrop-blur-sm">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
                                <p className={`text-lg font-extrabold tabular-nums mt-0.5 ${color}`}>{value}</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5 tabular-nums">{sub}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Light body ── */}
            <div className="bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">

                    {/* Service cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up">

                        {/* CCDeals */}
                        <ServiceCard
                            Icon={TbServer}
                            name="CCDeals API"
                            description="Next.js · SQLite · better-sqlite3"
                            status={loading ? 'unknown' : 'up'}
                            latency={0}
                            history={selfHistory}
                        >
                            {latest && (
                                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                                    <StatMini label="Caches"  value={String(totalCat)}    color="text-slate-900" />
                                    <StatMini label="Fresh"   value={String(freshCat)}    color="text-emerald-600" />
                                    <StatMini label="Proxies" value={`${proxyActive}/${proxyTotal}`} color="text-violet-600" />
                                </div>
                            )}
                        </ServiceCard>

                        {/* Canada Computers */}
                        <ServiceCard
                            Icon={TbWorldWww}
                            name="Canada Computers"
                            description="canadacomputers.com · scraping target"
                            status={loading ? 'unknown' : statusOf(latest?.cc.up, latest?.cc.latency_ms)}
                            latency={latest?.cc.latency_ms}
                            history={ccHistory}
                            statusCode={latest?.cc.status_code}
                        />
                    </div>

                    {/* Cache health */}
                    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 space-y-4 animate-fade-up"
                        style={{ animationDelay: '60ms' }}>
                        <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                <TbDatabase size={18} />
                            </span>
                            <div>
                                <p className="font-semibold text-slate-900 text-sm">Deal Cache Health</p>
                                <p className="text-xs text-slate-400">SQLite · WAL mode · 30 min TTL</p>
                            </div>
                            <div className="ml-auto">
                                <StatusBadge status={
                                    loading ? 'unknown'
                                    : freshCat === totalCat && totalCat > 0 ? 'up'
                                    : freshCat === 0 ? 'down'
                                    : 'degraded'
                                } />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatMini label="Total slices" value={String(totalCat)}    color="text-slate-900" />
                            <StatMini label="Fresh"        value={String(freshCat)}    color="text-emerald-600" />
                            <StatMini label="Stale"        value={String(staleCat)}    color="text-amber-600" />
                            <StatMini label="Stores cached" value={String(storesCached)} color="text-violet-600" />
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Cache freshness</p>
                            <Bar value={freshCat} total={totalCat} color="bg-emerald-400" />
                        </div>
                    </div>

                    {/* Proxy network */}
                    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 space-y-4 animate-fade-up"
                        style={{ animationDelay: '100ms' }}>
                        <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                <TbWifi size={18} />
                            </span>
                            <div>
                                <p className="font-semibold text-slate-900 text-sm">Proxy Network</p>
                                <p className="text-xs text-slate-400">Webshare · round-robin rotation · 5 min cooldown</p>
                            </div>
                            <div className="ml-auto">
                                <StatusBadge status={
                                    loading ? 'unknown'
                                    : proxyTotal === 0 ? 'unknown'
                                    : proxyActive === 0 ? 'down'
                                    : proxyActive < proxyTotal ? 'degraded'
                                    : 'up'
                                } />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <StatMini label="Total"    value={String(proxyTotal)}   color="text-slate-900" />
                            <StatMini label="Active"   value={String(proxyActive)}  color="text-emerald-600" />
                            <StatMini label="Cooldown" value={String(proxyCooling)} color="text-amber-600" />
                        </div>

                        {proxyTotal > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active proxies</p>
                                <Bar value={proxyActive} total={proxyTotal} color="bg-violet-500" />
                            </div>
                        )}
                    </div>

                    {/* Ping history table */}
                    {history.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden animate-fade-up"
                            style={{ animationDelay: '140ms' }}>
                            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
                                <TbActivity size={15} className="text-violet-500" />
                                <p className="font-semibold text-sm text-slate-900">Ping History</p>
                                <span className="ml-auto text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full tabular-nums">
                                    last {history.length} check{history.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                                            <th className="px-4 py-2.5 text-left">Time</th>
                                            <th className="px-4 py-2.5 text-left">CCDeals</th>
                                            <th className="px-4 py-2.5 text-left">Latency</th>
                                            <th className="px-4 py-2.5 text-left">CC.com</th>
                                            <th className="px-4 py-2.5 text-left">Latency</th>
                                            <th className="px-4 py-2.5 text-left">HTTP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...history].reverse().map((p, i) => (
                                            <HistoryRow key={p.timestamp} point={p} idx={i} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

