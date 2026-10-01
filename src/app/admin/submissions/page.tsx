import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/session";
import type { SubmissionKind, SubmissionStatus } from "@/server/db/schema";
import { countByStatus, listSubmissions, SUBMISSION_KINDS, SUBMISSION_STATUSES } from "@/server/submissions";
import { AdminPageHeader, AdminShell } from "@/components/admin/AdminShell";
import { formatDateTime, kindLabels, statusLabels } from "../labels";

export const metadata: Metadata = { title: "Заявки" };

const pick = <T extends string>(value: unknown, allowed: readonly T[]) =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;

export default async function SubmissionsPage({ searchParams }: PageProps<"/admin/submissions">) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const status = pick<SubmissionStatus>(params.status, SUBMISSION_STATUSES);
  const kind = pick<SubmissionKind>(params.kind, SUBMISSION_KINDS);
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";

  const [rows, counts] = await Promise.all([
    listSubmissions({ status, kind, query: query || undefined }),
    countByStatus(),
  ]);
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  const statusHref = (value?: SubmissionStatus) => {
    const next = new URLSearchParams();
    if (value) next.set("status", value);
    if (kind) next.set("kind", kind);
    if (query) next.set("q", query);
    const search = next.toString();
    return search ? `/admin/submissions?${search}` : "/admin/submissions";
  };

  return (
    <AdminShell admin={admin}>
        <AdminPageHeader
          title="Заявки"
          description="Звернення з форм «Приєднатися» та «Зв’язатися». Нові спершу."
        />
        {params.deleted && (
          <p className="admin-notice" role="status">
            Заявку видалено.
          </p>
        )}

        <nav className="admin-tabs" aria-label="Статус заявок">
          <Link href={statusHref()} aria-current={!status ? "page" : undefined}>
            Усі <span>{total}</span>
          </Link>
          {SUBMISSION_STATUSES.map((value) => (
            <Link key={value} href={statusHref(value)} aria-current={status === value ? "page" : undefined}>
              {statusLabels[value]} <span>{counts[value]}</span>
            </Link>
          ))}
        </nav>

        <form className="admin-filters" method="get" role="search" aria-label="Пошук заявок">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="admin-field">
            <label htmlFor="q">Пошук</label>
            <input id="q" name="q" type="search" defaultValue={query} placeholder="Ім’я, компанія, е-мейл або телефон" />
          </div>
          <div className="admin-field">
            <label htmlFor="kind">Тип</label>
            <select id="kind" name="kind" defaultValue={kind ?? ""}>
              <option value="">Усі типи</option>
              {SUBMISSION_KINDS.map((value) => (
                <option key={value} value={value}>
                  {kindLabels[value]}
                </option>
              ))}
            </select>
          </div>
          <button className="btn" type="submit">
            Показати
          </button>
        </form>

        {rows.length === 0 ? (
          <div className="admin-empty">
            <p>
              <strong>Заявок не знайдено.</strong>
            </p>
            <p className="admin-muted">
              Нові заявки з’являться тут, щойно відвідувачі надішлють форму «Приєднатися» або «Зв’язатися».
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <caption className="visually-hidden">Список заявок, спочатку новіші</caption>
              <thead>
                <tr>
                  <th scope="col">Дата</th>
                  <th scope="col">Контакт</th>
                  <th scope="col">Тип</th>
                  <th scope="col">Е-мейл і телефон</th>
                  <th scope="col">Статус</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <time dateTime={row.createdAt.toISOString()}>{formatDateTime(row.createdAt)}</time>
                    </td>
                    <td>
                      <Link className="admin-row-link" href={`/admin/submissions/${row.id}`}>
                        {row.contactName}
                      </Link>
                      <span className="admin-muted">{row.companyName}</span>
                    </td>
                    <td>
                      {kindLabels[row.kind]}
                      {row.recipientName && <span className="admin-muted">Для: {row.recipientName}</span>}
                    </td>
                    <td>
                      <a href={`mailto:${row.email}`}>{row.email}</a>
                      <a href={`tel:${row.phone.replace(/[^\d+]/g, "")}`}>{row.phone}</a>
                    </td>
                    <td>
                      <span className="admin-badge" data-status={row.status}>
                        {statusLabels[row.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </AdminShell>
  );
}
