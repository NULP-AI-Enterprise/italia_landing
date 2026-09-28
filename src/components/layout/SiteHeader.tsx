"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import logo from "@/assets/images/logo.png";
import { LanguageSwitcher } from "./LanguageSwitcher";
import styles from "./SiteHeader.module.css";

type SiteHeaderProps = {
  locale: Locale;
  nav: Dictionary["nav"];
  a11y: Dictionary["a11y"];
};

export function SiteHeader({ locale, nav, a11y }: SiteHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const homePath = localePath(locale);
  const isHome = pathname === homePath;

  const items = [
    { href: localePath(locale, "/about"), label: nav.about },
    { href: localePath(locale, "/#services"), label: nav.services },
    { href: localePath(locale, "/publications"), label: nav.publications },
    { href: localePath(locale, "/members"), label: nav.members },
  ];

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
          <Link className={styles.brand} href={homePath} aria-label={a11y.homeLink}>
            <Image className={styles.logo} src={logo} alt="" width={58} height={58} preload />
            {isHome && <span className={styles.pageTitle}>{nav.home}</span>}
          </Link>

          <nav
            id="site-nav"
            className={`${styles.nav} ${open ? styles.navOpen : ""}`}
            aria-label={a11y.mainNav}
          >
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    className={styles.link}
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
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
            <span className={styles.bars} />
          </button>
        </div>
      </header>
    </>
  );
}
