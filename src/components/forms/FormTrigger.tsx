"use client";

import type { MouseEvent, ReactNode } from "react";
import { useFormDialog, type FormRequest } from "./FormDialog";

type FormTriggerProps = FormRequest & {
  /** Page with the same form, used without JavaScript or when opened in a new tab. */
  href: string;
  className?: string;
  children: ReactNode;
  onOpen?: () => void;
};

/** A link that opens the form dialog; falls back to the /join page. */
export function FormTrigger({ href, className, children, onOpen, ...request }: FormTriggerProps) {
  const openForm = useFormDialog();

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!openForm || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpen?.();
    openForm(request);
  };

  return (
    <a className={className} href={href} onClick={onClick}>
      {children}
    </a>
  );
}
