import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader, AdminShell } from "@/components/admin/AdminShell";
import { CollectionBrowser, type BrowserItem } from "@/components/admin/CollectionBrowser";
import { SectionTabs } from "@/components/admin/SectionTabs";
import { collectionDef, enumLabels, isCollectionKey, sectionFor } from "@/content/registry";
import { loadContent } from "@/content/store";
import { requireAdmin } from "@/server/auth/session";
import { listDocumentMeta } from "@/server/content";
import { formatDateTime } from "../../labels";

type Item = Record<string, unknown>;

const PARTNER_CATEGORIES = ["association", "rebuild", "institutional"];

/** First picture of an item, for the card. */
function thumbOf(item: Item): string | undefined {
  for (const key of ["photo", "image", "logo"]) {
    const media = item[key] as { src?: string } | undefined;
    if (media?.src) return media.src;
  }
  const contact = item.contact as { photo?: { src?: string } } | undefined;
  return contact?.photo?.src;
}

export async function generateMetadata({ params }: PageProps<"/admin/content/[collection]">): Promise<Metadata> {
  const { collection } = await params;
  return { title: isCollectionKey(collection) ? collectionDef(collection).title : "Контент" };
}

export default async function CollectionPage({ params, searchParams }: PageProps<"/admin/content/[collection]">) {
  const admin = await requireAdmin();
  const { collection } = await params;
  if (!isCollectionKey(collection)) notFound();
  const query = await searchParams;
  const def = collectionDef(collection);
  const [content, meta] = await Promise.all([loadContent(), listDocumentMeta()]);
  const section = sectionFor("collection", collection);

  // Partners are shown per page of the site; the other lists in full.
  const category =
    collection === "partners"
      ? typeof query.category === "string" && PARTNER_CATEGORIES.includes(query.category)
        ? query.category
        : "association"
      : "";
  const all = content.collections[collection] as Item[];
  const items: BrowserItem[] = (category ? all.filter((item) => item.category === category) : [...all])
    .sort(def.ordered ? (a, b) => Number(a.order) - Number(b.order) : def.sort)
    .map((item) => ({
      id: String(item[def.idKey]),
      label: def.label(item),
      details: def.details?.(item),
      thumb: thumbOf(item),
      published: typeof item.published === "boolean" ? item.published : undefined,
    }));
  const row = meta.get(collection);
  const base = `/admin/content/${collection}`;

  return (
    <AdminShell admin={admin}>
      <AdminPageHeader
        crumbs={[{ label: "Огляд", href: "/admin" }, { label: section?.title ?? def.title }]}
        title={section?.title ?? def.title}
        description={
          <>
            {def.description}{" "}
            <span className="adm-muted">
              {row ? `Змінено ${formatDateTime(row.updatedAt)}${row.updatedBy ? `, ${row.updatedBy}` : ""}.` : ""}
            </span>
          </>
        }
        actions={
          <>
            <a className="adm-button adm-button-quiet" href={def.sitePath} target="_blank" rel="noopener noreferrer">
              На сайті ↗<span className="visually-hidden"> (відкривається в новій вкладці)</span>
            </a>
            {!def.fixed && (
              <Link className="adm-button" href={`${base}/new${category ? `?category=${category}` : ""}`}>
                + Додати
              </Link>
            )}
          </>
        }
      />
      <SectionTabs kind="collection" docKey={collection} />

      {typeof query.error === "string" && (
        <p className="admin-alert" role="alert">
          Не видалено: {query.error}
        </p>
      )}
      {query.deleted && (
        <p className="admin-notice" role="status">
          Видалено. Сайт оновлено.
        </p>
      )}

      {collection === "partners" && (
        <nav className="adm-filter" aria-label="Сторінка партнерів">
          {PARTNER_CATEGORIES.map((value) => (
            <Link key={value} href={`${base}?category=${value}`} aria-current={category === value ? "page" : undefined}>
              {enumLabels[value]} <span>{all.filter((item) => item.category === value).length}</span>
            </Link>
          ))}
        </nav>
      )}

      {def.ordered && items.length > 1 && (
        <p className="adm-muted adm-hint-line">Порядок карток тут = порядок на сайті. Стрілки ↑ ↓ змінюють його одразу.</p>
      )}
      <CollectionBrowser
        key={category}
        collection={collection}
        items={items}
        ordered={def.ordered}
        filter={category || undefined}
        base={base}
      />
    </AdminShell>
  );
}
