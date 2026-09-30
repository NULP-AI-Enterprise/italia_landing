import type { Metadata } from "next";
import Link from "next/link";
import { collections, pageDocumentKey, pages, type CollectionKey, type PageKey } from "@/content/registry";
import { loadContent } from "@/content/store";
import { requireAdmin } from "@/server/auth/session";
import { listDocumentMeta } from "@/server/content";
import { AdminHeader } from "../AdminHeader";
import { formatDateTime } from "../labels";

export const metadata: Metadata = { title: "Контент сайту" };

type Meta = Awaited<ReturnType<typeof listDocumentMeta>>;

function Changed({ meta, documentKey }: { meta: Meta; documentKey: string }) {
  const row = meta.get(documentKey);
  return (
    <span className="admin-muted">
      {row ? `Змінено ${formatDateTime(row.updatedAt)}${row.updatedBy ? `, ${row.updatedBy}` : ""}` : "Початковий вміст"}
    </span>
  );
}

export default async function ContentIndexPage() {
  const admin = await requireAdmin();
  const [meta, content] = await Promise.all([listDocumentMeta(), loadContent()]);

  return (
    <>
      <AdminHeader admin={admin} current="content" />
      <main className="admin-main" id="main">
        <h1>Контент сайту</h1>
        <p className="cms-lead">
          Зміни з’являються на сайті одразу після збереження. Тексти заповнюються українською та італійською.
        </p>

        <h2>Картки та списки</h2>
        <ul className="cms-cards">
          {(Object.keys(collections) as CollectionKey[]).map((key) => (
            <li key={key}>
              <Link className="cms-card" href={`/admin/content/${key}`}>
                <span className="cms-card-title">{collections[key].title}</span>
                <span className="cms-card-text">{collections[key].description}</span>
                <span className="cms-card-meta">
                  {content.collections[key].length} записів · <Changed meta={meta} documentKey={key} />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <h2>Сторінки</h2>
        <ul className="cms-cards">
          {(Object.keys(pages) as PageKey[]).map((key) => (
            <li key={key}>
              <Link className="cms-card" href={`/admin/content/pages/${key}`}>
                <span className="cms-card-title">{pages[key].title}</span>
                <span className="cms-card-text">{pages[key].description}</span>
                <span className="cms-card-meta">
                  <Changed meta={meta} documentKey={pageDocumentKey(key)} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
