"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { getTeamMember } from "@/content/repository";
import { formFields, submissionFormSchema, type FormErrorCode, type FormField, type FormState } from "@/server/forms/schema";
import { turnstileSecret } from "@/server/forms/turnstile";
import { sendRequestMail } from "@/server/mail";
import { countRecentFromSender, createSubmission, markNotified } from "@/server/submissions";

const RATE_LIMIT = { max: 5, windowMinutes: 10 };
/** Forms sent faster than this after opening are treated as bots. */
const MIN_FILL_MS = 2500;

function readValues(formData: FormData) {
  return Object.fromEntries(
    formFields.map((field) => [field, String(formData.get(field) ?? "")]),
  ) as Record<FormField, string>;
}

async function verifyTurnstile(token: string, ip: string | null) {
  const secret = turnstileSecret();
  if (!secret) return true; // captcha not configured
  if (!token) return false;
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
  });
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}

/** Server action behind the "Join" / "Contact" form. */
export async function submitForm(_previous: FormState, formData: FormData): Promise<FormState> {
  const values = readValues(formData);
  const fail = (formError: FormErrorCode): FormState => ({ status: "error", errors: {}, formError, values });

  // Honeypot and time trap: pretend success so bots learn nothing.
  const startedAt = Number(formData.get("startedAt"));
  if (String(formData.get("website") ?? "") !== "" || (startedAt && Date.now() - startedAt < MIN_FILL_MS)) {
    return { status: "success" };
  }

  const parsed = submissionFormSchema.safeParse({
    ...values,
    kind: formData.get("kind"),
    locale: formData.get("locale"),
    recipientId: formData.get("recipientId") || undefined,
  });
  if (!parsed.success) {
    const errors: Partial<Record<FormField, FormErrorCode>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as FormField;
      if (formFields.includes(field) && !errors[field]) errors[field] = issue.message as FormErrorCode;
    }
    return Object.keys(errors).length ? { status: "error", errors, values } : fail("server");
  }
  const data = parsed.data;

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip");
  if (!(await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? ""), ip))) {
    return fail("captcha");
  }

  try {
    const ipHash = ip
      ? createHash("sha256").update(`${process.env.IP_HASH_SALT ?? "miufi"}:${ip}`).digest("hex")
      : null;
    if (ipHash) {
      const since = new Date(Date.now() - RATE_LIMIT.windowMinutes * 60_000);
      if ((await countRecentFromSender(ipHash, since)) >= RATE_LIMIT.max) return fail("rate");
    }

    const recipient =
      data.kind === "contact" && data.recipientId ? await getTeamMember(data.recipientId, "uk") : null;

    const id = await createSubmission({
      kind: data.kind,
      contactName: data.contactName,
      companyName: data.companyName,
      phone: data.phone,
      email: data.email,
      message: data.message,
      recipientId: recipient?.id ?? null,
      recipientName: recipient?.name ?? null,
      locale: data.locale,
      ipHash,
      userAgent: requestHeaders.get("user-agent")?.slice(0, 300) ?? null,
    });

    // The e-mail goes out after the answer, so the visitor does not wait for the mail server.
    after(async () => {
      const result = await sendRequestMail({
        kind: data.kind,
        contactName: data.contactName,
        companyName: data.companyName,
        phone: data.phone,
        email: data.email,
        message: data.message,
        locale: data.locale,
        recipient: recipient ? { name: recipient.name, email: recipient.email } : null,
      });
      await markNotified(id, result);
    });
    return { status: "success" };
  } catch (error) {
    console.error("Form submission failed", error);
    return fail("server");
  }
}
