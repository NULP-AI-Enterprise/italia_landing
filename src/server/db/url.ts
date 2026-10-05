/**
 * PostgreSQL connection string (server only).
 *
 * DATABASE_URL, or POSTGRES_URL that the Supabase integration adds on Vercel.
 * On Supabase it is the transaction pooler (port 6543): many short-lived
 * serverless connections share a few database connections.
 */
export function databaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return raw ? withoutDriverHints(raw) : undefined;
}

/**
 * Hints for other drivers in Supabase and Prisma connection strings
 * (?supa=base-pooler.x, ?pgbouncer=true…). postgres.js would send them to the
 * server as settings, and the server would refuse the connection.
 * The same list is in scripts/migrate.mjs.
 */
const DRIVER_HINTS = ["supa", "pgbouncer", "connection_limit", "pool_timeout", "schema", "statement_cache_size"];

export function withoutDriverHints(raw: string): string {
  try {
    const url = new URL(raw);
    for (const key of DRIVER_HINTS) url.searchParams.delete(key);
    return url.toString();
  } catch {
    return raw;
  }
}

/** Vercel preview builds never change the database schema: it may be the production database. */
export const isVercelPreview = () => process.env.VERCEL_ENV === "preview";
