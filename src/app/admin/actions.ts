"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { verifyPassword } from "@/server/auth/password";
import { createSession, destroySession, requireAdmin } from "@/server/auth/session";
import { getDb, schema } from "@/server/db/client";
import { deleteSubmission, SUBMISSION_STATUSES, updateSubmission } from "@/server/submissions";

export type LoginState = { error?: string; email?: string };

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const parsed = loginSchema.safeParse({ email, password: formData.get("password") });
  const failure = { error: "Невірний е-мейл або пароль.", email };
  if (!parsed.success) return failure;

  const db = await getDb();
  const [user] = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, parsed.data.email))
    .limit(1);
  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid) {
    await new Promise((resolve) => setTimeout(resolve, 400)); // slow down guessing
    return failure;
  }

  await createSession(user.id);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

const updateSchema = z.object({
  id: z.uuid(),
  status: z.enum(SUBMISSION_STATUSES),
  note: z.string().max(5000),
});

export async function updateSubmissionAction(formData: FormData) {
  await requireAdmin();
  const data = updateSchema.parse({
    id: formData.get("id"),
    status: formData.get("status"),
    note: String(formData.get("note") ?? ""),
  });
  await updateSubmission(data.id, { status: data.status, note: data.note.trim() });
  revalidatePath("/admin", "layout");
  redirect(`/admin/submissions/${data.id}?saved=1`);
}

export async function deleteSubmissionAction(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  await deleteSubmission(id);
  revalidatePath("/admin", "layout");
  redirect("/admin/submissions?deleted=1");
}
