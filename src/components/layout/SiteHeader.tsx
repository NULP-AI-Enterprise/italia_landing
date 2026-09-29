"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { sitePages } from "@/config/site-pages";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { LanguageSwitcher } from "./LanguageSwitcher";
import styles from "./SiteHeader.module.css";

type SiteHeaderProps = {
  locale: Locale;
  siteName: string;
  nav: Dictionary["nav"];
  a11y: Dictionary["a11y"];
};

/**
 * As in the design: the current page name sits on the left and the menu
 * lists the other main sections.
 */
export function SiteHeader({ locale, siteName, nav, a11y }: SiteHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const current = sitePages.find((page) => localePath(locale, page.path) === pathname);
  const items = sitePages.filter((page) => page.inHeader && page !== current);

  // Header shadow once the page leaves the top
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Close the mobile menu on Escape and when the viewport grows to desktop
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    const desktop = window.matchMedia("(min-width: 961px)");
    const onResize = () => desktop.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  return (
    <>
      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        <div className={`container ${styles.inner}`}>
          <span className={styles.pageTitle}>{current ? nav[current.key] : siteName}</span>

          <nav
            id="site-nav"
            className={`${styles.nav} ${open ? styles.navOpen : ""}`}
            aria-label={a11y.mainNav}
          >
            <ul className={styles.list}>
              {items.map((page) => (
                <li key={page.key}>
                  <Link
                    className={styles.link}
                    href={localePath(locale, page.path)}
                    onClick={() => setOpen(false)}
                  >
                    {nav[page.key]}
                  </Link>
                </li>
              ))}
            </ul>
            <LanguageSwitcher locale={locale} label={a11y.languageGroup} />
          </nav>

          <button
            ref={toggleRef}
            className={styles.toggle}
            type="button"
            aria-expanded={open}
            aria-controls="site-nav"
            aria-label={open ? a11y.closeMenu : a11y.openMenu}
            onClick={() => setOpen((value) => !value)}
          >
            <span className={styles.bars} aria-hidden="true" />
          </button>
        </div>
      </header>
    </>
  );
}
