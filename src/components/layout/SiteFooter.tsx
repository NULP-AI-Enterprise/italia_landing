import Image from "next/image";
import Link from "next/link";
import { sitePages } from "@/config/site-pages";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import logo from "@/assets/images/logo.png";
import styles from "./SiteFooter.module.css";

type SiteFooterProps = {
  locale: Locale;
  dict: Pick<Dictionary, "nav" | "footer" | "a11y">;
};

export function SiteFooter({ locale, dict }: SiteFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <Link className={styles.brand} href={localePath(locale)}>
          <Image className={styles.logo} src={logo} alt="" width={48} height={48} />
          Made in Ukraine for Italy
        </Link>
        <nav aria-label={dict.a11y.footerNav}>
          <ul className={styles.nav}>
            {sitePages.map((page) => (
              <li key={page.key}>
                <Link href={localePath(locale, page.path)}>{dict.nav[page.key]}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className={styles.copy}>{dict.footer.copyright}</p>
      </div>
    </footer>
  );
}
