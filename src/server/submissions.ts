/**
 * Submissions ("Join" and "Contact" requests): the CRM data layer.
 */
import { and, count, desc, eq, gte, ilike, or, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/server/db/client";
import type { SubmissionKind, SubmissionStatus } from "@/server/db/schema";

export const SUBMISSION_STATUSES = schema.submissionStatus.enumValues;
export const SUBMISSION_KINDS = schema.submissionKind.enumValues;

type NewSubmission = typeof schema.submissions.$inferInsert;

export async function createSubmission(values: NewSubmission) {
  const db = await getDb();
  const [row] = await db.insert(schema.submissions).values(values).returning({ id: schema.submissions.id });
  return row.id;
}

/** Records what happened to the e-mail about a request. */
export async function markNotified(id: string, result: { sent: true; to: string } | { sent: false; reason: string }) {
  const db = await getDb();
  await db
    .update(schema.submissions)
    .set(
      result.sent
        ? { notifiedAt: new Date(), notifiedTo: result.to, notifyError: null }
        : { notifiedAt: null, notifiedTo: null, notifyError: result.reason },
    )
    .where(eq(schema.submissions.id, id));
}

/** How many requests came from this sender since the given moment (rate limiting). */
export async function countRecentFromSender(ipHash: string, since: Date) {
  const db = await getDb();
  const [{ value }] = await db
    .select({ value: count() })
    .from(schema.submissions)
    .where(and(eq(schema.submissions.ipHash, ipHash), gte(schema.submissions.createdAt, since)));
  return value;
}

export type SubmissionFilters = {
  status?: SubmissionStatus;
  kind?: SubmissionKind;
  query?: string;
};

export async function listSubmissions({ status, kind, query }: SubmissionFilters, limit = 200) {
  const db = await getDb();
  const conditions: SQL[] = [];
  if (status) conditions.push(eq(schema.submissions.status, status));
  if (kind) conditions.push(eq(schema.submissions.kind, kind));
  if (query) {
    const pattern = `%${query.replace(/[%_\\]/g, "\\$&")}%`;
    const match = or(
      ilike(schema.submissions.contactName, pattern),
      ilike(schema.submissions.companyName, pattern),
      ilike(schema.submissions.email, pattern),
      ilike(schema.submissions.phone, pattern),
    );
    if (match) conditions.push(match);
  }
  return db
    .select()
    .from(schema.submissions)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(schema.submissions.createdAt))
    .limit(limit);
}

export async function countByStatus() {
  const db = await getDb();
  const rows = await db
    .select({ status: schema.submissions.status, value: count() })
    .from(schema.submissions)
    .groupBy(schema.submissions.status);
  const counts = Object.fromEntries(SUBMISSION_STATUSES.map((s) => [s, 0])) as Record<SubmissionStatus, number>;
  for (const row of rows) counts[row.status] = row.value;
  return counts;
}

export async function getSubmission(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(schema.submissions).where(eq(schema.submissions.id, id)).limit(1);
  return row ?? null;
}

export async function updateSubmission(id: string, changes: { status: SubmissionStatus; note: string }) {
  const db = await getDb();
  await db
    .update(schema.submissions)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(schema.submissions.id, id));
}

export async function deleteSubmission(id: string) {
  const db = await getDb();
  await db.delete(schema.submissions).where(eq(schema.submissions.id, id));
}
