/**
 * Database schema (PostgreSQL). Column names are snake_case in the database
 * (see `casing` in client.ts and drizzle.config.ts).
 *
 * Every table has row-level security on and no policies: on Supabase the public
 * Data API (anon and authenticated roles) can read nothing. The site connects as
 * the tables' owner, which RLS does not restrict.
 */
import { customType, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Raw file bytes. postgres.js returns a Buffer, PGlite a Uint8Array. */
const bytea = customType<{ data: Uint8Array; driverData: Uint8Array }>({
  dataType: () => "bytea",
});

export const submissionKind = pgEnum("submission_kind", ["join", "contact"]);
export const submissionStatus = pgEnum("submission_status", ["new", "in_progress", "done", "spam"]);

/** Requests from the "Join" and "Contact" forms. */
export const submissions = pgTable(
  "submissions",
  {
    id: uuid().primaryKey().defaultRandom(),
    kind: submissionKind().notNull(),
    contactName: text().notNull(),
    companyName: text().notNull(),
    phone: text().notNull(),
    email: text().notNull(),
    message: text().notNull(),
    /** Team member the visitor wrote to (content/team.json id), for "contact". */
    recipientId: text(),
    recipientName: text(),
    locale: text().notNull(),
    status: submissionStatus().notNull().default("new"),
    /** Internal note visible only in the admin panel. */
    note: text().notNull().default(""),
    /** E-mail about the request: when it was sent and to whom, or why it failed. */
    notifiedAt: timestamp({ withTimezone: true }),
    notifiedTo: text(),
    notifyError: text(),
    /** Salted hash of the sender IP, used for rate limiting only. */
    ipHash: text(),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("submissions_created_at_idx").on(table.createdAt),
    index("submissions_ip_hash_idx").on(table.ipHash, table.createdAt),
  ],
).enableRLS();

export const adminUsers = pgTable("admin_users", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  name: text().notNull(),
  passwordHash: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const adminSessions = pgTable("admin_sessions", {
  /** SHA-256 of the session token; the token itself lives only in the cookie. */
  id: text().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/**
 * Editable site content, one row per document of src/content/registry.ts
 * ("services", "partners", "page:home"…). Rows override the JSON in /content,
 * which stays the starting point for a fresh database.
 */
export const contentDocuments = pgTable("content_documents", {
  key: text().primaryKey(),
  data: jsonb().notNull(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid().references(() => adminUsers.id, { onDelete: "set null" }),
}).enableRLS();

/** Images uploaded in the admin panel, served from /media/uploads/<id>.<ext>. */
export const mediaFiles = pgTable("media_files", {
  id: uuid().primaryKey().defaultRandom(),
  originalName: text().notNull(),
  contentType: text().notNull(),
  width: integer().notNull(),
  height: integer().notNull(),
  size: integer().notNull(),
  data: bytea().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid().references(() => adminUsers.id, { onDelete: "set null" }),
}).enableRLS();

export type Submission = typeof submissions.$inferSelect;
export type SubmissionStatus = (typeof submissionStatus.enumValues)[number];
export type SubmissionKind = (typeof submissionKind.enumValues)[number];
