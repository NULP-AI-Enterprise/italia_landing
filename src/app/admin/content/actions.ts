"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cleanValue, toFieldErrors, type FieldError } from "@/content/form-model";
import { collectionDef, isCollectionKey, isPageKey, pageDef, pageDocumentKey, type CollectionKey } from "@/content/registry";
import { crossCheck, loadContent, parseCollection, parsePage, type ContentData } from "@/content/store";
import { requireAdmin } from "@/server/auth/session";
import { saveDocument } from "@/server/content";

export type SaveResult = { ok: true; id?: string } | { ok: false; message: string; errors: FieldError[] };

const invalid = (errors: FieldError[]): SaveResult => ({
  ok: false,
  message: "Не збережено: виправте позначені поля.",
  errors,
});

/** Every page shows shared content (menus, partners, events…), so a save refreshes the whole site. */
function refreshSite() {
  revalidatePath("/", "layout");
}

function parseJson(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

export async function savePageAction(page: string, json: string): Promise<SaveResult> {
  const admin = await requireAdmin();
  if (!isPageKey(page)) return { ok: false, message: "Невідома сторінка.", errors: [] };

  const value = cleanValue(pageDef(page).schema, parseJson(json));
  const parsed = parsePage(page, value);
  if (!parsed.success) return invalid(toFieldErrors(parsed.error.issues));

  await saveDocument(pageDocumentKey(page), parsed.data, admin.id);
  refreshSite();
  return { ok: true };
}

type Item = Record<string, unknown>;

async function writeCollection(key: CollectionKey, items: Item[], adminId: string, focusId?: string) {
  const parsed = parseCollection(key, items);
  if (!parsed.success) {
    // Errors inside the edited item are shown on its fields.
    const index = items.findIndex((item) => item[collectionDef(key).idKey] === focusId);
    const own = parsed.error.issues.filter((issue) => issue.path[0] === index);
    return invalid(toFieldErrors(own.map((issue) => ({ ...issue, path: issue.path.slice(1) }))));
  }

  const content = await loadContent();
  const next: ContentData = { ...content, collections: { ...content.collections, [key]: parsed.data } };
  const problems = crossCheck(next);
  if (problems.length) {
    return { ok: false as const, message: problems.map((p) => p.message).join(". "), errors: [] };
  }

  await saveDocument(key, parsed.data, adminId);
  refreshSite();
  return null;
}

/**
 * Creates (originalId = null) or updates one item of a collection.
 * The id of an existing item never changes; a new item goes to the end of the order.
 */
export async function saveItemAction(collection: string, originalId: string | null, json: string): Promise<SaveResult> {
  const admin = await requireAdmin();
  if (!isCollectionKey(collection)) return { ok: false, message: "Невідомий розділ.", errors: [] };
  const def = collectionDef(collection);

  const item = cleanValue(def.item, parseJson(json)) as Item | undefined;
  if (!item || typeof item !== "object") return invalid([]);

  const current = (await loadContent()).collections[collection] as Item[];
  const items = [...current];

  if (originalId === null) {
    if (def.fixed) return { ok: false, message: "У цьому розділі не можна додавати записи.", errors: [] };
    const id = String(item[def.idKey] ?? "");
    if (items.some((existing) => existing[def.idKey] === id)) {
      return invalid([{ path: def.idKey, message: "Такий ідентифікатор уже є. Змініть його." }]);
    }
    if (def.ordered) item.order = Math.max(0, ...items.map((existing) => Number(existing.order) || 0)) + 1;
    items.push(item);
  } else {
    const index = items.findIndex((existing) => existing[def.idKey] === originalId);
    if (index === -1) return { ok: false, message: "Запис не знайдено: його могли видалити.", errors: [] };
    item[def.idKey] = originalId;
    if (def.ordered) item.order = items[index].order;
    items[index] = item;
  }

  const id = String(item[def.idKey]);
  const failure = await writeCollection(collection, items, admin.id, id);
  return failure ?? { ok: true, id };
}

export async function deleteItemAction(formData: FormData) {
  const admin = await requireAdmin();
  const collection = String(formData.get("collection"));
  const id = String(formData.get("id"));
  if (!isCollectionKey(collection) || collectionDef(collection).fixed) redirect("/admin/content");
  const def = collectionDef(collection);

  const items = ((await loadContent()).collections[collection] as Item[]).filter((item) => item[def.idKey] !== id);
  const failure = await writeCollection(collection, items, admin.id);
  const filter = String(formData.get("filter") ?? "");
  const back = `/admin/content/${collection}?${filter ? `category=${encodeURIComponent(filter)}&` : ""}`;
  if (failure && !failure.ok) redirect(`${back}error=${encodeURIComponent(failure.message)}`);
  redirect(`${back}deleted=1`);
}

/** Swaps an item with its neighbour in an ordered collection. */
export async function moveItemAction(formData: FormData) {
  const admin = await requireAdmin();
  const collection = String(formData.get("collection"));
  const id = String(formData.get("id"));
  const direction = formData.get("direction") === "up" ? -1 : 1;
  if (!isCollectionKey(collection) || !collectionDef(collection).ordered) redirect("/admin/content");
  const filter = String(formData.get("filter") ?? "");

  const items = structuredClone((await loadContent()).collections[collection] as Item[]).sort(
    (a, b) => Number(a.order) - Number(b.order),
  );
  // Renumber 1, 2, 3… so equal numbers in older data cannot block a move.
  items.forEach((item, index) => (item.order = index + 1));
  // Partners are ordered within their page, so they move among items of the same category.
  const peers = filter ? items.filter((item) => item.category === filter) : items;
  const position = peers.findIndex((item) => item.id === id);
  const neighbour = peers[position + direction];
  if (position !== -1 && neighbour) {
    const current = peers[position];
    [current.order, neighbour.order] = [neighbour.order, current.order];
    await writeCollection(collection, items, admin.id);
  }
  redirect(`/admin/content/${collection}${filter ? `?category=${filter}` : ""}#item-${id}`);
}
