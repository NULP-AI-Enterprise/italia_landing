import Link from "next/link";
import { sectionFor, sectionLinkHref, type SectionLink } from "@/content/registry";

/** Tabs between the parts of one page of the site (e.g. Team: people / header). */
export function SectionTabs({ kind, docKey }: { kind: SectionLink["kind"]; docKey: string }) {
  const section = sectionFor(kind, docKey);
  if (!section || section.links.length < 2) return null;
  return (
    <nav className="adm-tabs" aria-label={`Розділ «${section.title}»`}>
      {section.links.map((link) => {
        const active = link.kind === kind && link.key === docKey;
        return (
          <Link key={sectionLinkHref(link)} href={sectionLinkHref(link)} aria-current={active ? "page" : undefined}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
