import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { emptyValue } from "@/content/form-model";
import { collectionDef, isCollectionKey } from "@/content/registry";
import { loadContent } from "@/content/store";
import { requireAdmin } from "@/server/auth/session";
import { AdminHeader } from "../../../AdminHeader";

type Item = Record<string, unknown>;

export async function generateMetadata({ params }: PageProps<"/admin/content/[collection]/[id]">): Promise<Metadata> {
  const { collection, id } = await params;
  if (!isCollectionKey(collection)) return { title: "Контент" };
  return { title: `${collectionDef(collection).title}: ${id === "new" ? "новий запис" : id}` };
}

export default async function ItemEditorPage({ params, searchParams }: PageProps<"/admin/content/[collection]/[id]">) {
  const admin = await requireAdmin();
  const { collection, id } = await params;
  if (!isCollectionKey(collection)) notFound();
  const query = await searchParams;
  const def = collectionDef(collection);
  const content = await loadContent();

  const isNew = id === "new";
  if (isNew && def.fixed) notFound();
  const existing = (content.collections[collection] as Item[]).find((item) => item[def.idKey] === id);
  if (!isNew && !existing) notFound();

  const initial = existing ?? {
    ...(emptyValue(def.item) as Item),
    ...("published" in (emptyValue(def.item) as Item) ? { published: true } : {}),
    ...(collection === "partners" && typeof query.category === "string" ? { category: query.category } : {}),
  };

  const { industries, regions } = content.collections;
  const refs: Record<string, { value: string; label: string }[]> =
    collection === "members"
      ? {
          industries: [...industries].sort((a, b) => a.order - b.order).map((i) => ({ value: i.id, label: i.name.uk })),
          regions: [...regions]
            .sort((a, b) => a.name.uk.localeCompare(b.name.uk, "uk"))
            .map((r) => ({ value: r.code, label: r.name.uk })),
        }
      : {};

  const listHref = `/admin/content/${collection}`;
  return (
    <>
      <AdminHeader admin={admin} current="content" />
      <main className="admin-main admin-narrow" id="main">
        <p className="admin-muted">
          <Link href="/admin/content">Контент сайту</Link> / <Link href={listHref}>{def.title}</Link>
        </p>
        <h1>{isNew ? "Новий запис" : def.label(existing!)}</h1>
        {query.created && (
          <p className="admin-notice" role="status">
            Створено. Сайт оновлено.
          </p>
        )}
        <ContentEditor
          mode="item"
          collection={collection}
          originalId={isNew ? null : id}
          initial={initial}
          refs={refs}
          backHref={listHref}
          siteHref={def.sitePath}
        />
      </main>
    </>
  );
}
