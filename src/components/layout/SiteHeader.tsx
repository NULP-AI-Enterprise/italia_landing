"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Navigation, NavItem } from "@/config/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import emblem from "@/assets/images/emblem.png";
import { FormTrigger } from "@/components/forms/FormTrigger";
import { LanguageSwitcher } from "./LanguageSwitcher";
import styles from "./SiteHeader.module.css";

type SiteHeaderProps = {
  locale: Locale;
  brandName: string;
  navigation: Navigation;
  joinLabel: string;
  a11y: Dictionary["a11y"];
};

/**
 * Site header. The menu lists pages only, named as in the design. Related pages
 * (the three partner pages) sit in a disclosure drop-down (WAI-ARIA APG
 * "disclosure navigation": a button opening a list of plain links, no menu roles).
 * Phones: one panel with every page listed.
 */
export function SiteHeader({ locale, brandName, navigation, joinLabel, a11y }: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const isCurrent = (item: NavItem) => item.href === pathname;
  const closeAll = () => {
    setOpenGroup(null);
    setMenuOpen(false);
  };

  // Header shadow once the page leaves the top
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Escape closes the open list (focus back to its button) or the phone menu;
  // a click outside the header closes both.
  useEffect(() => {
    if (!openGroup && !menuOpen) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (openGroup) {
        document.getElementById(`nav-button-${openGroup}`)?.focus();
        setOpenGroup(null);
      } else {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) closeAll();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [openGroup, menuOpen]);

  // Leaving the phone layout closes the phone menu
  useEffect(() => {
    if (!menuOpen) return;
    const desktop = window.matchMedia("(min-width: 1101px)");
    const onChange = () => desktop.matches && setMenuOpen(false);
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, [menuOpen]);

  const focusLink = (groupId: string, which: "first" | "last") => {
    requestAnimationFrame(() => {
      const links = document.querySelectorAll<HTMLAnchorElement>(`#nav-list-${groupId} a`);
      links[which === "first" ? 0 : links.length - 1]?.focus();
    });
  };

  const onButtonKey = (event: KeyboardEvent<HTMLButtonElement>, groupId: string) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpenGroup(groupId);
      focusLink(groupId, event.key === "ArrowDown" ? "first" : "last");
    }
  };

  // Arrow keys move between links inside an open list
  const onListKey = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const links = [...event.currentTarget.querySelectorAll<HTMLAnchorElement>("a")];
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (index === -1) return;
    event.preventDefault();
    const next = event.key === "ArrowDown" ? index + 1 : index - 1;
    links[(next + links.length) % links.length]?.focus();
  };

  return (
    <>
      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      <header ref={headerRef} className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        <div className={`container ${styles.inner}`}>
          <Link
            className={styles.brand}
            href={navigation.home.href}
            onClick={closeAll}
          >
            <Image className={styles.logo} src={emblem} alt="" width={44} height={44} preload />
            <span className={styles.brandName}>{brandName}</span>
          </Link>

          <nav
            id="site-nav"
            className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}
            aria-label={a11y.mainNav}
          >
            <ul className={styles.list}>
              {navigation.entries.map((entry) => {
                if (entry.type === "link") {
                  return (
                    <li key={entry.href} className={styles.item}>
                      <Link
                        className={styles.topLink}
                        href={entry.href}
                        aria-current={isCurrent(entry) ? "page" : undefined}
                        onClick={closeAll}
                      >
                        {entry.label}
                      </Link>
                    </li>
                  );
                }
                const open = openGroup === entry.id;
                const active = entry.items.some(isCurrent);
                return (
                  <li
                    key={entry.id}
                    className={styles.item}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                        setOpenGroup((current) => (current === entry.id ? null : current));
                      }
                    }}
                  >
                    <button
                      id={`nav-button-${entry.id}`}
                      type="button"
                      className={styles.groupButton}
                      aria-expanded={open}
                      aria-controls={`nav-list-${entry.id}`}
                      data-active={active || undefined}
                      onClick={() => setOpenGroup(open ? null : entry.id)}
                      onKeyDown={(event) => onButtonKey(event, entry.id)}
                    >
                      {entry.label}
                      <span className={styles.chevron} aria-hidden="true" />
                    </button>
                    {/* On phones the list is always shown under this heading instead of the button */}
                    <span className={styles.groupLabel} aria-hidden="true">
                      {entry.label}
                    </span>
                    <ul
                      id={`nav-list-${entry.id}`}
                      className={`${styles.sub} ${open ? styles.subOpen : ""}`}
                      aria-labelledby={`nav-button-${entry.id}`}
                      onKeyDown={onListKey}
                    >
                      {entry.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            className={styles.subLink}
                            href={item.href}
                            aria-current={isCurrent(item) ? "page" : undefined}
                            onClick={closeAll}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>

            <div className={styles.actions}>
              <FormTrigger
                className={`btn ${styles.join}`}
                href={navigation.join.href}
                kind="join"
                onOpen={closeAll}
              >
                {joinLabel}
              </FormTrigger>
              <LanguageSwitcher locale={locale} label={a11y.languageGroup} />
            </div>
          </nav>

          <button
            ref={toggleRef}
            className={styles.toggle}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            aria-label={menuOpen ? a11y.closeMenu : a11y.openMenu}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span className={styles.bars} aria-hidden="true" />
          </button>
        </div>
      </header>
    </>
  );
}
