import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/i18n/get-dictionary";
import landscape from "@/assets/images/italy-landscape.jpg";
import styles from "./JoinBanner.module.css";

type JoinBannerProps = {
  join: Dictionary["home"]["join"];
  href: string;
};

export function JoinBanner({ join, href }: JoinBannerProps) {
  return (
    <section className={styles.join} aria-label={join.label}>
      <Image className={styles.bg} src={landscape} alt="" fill sizes="100vw" />
      <Link className={styles.link} href={href}>
        {join.cta}
        <svg
          className={styles.arrow}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </section>
  );
}
