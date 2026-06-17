/**
 * proxies.ts — Rotating proxy pool for the scraper.
 *
 * Configuration (add to .env.local):
 *
 *   # Comma-separated list of proxy URLs:
 *   PROXY_LIST=http://user:pass@host1:8080,http://user:pass@host2:8080
 *
 *   # OR path to a text file (one proxy URL per line, # = comment):
 *   PROXY_FILE=./proxies.txt
 *
 * Proxy URL formats supported:
 *   http://host:port
 *   http://user:pass@host:port
 *   socks5://user:pass@host:port   (requires undici 6+)
 *
 * Rotation strategy:
 *   - Round-robin across healthy proxies.
 *   - A proxy is "cooling down" for COOLDOWN_MS after MAX_FAILURES consecutive failures.
 *   - If all proxies are cooling down, falls back to direct connection.
 *   - Call markSuccess() after a successful fetch to reset failure count.
 *   - Call markFailure() after a failed fetch to penalise that proxy.
 */
import fs from 'fs';
import path from 'path';

const MAX_FAILURES = 3;
const COOLDOWN_MS  = 5 * 60 * 1000; // 5 minutes

interface ProxyEntry {
    url: string;
    failures: number;
    coolingUntil: number; // epoch ms, 0 = not cooling
}

class ProxyRotator {
    private pool: ProxyEntry[] = [];
    private index  = 0;
    private loaded = false;

    private load(): void {
        if (this.loaded) return;
        this.loaded = true;

        const raw = this._readRaw();
        this.pool = raw
            .map(u => u.trim())
            .filter(u => u.length > 0 && !u.startsWith('#'))
            .map(url => ({ url, failures: 0, coolingUntil: 0 }));

        if (this.pool.length === 0) {
            // No proxies configured — direct mode.
        } else {
            console.log(`[proxies] Loaded ${this.pool.length} proxy/proxies.`);
        }
    }

    private _readRaw(): string[] {
        const listEnv = process.env.PROXY_LIST;
        if (listEnv) return listEnv.split(',');

        const fileEnv = process.env.PROXY_FILE;
        if (fileEnv) {
            const filePath = path.resolve(process.cwd(), fileEnv);
            try {
                return fs.readFileSync(filePath, 'utf8').split('\n');
            } catch (e) {
                console.warn(`[proxies] Could not read PROXY_FILE "${filePath}":`, e);
            }
        }

        return [];
    }

    /** Returns the next healthy proxy URL, or null for direct connection. */
    next(): string | null {
        this.load();
        if (this.pool.length === 0) return null;

        const now = Date.now();
        // Find the next healthy proxy, cycling from current index
        for (let i = 0; i < this.pool.length; i++) {
            const entry = this.pool[(this.index + i) % this.pool.length];
            if (entry.coolingUntil === 0 || now >= entry.coolingUntil) {
                if (entry.coolingUntil !== 0) {
                    // Cooldown expired — reset
                    entry.failures    = 0;
                    entry.coolingUntil = 0;
                }
                this.index = (this.pool.indexOf(entry) + 1) % this.pool.length;
                return entry.url;
            }
        }

        // All proxies cooling down — fall back to direct
        console.warn('[proxies] All proxies are in cooldown, falling back to direct connection.');
        return null;
    }

    markSuccess(proxyUrl: string): void {
        const entry = this.pool.find(p => p.url === proxyUrl);
        if (entry) { entry.failures = 0; entry.coolingUntil = 0; }
    }

    markFailure(proxyUrl: string): void {
        const entry = this.pool.find(p => p.url === proxyUrl);
        if (!entry) return;
        entry.failures++;
        if (entry.failures >= MAX_FAILURES) {
            entry.coolingUntil = Date.now() + COOLDOWN_MS;
            console.warn(`[proxies] ${proxyUrl} failed ${entry.failures}x — cooling down for ${COOLDOWN_MS / 60000} min.`);
        }
    }

    get size(): number { this.load(); return this.pool.length; }

    /** Expose pool stats for /api/status */
    stats() {
        this.load();
        const now = Date.now();
        return this.pool.map(p => ({
            url: p.url.replace(new RegExp('://[^@]+@'), '://***@'), // mask credentials
            failures: p.failures,
            cooling: p.coolingUntil > now,
            coolingForMs: p.coolingUntil > now ? p.coolingUntil - now : 0,
        }));
    }
}

export const proxyRotator = new ProxyRotator();
