import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { isPageKey, pageDef } from "@/content/registry";
import { loadContent } from "@/content/store";
import { requireAdmin } from "@/server/auth/session";
import { AdminHeader } from "../../../AdminHeader";

export async function generateMetadata({ params }: PageProps<"/admin/content/pages/[page]">): Promise<Metadata> {
  const { page } = await params;
  return { title: isPageKey(page) ? `Сторінка: ${pageDef(page).title}` : "Сторінка" };
}

export default async function PageEditorPage({ params }: PageProps<"/admin/content/pages/[page]">) {
  const admin = await requireAdmin();
  const { page } = await params;
  if (!isPageKey(page)) notFound();
  const content = await loadContent();
  const def = pageDef(page);

  return (
    <>
      <AdminHeader admin={admin} current="content" />
      <main className="admin-main admin-narrow" id="main">
        <p className="admin-muted">Сторінка</p>
        <h1>{def.title}</h1>
        <ContentEditor
          mode="page"
          page={page}
          initial={content.pages[page]}
          refs={{}}
          backHref="/admin/content"
          siteHref={def.sitePath}
        />
      </main>
    </>
  );
}
