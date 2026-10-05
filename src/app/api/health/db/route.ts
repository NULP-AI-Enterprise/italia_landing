import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/server/db/client";

/**
 * Health check that also asks the database. Vercel Cron calls it once a day
 * (vercel.json): a free Supabase project is paused after a week without queries.
 */
export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: "ok", database: "ok", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Health: the database is unavailable.", error);
    return NextResponse.json({ status: "error", database: "unavailable" }, { status: 503 });
  }
}
