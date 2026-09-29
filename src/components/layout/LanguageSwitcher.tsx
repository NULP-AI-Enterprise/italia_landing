"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeLabels, locales, switchLocalePath, type Locale } from "@/i18n/config";
import styles from "./LanguageSwitcher.module.css";

function Flag({ locale }: { locale: Locale }) {
  if (locale === "uk") {
    return (
      <svg className={styles.flag} viewBox="0 0 20 20" aria-hidden="true">
        <clipPath id="flag-ua">
          <circle cx="10" cy="10" r="10" />
        </clipPath>
        <g clipPath="url(#flag-ua)">
          <rect width="20" height="10" fill="#0057b8" />
          <rect y="10" width="20" height="10" fill="#ffd500" />
        </g>
      </svg>
    );
  }
  return (
    <svg className={styles.flag} viewBox="0 0 20 20" aria-hidden="true">
      <clipPath id="flag-it">
        <circle cx="10" cy="10" r="10" />
      </clipPath>
      <g clipPath="url(#flag-it)">
        <rect width="7" height="20" fill="#009147" />
        <rect x="7" width="6" height="20" fill="#fff" />
        <rect x="13" width="7" height="20" fill="#cf2b36" />
      </g>
      <circle cx="10" cy="10" r="9.5" fill="none" stroke="#e4e7ef" />
    </svg>
  );
}

const languageNames: Record<Locale, string> = {
  uk: "Українська",
  it: "Italiano",
};

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();

  return (
    <div className={styles.lang} role="group" aria-label={label}>
      {locales.map((target) => {
        const active = target === locale;
        return (
          <Link
            key={target}
            className={`${styles.option} ${active ? styles.active : ""}`}
            href={switchLocalePath(pathname, target)}
            hrefLang={target}
            lang={target}
            aria-current={active ? "true" : undefined}
          >
            <Flag locale={target} />
            {/* Visible code stays part of the accessible name (WCAG 2.5.3) */}
            {localeLabels[target]}
            <span className="visually-hidden"> — {languageNames[target]}</span>
          </Link>
        );
      })}
    </div>
  );
}
