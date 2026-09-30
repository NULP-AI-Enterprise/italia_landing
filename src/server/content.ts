/**
 * Writing content from the admin panel (server only).
 * Reads go through src/content/store.ts, which also validates.
 */
import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/server/db/client";

/** When each stored document was last saved, and by whom. Missing keys still use the bundled JSON. */
export async function listDocumentMeta() {
  const db = await getDb();
  const rows = await db
    .select({
      key: schema.contentDocuments.key,
      updatedAt: schema.contentDocuments.updatedAt,
      updatedBy: schema.adminUsers.name,
    })
    .from(schema.contentDocuments)
    .leftJoin(schema.adminUsers, eq(schema.contentDocuments.updatedBy, schema.adminUsers.id));
  return new Map(rows.map((row) => [row.key, row]));
}

export async function saveDocument(key: string, data: unknown, userId: string) {
  const db = await getDb();
  await db
    .insert(schema.contentDocuments)
    .values({ key, data, updatedBy: userId })
    .onConflictDoUpdate({
      target: schema.contentDocuments.key,
      set: { data, updatedBy: userId, updatedAt: sql`now()` },
    });
}

/* ---------- Uploaded images ---------- */

export async function createMediaFile(file: {
  originalName: string;
  contentType: string;
  width: number;
  height: number;
  data: Uint8Array;
  createdBy: string;
}) {
  const db = await getDb();
  const [row] = await db
    .insert(schema.mediaFiles)
    .values({ ...file, size: file.data.byteLength })
    .returning({ id: schema.mediaFiles.id });
  return row.id;
}

export async function getMediaFile(id: string) {
  const db = await getDb();
  const [row] = await db
    .select({ contentType: schema.mediaFiles.contentType, data: schema.mediaFiles.data })
    .from(schema.mediaFiles)
    .where(eq(schema.mediaFiles.id, id))
    .limit(1);
  return row ?? null;
}
