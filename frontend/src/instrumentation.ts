/**
 * instrumentation.ts — Next.js server startup hook.
 *
 * `register()` is called once when the Next.js server process starts.
 * We use it to kick off the background cache warm-up loop.
 * The Node.js runtime guard ensures better-sqlite3 / native addons
 * are never loaded in the Edge runtime.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
    if (process.env.NEXT_RUNTIME !== 'nodejs') return;

    // Guard against double-registration in dev hot-reload
    const g = global as Record<string, unknown>;
    if (g._bgRefreshStarted) return;
    g._bgRefreshStarted = true;

    const { startBackgroundRefresh } = await import('./lib/categories');
    startBackgroundRefresh();
}
