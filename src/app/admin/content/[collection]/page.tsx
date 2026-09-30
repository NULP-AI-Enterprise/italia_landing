import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { collectionDef, enumLabels, isCollectionKey } from "@/content/registry";
import { loadContent } from "@/content/store";
import { requireAdmin } from "@/server/auth/session";
import { listDocumentMeta } from "@/server/content";
import { AdminHeader } from "../../AdminHeader";
import { formatDateTime } from "../../labels";
import { deleteItemAction, moveItemAction } from "../actions";

type Item = Record<string, unknown>;

const PARTNER_CATEGORIES = ["association", "rebuild", "institutional"];

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

  // Partners are shown per page of the site; the other lists in full.
  const category =
    collection === "partners" && typeof query.category === "string" && PARTNER_CATEGORIES.includes(query.category)
      ? query.category
      : collection === "partners"
        ? "association"
        : "";
  const all = content.collections[collection] as Item[];
  const items = (category ? all.filter((item) => item.category === category) : [...all]).sort(
    def.ordered ? (a, b) => Number(a.order) - Number(b.order) : def.sort,
  );
  const row = meta.get(collection);
  const base = `/admin/content/${collection}`;

  return (
    <>
      <AdminHeader admin={admin} current="content" />
      <main className="admin-main" id="main">
        <p className="admin-muted">
          <Link href="/admin/content">Контент сайту</Link>
        </p>
        <div className="cms-heading">
          <h1>{def.title}</h1>
          {!def.fixed && (
            <Link className="btn" href={`${base}/new${category ? `?category=${category}` : ""}`}>
              + Додати
            </Link>
          )}
        </div>
        <p className="cms-lead">
          {def.description}{" "}
          <span className="admin-muted">
            {row ? `Змінено ${formatDateTime(row.updatedAt)}${row.updatedBy ? `, ${row.updatedBy}` : ""}.` : "Початковий вміст."}
          </span>
        </p>

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
          <nav className="admin-tabs" aria-label="Сторінка партнерів">
            {PARTNER_CATEGORIES.map((value) => (
              <Link key={value} href={`${base}?category=${value}`} aria-current={category === value ? "page" : undefined}>
                {enumLabels[value]} <span>{all.filter((item) => item.category === value).length}</span>
              </Link>
            ))}
          </nav>
        )}

        {items.length === 0 ? (
          <p className="admin-empty">Тут поки порожньо. Натисніть «Додати».</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table cms-table">
              <caption className="visually-hidden">{def.title}</caption>
              <thead>
                <tr>
                  {def.ordered && <th scope="col">Порядок</th>}
                  <th scope="col">Назва</th>
                  <th scope="col">На сайті</th>
                  <th scope="col">
                    <span className="visually-hidden">Дії</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const id = String(item[def.idKey]);
                  const label = def.label(item);
                  return (
                    <tr key={id} id={`item-${id}`}>
                      {def.ordered && (
                        <td className="cms-order">
                          {(["up", "down"] as const).map((direction) => (
                            <form action={moveItemAction} key={direction}>
                              <input type="hidden" name="collection" value={collection} />
                              <input type="hidden" name="id" value={id} />
                              <input type="hidden" name="direction" value={direction} />
                              {category && <input type="hidden" name="filter" value={category} />}
                              <button
                                type="submit"
                                className="cms-icon"
                                disabled={direction === "up" ? index === 0 : index === items.length - 1}
                                aria-label={`${direction === "up" ? "Вище" : "Нижче"}: ${label}`}
                              >
                                {direction === "up" ? "↑" : "↓"}
                              </button>
                            </form>
                          ))}
                        </td>
                      )}
                      <td>
                        <Link className="admin-row-link" href={`${base}/${id}`}>
                          {label}
                        </Link>
                        {def.details && <span className="admin-muted">{def.details(item)}</span>}
                      </td>
                      <td>
                        {"published" in item ? (
                          <span className="admin-badge" data-status={item.published ? "done" : "spam"}>
                            {item.published ? "Показано" : "Приховано"}
                          </span>
                        ) : (
                          <span className="admin-badge" data-status="done">
                            Показано
                          </span>
                        )}
                      </td>
                      <td className="cms-actions">
                        <Link href={`${base}/${id}`} aria-label={`Редагувати: ${label}`}>
                          Редагувати
                        </Link>
                        {!def.fixed && (
                          <form action={deleteItemAction}>
                            <input type="hidden" name="collection" value={collection} />
                            <input type="hidden" name="id" value={id} />
                            {category && <input type="hidden" name="filter" value={category} />}
                            <ConfirmButton
                              className="cms-link-danger"
                              label={`Видалити: ${label}`}
                              question={`Видалити «${label}»? Цю дію не можна скасувати.`}
                            >
                              Видалити
                            </ConfirmButton>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
