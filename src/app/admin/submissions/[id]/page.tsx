import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/session";
import { getSubmission, SUBMISSION_STATUSES } from "@/server/submissions";
import { deleteSubmissionAction, updateSubmissionAction } from "../../actions";
import { AdminPageHeader, AdminShell } from "@/components/admin/AdminShell";
import { formatDateTime, kindLabels, statusLabels } from "../../labels";
import { DeleteButton } from "./DeleteButton";

export const metadata: Metadata = { title: "Заявка" };

export default async function SubmissionPage({ params, searchParams }: PageProps<"/admin/submissions/[id]">) {
  const admin = await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();
  const submission = await getSubmission(id);
  if (!submission) notFound();

  return (
    <AdminShell admin={admin}>
      <div className="admin-narrow">
        <AdminPageHeader
          crumbs={[{ label: "Заявки", href: "/admin/submissions" }, { label: submission.contactName }]}
          title={submission.contactName}
          description={
            <>
              {kindLabels[submission.kind]} ·{" "}
              <time dateTime={submission.createdAt.toISOString()}>{formatDateTime(submission.createdAt)}</time>
            </>
          }
        />

        {query.saved && (
          <p className="admin-notice" role="status">
            Зміни збережено.
          </p>
        )}

        <dl className="admin-details">
          <div>
            <dt>Компанія</dt>
            <dd>{submission.companyName}</dd>
          </div>
          <div>
            <dt>Е-мейл</dt>
            <dd>
              <a href={`mailto:${submission.email}`}>{submission.email}</a>
            </dd>
          </div>
          <div>
            <dt>Телефон</dt>
            <dd>
              <a href={`tel:${submission.phone.replace(/[^\d+]/g, "")}`}>{submission.phone}</a>
            </dd>
          </div>
          {submission.recipientName && (
            <div>
              <dt>Кому</dt>
              <dd>{submission.recipientName}</dd>
            </div>
          )}
          <div>
            <dt>Мова сайту</dt>
            <dd>{submission.locale === "it" ? "Італійська" : "Українська"}</dd>
          </div>
          <div>
            <dt>Лист</dt>
            <dd>
              {submission.notifiedAt
                ? `Надіслано ${formatDateTime(submission.notifiedAt)} на ${submission.notifiedTo}`
                : submission.notifyError
                  ? `Не надіслано: ${submission.notifyError}`
                  : "Ще надсилається або пошту не налаштовано"}
            </dd>
          </div>
        </dl>

        <h2>Повідомлення</h2>
        <p className="admin-message">{submission.message}</p>

        <h2>Опрацювання</h2>
        <form className="admin-form" action={updateSubmissionAction}>
          <input type="hidden" name="id" value={submission.id} />
          <div className="admin-field">
            <label htmlFor="status">Статус</label>
            <select id="status" name="status" defaultValue={submission.status}>
              {SUBMISSION_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="note">Нотатка для команди</label>
            <textarea id="note" name="note" rows={5} maxLength={5000} defaultValue={submission.note} />
            <p className="admin-muted">Бачать лише адміністратори.</p>
          </div>
          <button className="btn" type="submit">
            Зберегти
          </button>
        </form>

        <form className="admin-delete" action={deleteSubmissionAction}>
          <input type="hidden" name="id" value={submission.id} />
          <DeleteButton />
        </form>
      </div>
    </AdminShell>
  );
}
