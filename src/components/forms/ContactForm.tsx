"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { submitForm } from "@/server/actions/submit-form";
import { formFields, type FormField, type FormState } from "@/server/forms/schema";
import type { Dictionary } from "@/i18n/get-dictionary";
import { Turnstile } from "./Turnstile";
import styles from "./ContactForm.module.css";

type ContactFormProps = {
  kind: "join" | "contact";
  locale: string;
  labels: Dictionary["form"];
  recipientId?: string;
  turnstileSiteKey?: string;
  /** Shown after a successful submission inside a dialog. */
  onClose?: () => void;
};

const fieldConfig: Record<
  FormField,
  { type?: string; autoComplete: string; inputMode?: "tel" | "email"; multiline?: boolean }
> = {
  contactName: { autoComplete: "name" },
  companyName: { autoComplete: "organization" },
  phone: { type: "tel", autoComplete: "tel", inputMode: "tel" },
  email: { type: "email", autoComplete: "email", inputMode: "email" },
  message: { autoComplete: "off", multiline: true },
};

const initialState: FormState = { status: "idle" };

/** "Join" / "Contact" form, shared by the dialog and the /join page. */
export function ContactForm({ kind, locale, labels, recipientId, turnstileSiteKey, onClose }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(submitForm, initialState);
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const startedAt = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const errors = state.status === "error" ? state.errors : {};
  const values = state.status === "error" ? state.values : {};

  // When the form opens, remember the time (bot check on the server)
  useEffect(() => {
    if (startedAt.current) startedAt.current.value = String(Date.now());
  }, []);

  // After a response, move focus to what the visitor needs next
  useEffect(() => {
    if (state.status === "success") successRef.current?.focus();
    if (state.status !== "error") return;
    const firstInvalid = formFields.find((field) => state.errors[field]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
    } else {
      alertRef.current?.focus();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div className={styles.success} ref={successRef} tabIndex={-1} role="status">
        <p className={styles.successTitle}>{labels.successTitle}</p>
        <p>{labels.successText}</p>
        {onClose && (
          <button type="button" className={`btn ${styles.submit}`} onClick={onClose}>
            {labels.close}
          </button>
        )}
      </div>
    );
  }

  return (
    <form ref={formRef} className={styles.form} action={formAction} noValidate>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="locale" value={locale} />
      {recipientId && <input type="hidden" name="recipientId" value={recipientId} />}
      <input type="hidden" name="startedAt" ref={startedAt} defaultValue="" />
      {/* Honeypot: invisible to people, tempting for bots */}
      <div className={styles.trap} aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <p className={styles.note}>{labels.requiredNote}</p>

      {state.status === "error" && (
        <p className={styles.alert} role="alert" tabIndex={-1} ref={alertRef}>
          {state.formError ? labels.errors[state.formError] : labels.errors.summary}
        </p>
      )}

      {formFields.map((field) => {
        const config = fieldConfig[field];
        const id = `${formId}-${field}`;
        const error = errors[field];
        const common = {
          id,
          name: field,
          required: true,
          autoComplete: config.autoComplete,
          defaultValue: values[field] ?? "",
          "aria-invalid": error ? true : undefined,
          "aria-describedby": error ? `${id}-error` : undefined,
          className: styles.control,
        } as const;
        return (
          <div className={styles.field} key={field}>
            <label className={styles.label} htmlFor={id}>
              {labels.fields[field]}
              <span aria-hidden="true"> *</span>
            </label>
            {config.multiline ? (
              <textarea {...common} rows={5} maxLength={4000} />
            ) : (
              <input
                {...common}
                type={config.type ?? "text"}
                inputMode={config.inputMode}
                placeholder={
                  field === "phone"
                    ? labels.placeholders.phone
                    : field === "email"
                      ? labels.placeholders.email
                      : undefined
                }
              />
            )}
            {error && (
              <p className={styles.error} id={`${id}-error`}>
                {labels.errors[error]}
              </p>
            )}
          </div>
        );
      })}

      {turnstileSiteKey && <Turnstile siteKey={turnstileSiteKey} locale={locale} />}

      <button type="submit" className={`btn ${styles.submit}`} disabled={pending}>
        {pending ? labels.sending : labels.submit}
        {!pending && <span aria-hidden="true">→</span>}
      </button>
      <p className={styles.privacy}>{labels.privacy}</p>
    </form>
  );
}
