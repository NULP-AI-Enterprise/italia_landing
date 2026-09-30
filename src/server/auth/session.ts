/**
 * Admin sessions: a random token in an httpOnly cookie, its SHA-256 in the database.
 */
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/server/db/client";

const COOKIE = "miufi_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type AdminUser = { id: string; email: string; name: string };

export async function createSession(userId: string) {
  const db = await getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + MAX_AGE_SECONDS * 1000);

  // Housekeeping: drop expired sessions while we are here.
  await db.delete(schema.adminSessions).where(lt(schema.adminSessions.expiresAt, new Date()));
  await db.insert(schema.adminSessions).values({ id: hashToken(token), userId, expiresAt });

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    expires: expiresAt,
  });
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const db = await getDb();
  const [row] = await db
    .select({ id: schema.adminUsers.id, email: schema.adminUsers.email, name: schema.adminUsers.name })
    .from(schema.adminSessions)
    .innerJoin(schema.adminUsers, eq(schema.adminSessions.userId, schema.adminUsers.id))
    .where(and(eq(schema.adminSessions.id, hashToken(token)), gt(schema.adminSessions.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}

/** Use at the top of every admin page and admin server action. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(schema.adminSessions).where(eq(schema.adminSessions.id, hashToken(token)));
  }
  store.delete({ name: COOKIE, path: "/admin" });
}
