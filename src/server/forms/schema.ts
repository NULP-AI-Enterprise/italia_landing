import { z } from "zod";
import { locales } from "@/i18n/config";

/** Error codes; the form turns them into text in the visitor's language. */
export type FormErrorCode = "required" | "email" | "phone" | "tooLong" | "rate" | "captcha" | "server";

export const formFields = ["contactName", "companyName", "phone", "email", "message"] as const;
export type FormField = (typeof formFields)[number];

const requiredText = (max: number) =>
  z.string().trim().min(1, { error: "required" }).max(max, { error: "tooLong" });

export const submissionFormSchema = z.object({
  kind: z.enum(["join", "contact"]),
  recipientId: z.string().trim().max(100).optional(),
  locale: z.enum(locales),
  contactName: requiredText(120),
  companyName: requiredText(160),
  phone: z
    .string()
    .trim()
    .min(1, { error: "required" })
    .max(30, { error: "tooLong" })
    .regex(/^\+?[\d\s()\-.]+$/, { error: "phone" })
    .refine((value) => value.replace(/\D/g, "").length >= 7, { error: "phone" }),
  email: z
    .string()
    .trim()
    .min(1, { error: "required" })
    .max(200, { error: "tooLong" })
    .pipe(z.email({ error: "email" })),
  message: requiredText(4000),
});

export type FormState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      /** Field-level problems. */
      errors: Partial<Record<FormField, FormErrorCode>>;
      /** Problem with the whole submission (rate limit, captcha, server). */
      formError?: FormErrorCode;
      /** What the visitor typed, so the form can be refilled. */
      values: Partial<Record<FormField, string>>;
    };
