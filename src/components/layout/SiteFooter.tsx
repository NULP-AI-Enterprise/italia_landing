import Image from "next/image";
import Link from "next/link";
import { FormTrigger } from "@/components/forms/FormTrigger";
import type { Navigation } from "@/config/navigation";
import type { Dictionary } from "@/i18n/get-dictionary";
import logo from "@/assets/images/logo.png";
import styles from "./SiteFooter.module.css";

type SiteFooterProps = {
  navigation: Navigation;
  brandName: string;
  dict: Pick<Dictionary, "footer" | "a11y" | "actions">;
};

/** Footer sitemap: every page, by its name in the design. */
export function SiteFooter({ navigation, brandName, dict }: SiteFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandBlock}>
          <Link className={styles.brand} href={navigation.home.href}>
            <Image className={styles.logo} src={logo} alt="" width={56} height={56} />
            {brandName}
          </Link>
          <FormTrigger className={`btn ${styles.join}`} href={navigation.join.href} kind="join">
            {dict.actions.join}
          </FormTrigger>
        </div>

        <nav aria-label={dict.a11y.footerNav}>
          <ul className={styles.links}>
            {navigation.sitemap.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className={styles.copy}>{dict.footer.copyright}</p>
      </div>
    </footer>
  );
}
