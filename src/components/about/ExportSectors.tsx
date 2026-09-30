import Link from "next/link";
import type { AboutPageContent } from "@/content/repository";
import { ContentImage } from "@/components/ui/ContentImage";
import { Reveal } from "@/components/ui/Reveal";
import { RichText } from "@/components/ui/RichText";
import { localePath, type Locale } from "@/i18n/config";
import styles from "./ExportSectors.module.css";

type ExportSectorsProps = {
  sectors: AboutPageContent["sectors"];
  locale: Locale;
  /** Visually hidden heading for the section (the design has none). */
  heading: string;
};

/** Full-bleed photo on the left, key export facts on the right. */
export function ExportSectors({ sectors, locale, heading }: ExportSectorsProps) {
  return (
    <section className={styles.sectors} aria-labelledby="sectors-title">
      <h2 className="visually-hidden" id="sectors-title">
        {heading}
      </h2>
      <div className={styles.media}>
        <ContentImage media={sectors.image} sizes="(max-width: 960px) 100vw, 47vw" />
      </div>
      <Reveal className={styles.content}>
        {sectors.paragraphs.map((paragraph, index) => (
          <p key={index}>
            <RichText text={paragraph} />
          </p>
        ))}
        {sectors.highlights.length > 0 && (
          <ul className={styles.highlights}>
            {sectors.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        {sectors.link && (
          <p>
            <Link className={styles.link} href={localePath(locale, sectors.link.href)}>
              {sectors.link.label}
              <span aria-hidden="true"> →</span>
            </Link>
          </p>
        )}
      </Reveal>
    </section>
  );
}
