/**
 * Loads all editable content (server only).
 *
 * Documents saved in the admin panel live in the database table
 * content_documents; anything not saved there yet comes from the bundled JSON
 * in /content. Every document is validated with its schema, so a broken row can
 * never break the site: it is logged and the bundled version is used instead.
 */
import { inArray, sql } from "drizzle-orm";
import { cache } from "react";
import { z } from "zod";
import { getDb, schema } from "@/server/db/client";
import { collectionDef, collections, pageDocumentKey, pages, type CollectionKey, type PageKey } from "./registry";
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

/* ---------- Bundled additions reach edited collections ---------- */

type Item = Record<string, unknown>;

/** Row that remembers which bundled items a stored collection has already received. */
export const seedStateKey = (key: CollectionKey) => `seed-state:${key}`;

const isEmpty = (value: unknown) =>
  value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);

/**
 * Adds items that were added to the bundled JSON after the collection was edited
 * in the admin panel. Items an editor deleted stay deleted: their ids are in
 * `applied`. On the very first merge (no record yet) existing items also get the
 * fields they lack, without touching anything an editor filled in.
 */
export function mergeBundled(key: CollectionKey, stored: Item[], bundled: Item[], applied: Set<string> | null) {
  const { idKey, ordered } = collectionDef(key);
  const storedIds = new Set(stored.map((item) => String(item[idKey])));
  let changed = false;

  const items = stored.map((item) => {
    if (applied) return item;
    const fresh = bundled.find((candidate) => candidate[idKey] === item[idKey]);
    if (!fresh) return item;
    const filled = { ...item };
    for (const [field, value] of Object.entries(fresh)) {
      if (field === "order" || field === "published") continue;
      if (isEmpty(filled[field]) && !isEmpty(value)) {
        filled[field] = value;
        changed = true;
      }
    }
    return filled;
  });

  let nextOrder = Math.max(0, ...items.map((item) => Number(item.order) || 0));
  for (const item of bundled) {
    const id = String(item[idKey]);
    if (storedIds.has(id) || applied?.has(id)) continue;
    items.push(ordered ? { ...item, order: ++nextOrder } : { ...item });
    changed = true;
  }
  return { items, changed };
}

/**
 * One-off changes to collections that are already stored in the database (the
 * bundled JSON only reaches them as new items). Each runs once per database;
 * applied ids are kept in the row "content-migrations".
 */
const contentMigrations: { id: string; collection: CollectionKey; run: (items: Item[]) => boolean }[] = [
  {
    id: "2026-10-pin-thesis-i",
    collection: "members",
    run: (items) => {
      const thesis = items.find((item) => item.id === "thesis-i");
      if (!thesis || thesis.pinned !== undefined) return false;
      thesis.pinned = true;
      return true;
    },
  },
];
const MIGRATIONS_KEY = "content-migrations";

let bundledSync: Promise<void> | undefined;

/** Once per server process: merge bundled additions into collections stored in the database. */
function syncBundledContent() {
  bundledSync ??= (async () => {
    const db = await getDb();
    const keys = Object.keys(collections) as CollectionKey[];
    const rows = await db
      .select({ key: schema.contentDocuments.key, data: schema.contentDocuments.data })
      .from(schema.contentDocuments)
      .where(inArray(schema.contentDocuments.key, [...keys, ...keys.map(seedStateKey), MIGRATIONS_KEY]));
    const stored = new Map(rows.map((row) => [row.key, row.data]));
    const write = (key: CollectionKey, items: Item[]) =>
      db
        .update(schema.contentDocuments)
        .set({ data: items, updatedAt: sql`now()` })
        .where(inArray(schema.contentDocuments.key, [key]));

    for (const key of keys) {
      const current = stored.get(key);
      if (!Array.isArray(current)) continue;
      const bundled = seedCollections[key] as Item[];
      const state = stored.get(seedStateKey(key)) as { ids?: string[] } | undefined;
      const applied = state?.ids ? new Set(state.ids) : null;
      const { items, changed } = mergeBundled(key, current as Item[], bundled, applied);

      if (changed) {
        if (!parseCollection(key, items).success) {
          console.error(`Content: bundled additions for "${key}" do not fit the stored data; skipped.`);
          continue;
        }
        await write(key, items);
        stored.set(key, items);
        console.info(`Content: added bundled items to "${key}".`);
      }
      const ids = [...new Set([...(applied ?? []), ...bundled.map((item) => String(item[collectionDef(key).idKey]))])];
      if (!applied || ids.length !== applied.size) await rememberBundled(key, ids);
    }

    const done = new Set(((stored.get(MIGRATIONS_KEY) as { ids?: string[] } | undefined)?.ids ?? []) as string[]);
    const pending = contentMigrations.filter((migration) => !done.has(migration.id));
    for (const migration of pending) {
      const current = stored.get(migration.collection);
      if (Array.isArray(current)) {
        const items = structuredClone(current) as Item[];
        if (migration.run(items) && parseCollection(migration.collection, items).success) {
          await write(migration.collection, items);
          stored.set(migration.collection, items);
          console.info(`Content: applied "${migration.id}".`);
        }
      }
      done.add(migration.id);
    }
    if (pending.length) {
      const data = { ids: [...done] };
      await db
        .insert(schema.contentDocuments)
        .values({ key: MIGRATIONS_KEY, data })
        .onConflictDoUpdate({ target: schema.contentDocuments.key, set: { data, updatedAt: sql`now()` } });
    }
  })().catch((error: unknown) => {
    bundledSync = undefined;
    console.error("Content: could not merge bundled additions.", error);
  });
  return bundledSync;
}

/** Records the bundled items a stored collection has seen (called on every save from the admin panel too). */
export async function rememberBundled(key: CollectionKey, ids?: string[]) {
  const db = await getDb();
  const data = { ids: ids ?? (seedCollections[key] as Item[]).map((item) => String(item[collectionDef(key).idKey])) };
  await db
    .insert(schema.contentDocuments)
    .values({ key: seedStateKey(key), data })
    .onConflictDoUpdate({ target: schema.contentDocuments.key, set: { data, updatedAt: sql`now()` } });
}

/**
 * After the first save of a collection: items bundled at that moment count as seen,
 * so a later deploy does not bring back the ones the editor deleted.
 */
export async function rememberBundledIfNew(key: CollectionKey) {
  const db = await getDb();
  const ids = (seedCollections[key] as Item[]).map((item) => String(item[collectionDef(key).idKey]));
  await db
    .insert(schema.contentDocuments)
    .values({ key: seedStateKey(key), data: { ids } })
    .onConflictDoNothing({ target: schema.contentDocuments.key });
}

/* ---------- Runtime loading ---------- */

async function readStoredDocuments(): Promise<Map<string, unknown>> {
  // A production build has no database; it only needs the bundled content.
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") return new Map();
  try {
    await syncBundledContent();
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
