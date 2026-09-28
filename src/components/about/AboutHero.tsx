import Image from "next/image";
import type { Dictionary } from "@/i18n/get-dictionary";
import groupPhoto from "@/assets/images/hero-about.jpg";
import styles from "./AboutHero.module.css";

export function AboutHero({ hero }: { hero: Dictionary["about"]["hero"] }) {
  return (
    <section className={styles.hero} aria-labelledby="about-title">
      <Image
        className={styles.bg}
        src={groupPhoto}
        alt=""
        sizes="(max-width: 767px) 100vw, 60vw"
        loading="eager"
        fetchPriority="high"
      />
      <div className="container">
        <span className="eyebrow">{hero.eyebrow}</span>
        <h1 className={styles.title} id="about-title">
          {hero.titleLines.map((line) => (
            <span className="line" key={line}>
              {line}{" "}
            </span>
          ))}
        </h1>
        <p className={styles.lead}>{hero.lead}</p>
      </div>
    </section>
  );
}
