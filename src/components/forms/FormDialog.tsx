"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { ContactForm } from "./ContactForm";
import styles from "./FormDialog.module.css";

export type FormRequest = {
  kind: "join" | "contact";
  recipientId?: string;
  recipientName?: string;
};

const FormDialogContext = createContext<((request: FormRequest) => void) | null>(null);

/** Opens the shared form dialog; null outside the provider. */
export const useFormDialog = () => useContext(FormDialogContext);

type FormDialogProviderProps = {
  locale: string;
  labels: Dictionary["form"];
  /** Cloudflare Turnstile site key, when the captcha is configured. */
  turnstileSiteKey?: string;
  children: ReactNode;
};

/**
 * One modal form for the whole site ("Join" and "Contact a team member").
 * Native <dialog>: focus stays inside, Escape closes, focus returns to the trigger.
 */
export function FormDialogProvider({ locale, labels, turnstileSiteKey, children }: FormDialogProviderProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [request, setRequest] = useState<FormRequest | null>(null);
  const [session, setSession] = useState(0);

  const open = useCallback((next: FormRequest) => {
    setRequest(next);
    setSession((value) => value + 1);
  }, []);

  const close = useCallback(() => dialogRef.current?.close(), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!request || !dialog || dialog.open) return;
    dialog.showModal();
    // Start typing right away: focus the first field rather than the close button
    dialog.querySelector<HTMLElement>("input:not([type=hidden]):not([tabindex='-1']), textarea")?.focus();
  }, [request, session]);

  const title = request?.kind === "contact" ? labels.contactTitle : labels.joinTitle;

  return (
    <FormDialogContext.Provider value={open}>
      {children}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="form-dialog-title"
        onClose={() => setRequest(null)}
        onClick={(event) => {
          // A click on the dimmed backdrop (the dialog element itself) closes it
          if (event.target === event.currentTarget) close();
        }}
      >
        {request && (
          <div className={styles.panel}>
            <div className={styles.head}>
              <h2 className={styles.title} id="form-dialog-title">
                {title}
              </h2>
              <button type="button" className={styles.close} onClick={close} aria-label={labels.close}>
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className={styles.body}>
              {request.recipientName && (
                <p className={styles.recipient}>
                  {labels.contactWith.replace("{name}", request.recipientName)}
                </p>
              )}
              <ContactForm
                key={session}
                kind={request.kind}
                recipientId={request.recipientId}
                locale={locale}
                labels={labels}
                turnstileSiteKey={turnstileSiteKey}
                onClose={close}
              />
            </div>
          </div>
        )}
      </dialog>
    </FormDialogContext.Provider>
  );
}
