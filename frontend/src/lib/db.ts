/**
 * db.ts — Singleton better-sqlite3 connection with schema initialisation.
 *
 * better-sqlite3 is synchronous and not safe to use in the Edge runtime.
 * All callers must run under the Node.js runtime (default for Route Handlers).
 */
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'cache.db');

// Module-level singleton — Next.js keeps this alive between requests.
// In development hot-reload, the module is re-evaluated, but the file-level
// global below survives via `global`.
declare global {
    // eslint-disable-next-line no-var
    var _sqliteDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
    if (!global._sqliteDb) {
        const db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.exec(`
            CREATE TABLE IF NOT EXISTS deals_cache (
                store_key  TEXT PRIMARY KEY,
                products   TEXT NOT NULL,
                scraped_at REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS price_history (
                item_code     TEXT    NOT NULL,
                price         REAL    NOT NULL,
                regular_price REAL    NOT NULL,
                recorded_at   REAL    NOT NULL,
                slot          INTEGER NOT NULL,
                UNIQUE (item_code, slot)
            );
            CREATE INDEX IF NOT EXISTS idx_ph_item
                ON price_history (item_code, recorded_at);
        `);
        global._sqliteDb = db;
    }
    return global._sqliteDb;
}
