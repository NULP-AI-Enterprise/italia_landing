/**
 * Loads all editable content (server only).
 *
 * Documents saved in the admin panel live in the database table
 * content_documents; anything not saved there yet comes from the bundled JSON
 * in /content. Every document is validated with its schema, so a broken row can
 * never break the site: it is logged and the bundled version is used instead.
 */
import { cache } from "react";
import { z } from "zod";
import { getDb, schema } from "@/server/db/client";
import { collections, pageDocumentKey, pages, type CollectionKey, type PageKey } from "./registry";
import { seedCollections, seedPages } from "./seed";

export type CollectionData = { [K in CollectionKey]: z.output<(typeof collections)[K]["item"]>[] };
export type PageData = { [K in PageKey]: z.output<(typeof pages)[K]["schema"]> };
export type ContentData = { collections: CollectionData; pages: PageData };

const collectionKeys = Object.keys(collections) as CollectionKey[];
const pageKeys = Object.keys(pages) as PageKey[];

export function parseCollection(key: CollectionKey, data: unknown) {
  return z.array(collections[key].item).safeParse(data);
}

export function parsePage(key: PageKey, data: unknown) {
  return pages[key].schema.safeParse(data);
}

/* ---------- Bundled content, checked when the server starts (and at build) ---------- */

const seed: ContentData = (() => {
  const problems: string[] = [];
  const result = { collections: {}, pages: {} } as Record<"collections" | "pages", Record<string, unknown>>;
  for (const key of collectionKeys) {
    const parsed = parseCollection(key, seedCollections[key]);
    if (parsed.success) result.collections[key] = parsed.data;
    else problems.push(`content/${key}.json:\n${z.prettifyError(parsed.error)}`);
  }
  for (const key of pageKeys) {
    const parsed = parsePage(key, seedPages[key]);
    if (parsed.success) result.pages[key] = parsed.data;
    else problems.push(`content/pages (${key}):\n${z.prettifyError(parsed.error)}`);
  }
  const content = result as unknown as ContentData;
  problems.push(...crossCheck(content).map((p) => `content/${p.key}.json: ${p.message}`));
  if (problems.length) throw new Error(`Invalid bundled content:\n${problems.join("\n")}`);
  return content;
})();

/* ---------- Checks across items and collections ---------- */

export type ContentProblem = { key: CollectionKey; id?: string; message: string };

export function crossCheck(content: ContentData): ContentProblem[] {
  const problems: ContentProblem[] = [];
  for (const key of collectionKeys) {
    const idKey = collections[key].idKey;
    const seen = new Set<string>();
    for (const item of content.collections[key] as Record<string, unknown>[]) {
      const id = String(item[idKey]);
      if (seen.has(id)) problems.push({ key, id, message: `Ідентифікатор «${id}» уже зайнятий` });
      seen.add(id);
    }
  }
  // Members may only point to industries and regions that exist.
  const industryIds = new Set(content.collections.industries.map((i) => i.id));
  const regionCodes = new Set(content.collections.regions.map((r) => r.code));
  for (const member of content.collections.members) {
    for (const id of member.industries) {
      if (!industryIds.has(id)) {
        problems.push({ key: "members", id: member.id, message: `${member.name}: немає галузі «${id}»` });
      }
    }
    for (const code of member.regions) {
      if (!regionCodes.has(code)) {
        problems.push({ key: "members", id: member.id, message: `${member.name}: немає регіону «${code}»` });
      }
    }
  }
  return problems;
}

/* ---------- Runtime loading ---------- */

async function readStoredDocuments(): Promise<Map<string, unknown>> {
  // A production build has no database; it only needs the bundled content.
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") return new Map();
  try {
    const db = await getDb();
    const rows = await db
      .select({ key: schema.contentDocuments.key, data: schema.contentDocuments.data })
      .from(schema.contentDocuments);
    return new Map(rows.map((row) => [row.key, row.data]));
  } catch (error) {
    console.error("Content: the database is unavailable, showing the bundled content.", error);
    return new Map();
  }
}

/** All content for one request (deduplicated per request by React cache). */
export const loadContent = cache(async (): Promise<ContentData> => {
  const stored = await readStoredDocuments();
  const result = { collections: { ...seed.collections }, pages: { ...seed.pages } } as Record<
    "collections" | "pages",
    Record<string, unknown>
  >;

  for (const key of collectionKeys) {
    if (!stored.has(key)) continue;
    const parsed = parseCollection(key, stored.get(key));
    if (parsed.success) result.collections[key] = parsed.data;
    else console.error(`Content: stored "${key}" is invalid, showing the bundled version.`, parsed.error.issues);
  }
  for (const key of pageKeys) {
    const documentKey = pageDocumentKey(key);
    if (!stored.has(documentKey)) continue;
    const parsed = parsePage(key, stored.get(documentKey));
    if (parsed.success) result.pages[key] = parsed.data;
    else console.error(`Content: stored "${documentKey}" is invalid, showing the bundled version.`, parsed.error.issues);
  }
  return result as unknown as ContentData;
});
