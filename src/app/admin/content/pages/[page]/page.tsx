import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader, AdminShell } from "@/components/admin/AdminShell";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { SectionTabs } from "@/components/admin/SectionTabs";
import { isPageKey, pageDef, pageDocumentKey, sectionFor } from "@/content/registry";
import { loadContent } from "@/content/store";
import { requireAdmin } from "@/server/auth/session";
import { listDocumentMeta } from "@/server/content";
import { formatDateTime } from "../../../labels";

export async function generateMetadata({ params }: PageProps<"/admin/content/pages/[page]">): Promise<Metadata> {
  const { page } = await params;
  return { title: isPageKey(page) ? `Сторінка: ${pageDef(page).title}` : "Сторінка" };
}

export default async function PageEditorPage({ params }: PageProps<"/admin/content/pages/[page]">) {
  const admin = await requireAdmin();
  const { page } = await params;
  if (!isPageKey(page)) notFound();
  const [content, meta] = await Promise.all([loadContent(), listDocumentMeta()]);
  const def = pageDef(page);
  const section = sectionFor("page", page);
  const row = meta.get(pageDocumentKey(page));

  return (
    <AdminShell admin={admin}>
      <AdminPageHeader
        crumbs={[{ label: "Огляд", href: "/admin" }, { label: section?.title ?? def.title }]}
        title={section && section.links.length > 1 ? `${section.title}: ${def.title}` : def.title}
        description={def.description}
      />
      <SectionTabs kind="page" docKey={page} />
      <ContentEditor
        mode="page"
        page={page}
        initial={content.pages[page]}
        refs={{}}
        backHref="/admin"
        siteHref={def.sitePath}
        lastSaved={row ? `Змінено ${formatDateTime(row.updatedAt)}${row.updatedBy ? `, ${row.updatedBy}` : ""}` : "Ще не змінювалась"}
      />
    </AdminShell>
  );
}
