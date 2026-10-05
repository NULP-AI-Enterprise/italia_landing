/**
 * Database access (server only).
 *
 * - Production and staging: PostgreSQL from DATABASE_URL (k8s secret, Vercel
 *   environment variable or POSTGRES_URL from the Supabase integration; see url.ts).
 * - Local development without DATABASE_URL: embedded PGlite stored in .data/,
 *   the same SQL dialect and the same migrations.
 *
 * Migrations from /drizzle run on first use (not in Vercel previews). If ADMIN_EMAIL
 * and ADMIN_PASSWORD are set and there is no administrator yet, the first one is created.
 */
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { count } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { hashPassword } from "@/server/auth/password";
import * as schema from "./schema";
import { databaseUrl, isVercelPreview } from "./url";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

const migrationsFolder = path.join(process.cwd(), "drizzle");

async function connect(): Promise<Database> {
  const url = databaseUrl();

  if (url) {
    const [{ drizzle }, { default: postgres }] = await Promise.all([
      import("drizzle-orm/postgres-js"),
      import("postgres"),
    ]);
    // Serverless (Vercel): one connection per function instance, and no prepared
    // statements so pooled connection strings (Neon, Supabase, PgBouncer) work.
    const client = postgres(url, { max: process.env.VERCEL ? 1 : 5, prepare: false });
    return drizzle(client, { schema, casing: "snake_case" }) as unknown as Database;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is not set. The site needs PostgreSQL in production.");
  }

  const [{ PGlite }, { drizzle }] = await Promise.all([import("@electric-sql/pglite"), import("drizzle-orm/pglite")]);
  const dataDir = path.join(process.cwd(), ".data", "pglite");
  mkdirSync(dataDir, { recursive: true });
  return drizzle(new PGlite(dataDir), { schema, casing: "snake_case" }) as unknown as Database;
}

async function migrate(db: Database) {
  if (isVercelPreview()) return;
  if (databaseUrl()) {
    const { migrate: run } = await import("drizzle-orm/postgres-js/migrator");
    await run(db as unknown as Parameters<typeof run>[0], { migrationsFolder });
  } else {
    const { migrate: run } = await import("drizzle-orm/pglite/migrator");
    await run(db as unknown as Parameters<typeof run>[0], { migrationsFolder });
  }
}

/** Number of migrations in /drizzle; the dev server re-runs them when a new one appears. */
function migrationCount() {
  try {
    const journal = JSON.parse(readFileSync(path.join(migrationsFolder, "meta", "_journal.json"), "utf8"));
    return Array.isArray(journal.entries) ? journal.entries.length : 0;
  } catch {
    return 0;
  }
}

async function ensureFirstAdmin(db: Database) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const [{ value }] = await db.select({ value: count() }).from(schema.adminUsers);
  if (value > 0) return;

  await db.insert(schema.adminUsers).values({
    email,
    name: process.env.ADMIN_NAME?.trim() || email,
    passwordHash: await hashPassword(password),
  });
}

// One connection per server process, also across hot reloads in development.
type Connection = { db: Database; migrations: number; connection: true };
const globalForDb = globalThis as typeof globalThis & { __miufiDb?: Promise<Connection | Database> };

async function open(): Promise<Connection> {
  const db = await connect();
  await migrate(db);
  await ensureFirstAdmin(db);
  return { db, migrations: migrationCount(), connection: true };
}

export async function getDb(): Promise<Database> {
  globalForDb.__miufiDb ??= open().catch((error: unknown) => {
    globalForDb.__miufiDb = undefined; // let the next request try again
    throw error;
  });
  let cached = await globalForDb.__miufiDb;
  // A dev server started before this file changed holds the bare database object.
  if (!("connection" in cached)) {
    cached = { db: cached, migrations: 0, connection: true };
    globalForDb.__miufiDb = Promise.resolve(cached);
  }

  // In development a migration can be generated while the server runs.
  if (process.env.NODE_ENV !== "production" && migrationCount() > cached.migrations) {
    await migrate(cached.db);
    cached.migrations = migrationCount();
  }
  return cached.db;
}

export { schema };
