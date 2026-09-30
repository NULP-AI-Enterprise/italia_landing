"use client";

import type { ReactNode } from "react";

/** Submit button that asks for confirmation first. */
type ConfirmButtonProps = { question: string; className?: string; label?: string; children: ReactNode };

export function ConfirmButton({ question, className, label, children }: ConfirmButtonProps) {
  return (
    <button
      type="submit"
      className={className}
      aria-label={label}
      onClick={(event) => {
        if (!window.confirm(question)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
