/**
 * Applies the SQL migrations in /drizzle to DATABASE_URL before a build
 * (used by "vercel-build"). The app also checks them on its first database
 * access, so skipping this step is safe; it just moves the work out of a request.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn("migrate: DATABASE_URL is not set, skipping migrations.");
  process.exit(0);
}

const client = postgres(url, { max: 1, prepare: false });
try {
  await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  console.log("migrate: database is up to date.");
} finally {
  await client.end();
}
