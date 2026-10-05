/**
 * Applies the SQL migrations in /drizzle before a build (used by "vercel-build").
 * The app also checks them on its first database access, so skipping this step
 * is safe; it just moves the work out of a request.
 *
 * Connection: DATABASE_URL_UNPOOLED (Supabase session pooler, port 5432) if set,
 * otherwise DATABASE_URL. The Supabase integration's POSTGRES_URL_NON_POOLING /
 * POSTGRES_URL work too. Vercel preview builds are skipped: they may point at
 * the production database.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

if (process.env.VERCEL_ENV === "preview") {
  console.warn("migrate: preview build, the database schema is left as it is.");
  process.exit(0);
}

const raw =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;
if (!raw) {
  console.warn("migrate: DATABASE_URL is not set, skipping migrations.");
  process.exit(0);
}

// Hints for other drivers (?supa=…, ?pgbouncer=true…); the same list is in src/server/db/url.ts.
const url = new URL(raw);
for (const key of ["supa", "pgbouncer", "connection_limit", "pool_timeout", "schema", "statement_cache_size"]) {
  url.searchParams.delete(key);
}

const client = postgres(url.toString(), { max: 1, prepare: false, onnotice: () => {} });
try {
  await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  console.log(`migrate: database at ${url.hostname} is up to date.`);
} finally {
  await client.end();
}
