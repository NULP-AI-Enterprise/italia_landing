import Image from "next/image";
import Link from "next/link";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import logo from "@/assets/images/logo.png";
import styles from "./SiteFooter.module.css";

type SiteFooterProps = {
  locale: Locale;
  nav: Dictionary["nav"];
  footer: Dictionary["footer"];
};

export function SiteFooter({ locale, nav, footer }: SiteFooterProps) {
  const links = [
    { href: localePath(locale, "/about"), label: nav.about },
    { href: localePath(locale, "/#services"), label: nav.services },
    { href: localePath(locale, "/publications"), label: nav.publications },
    { href: localePath(locale, "/members"), label: nav.members },
  ];

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <Link className={styles.brand} href={localePath(locale)}>
          <Image className={styles.logo} src={logo} alt="" width={40} height={40} />
          Made in Ukraine for Italy
        </Link>
        <ul className={styles.nav}>
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
        <p>{footer.copyright}</p>
      </div>
    </footer>
  );
}
