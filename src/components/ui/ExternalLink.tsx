import type { ReactNode } from "react";

type ExternalLinkProps = {
  href: string;
  /** Screen-reader note, e.g. "opens in a new tab". */
  newTabLabel: string;
  className?: string;
  children: ReactNode;
};

/** Link to another site: opens in a new tab and says so, visually and to screen readers. */
export function ExternalLink({ href, newTabLabel, className, children }: ExternalLinkProps) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <svg
        width="0.85em"
        height="0.85em"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ marginInlineStart: "0.35em", verticalAlign: "-0.05em" }}
      >
        <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
      </svg>
      <span className="visually-hidden"> ({newTabLabel})</span>
    </a>
  );
}

/** "https://www.example.com/en/" -> "example.com" */
export function displayDomain(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}
