import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader, AdminShell } from "@/components/admin/AdminShell";
import {
  collectionDef,
  pageDef,
  pageDocumentKey,
  sectionLinkHref,
  siteSections,
  type SectionLink,
} from "@/content/registry";
import { loadContent } from "@/content/store";
import { requireAdmin } from "@/server/auth/session";
import { listDocumentMeta } from "@/server/content";
import { countByStatus, listSubmissions } from "@/server/submissions";
import { formatDateTime, kindLabels } from "./labels";

export const metadata: Metadata = { title: "Огляд" };

const documentKey = (link: SectionLink) => (link.kind === "collection" ? link.key : pageDocumentKey(link.key));
const linkTitle = (link: SectionLink) =>
  link.kind === "collection" ? collectionDef(link.key).title : `Сторінка «${pageDef(link.key).title}»`;

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const [counts, latest, meta, content] = await Promise.all([
    countByStatus(),
    listSubmissions({ status: "new" }, 5),
    listDocumentMeta(),
    loadContent(),
  ]);

  const edits = siteSections
    .flatMap((section) => section.links.map((link) => ({ link, row: meta.get(documentKey(link)) })))
    .filter((entry) => entry.row)
    .sort((a, b) => b.row!.updatedAt.getTime() - a.row!.updatedAt.getTime())
    .slice(0, 6);

  return (
    <AdminShell admin={admin}>
      <AdminPageHeader
        title={`Вітаємо, ${admin.name}`}
        description="Тут видно нові заявки і всі сторінки сайту. Зміни з’являються на сайті одразу після збереження."
      />

      <section className="adm-panel" aria-labelledby="new-requests">
        <div className="adm-panel-head">
          <h2 id="new-requests">Нові заявки</h2>
          <Link className="adm-button adm-button-quiet" href="/admin/submissions">
            Усі заявки
          </Link>
        </div>
        {latest.length === 0 ? (
          <p className="adm-empty-line">Нових заявок немає.</p>
        ) : (
          <ul className="adm-requests">
            {latest.slice(0, 5).map((row) => (
              <li key={row.id}>
                <Link href={`/admin/submissions/${row.id}`}>
                  <strong>{row.contactName}</strong>
                  <span>
                    {row.companyName} · {kindLabels[row.kind]}
                  </span>
                </Link>
                <time dateTime={row.createdAt.toISOString()}>{formatDateTime(row.createdAt)}</time>
              </li>
            ))}
          </ul>
        )}
        <p className="adm-panel-foot">
          Нових: {counts.new} · у роботі: {counts.in_progress} · опрацьовано: {counts.done}
        </p>
      </section>

      <h2 className="adm-section-title">Сторінки сайту</h2>
      <ul className="adm-sections">
        {siteSections.map((section) => (
          <li key={section.id} className="adm-section">
            <div className="adm-section-head">
              <h3>
                <Link href={sectionLinkHref(section.links[0])}>{section.title}</Link>
              </h3>
              <a className="adm-site-link" href={section.sitePath} target="_blank" rel="noopener noreferrer">
                На сайті ↗<span className="visually-hidden"> (відкривається в новій вкладці)</span>
              </a>
            </div>
            <p>{section.description}</p>
            <ul className="adm-section-links">
              {section.links.map((link) => (
                <li key={sectionLinkHref(link)}>
                  <Link href={sectionLinkHref(link)}>
                    {link.label}
                    {link.kind === "collection" && (
                      <span className="adm-count">{content.collections[link.key].length}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {edits.length > 0 && (
        <section className="adm-panel" aria-labelledby="recent-edits">
          <h2 id="recent-edits">Останні зміни</h2>
          <ul className="adm-edits">
            {edits.map(({ link, row }) => (
              <li key={sectionLinkHref(link)}>
                <Link href={sectionLinkHref(link)}>{linkTitle(link)}</Link>
                <span>
                  {formatDateTime(row!.updatedAt)}
                  {row!.updatedBy ? ` · ${row!.updatedBy}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AdminShell>
  );
}
