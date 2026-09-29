import Image from "next/image";
import type { ReactNode } from "react";
import emblem from "@/assets/images/emblem.png";
import { TextLines } from "./RichText";
import styles from "./PageHero.module.css";

type PageHeroProps = {
  title: string;
  lead?: string;
  logoAlt: string;
  /** Extra content under the title, e.g. the list of cities on the home page. */
  children?: ReactNode;
};

/** Page banner shared by every page: emblem, title, optional lead, flag stripe. */
export function PageHero({ title, lead, logoAlt, children }: PageHeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="page-title">
      <div className={`container ${styles.inner}`}>
        <Image
          className={styles.emblem}
          src={emblem}
          alt={logoAlt}
          sizes="(max-width: 767px) 88px, 170px"
          preload
        />
        <div className={styles.content}>
          <h1 className={styles.title} id="page-title">
            <TextLines text={title} />
          </h1>
          {lead && <p className={styles.lead}>{lead}</p>}
          {children}
        </div>
      </div>
      {/* Italian flag stripe: green, white, red from left to right */}
      <div className={styles.stripe} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}
