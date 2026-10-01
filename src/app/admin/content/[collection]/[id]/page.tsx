import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader, AdminShell } from "@/components/admin/AdminShell";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { SectionTabs } from "@/components/admin/SectionTabs";
import { emptyValue } from "@/content/form-model";
import { collectionDef, isCollectionKey, sectionFor } from "@/content/registry";
import { loadContent } from "@/content/store";
import { requireAdmin } from "@/server/auth/session";


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
  const section = sectionFor("collection", collection);
  const title = isNew ? "Новий запис" : def.label(existing!);
  const back =
    collection === "partners" && typeof initial.category === "string" ? `${listHref}?category=${initial.category}` : listHref;
  return (
    <AdminShell admin={admin}>
      <AdminPageHeader
        crumbs={[
          { label: "Огляд", href: "/admin" },
          { label: section?.title ?? def.title, href: back },
          { label: title },
        ]}
        title={title}
        description={def.details && !isNew ? def.details(existing!) : def.description}
      />
      <SectionTabs kind="collection" docKey={collection} />
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
        itemLabel={isNew ? undefined : title}
      />
    </AdminShell>
  );
}
