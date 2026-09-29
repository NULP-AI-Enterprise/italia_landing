import type { AboutPageContent } from "@/content/repository";
import { ContentImage } from "@/components/ui/ContentImage";
import { Reveal } from "@/components/ui/Reveal";
import { RichText } from "@/components/ui/RichText";
import styles from "./Intro.module.css";

export function Intro({ intro }: { intro: AboutPageContent["intro"] }) {
  const pillars = [
    { ...intro.vision, accent: true },
    { ...intro.mission, accent: false },
  ];

  return (
    <section className={styles.intro} aria-labelledby="intro-title">
      <Reveal className={styles.content}>
        <h2 className={`section-title ${styles.title}`} id="intro-title">
          {intro.title}
        </h2>
        {pillars.map((pillar) => (
          <div className={`${styles.pillar} ${pillar.accent ? styles.accent : ""}`} key={pillar.title}>
            <h3 className={styles.pillarTitle}>{pillar.title}</h3>
            <p className={styles.pillarText}>
              <RichText text={pillar.text} />
            </p>
          </div>
        ))}
      </Reveal>

      <div className={styles.media}>
        <ContentImage media={intro.image} sizes="(max-width: 960px) 100vw, 50vw" eager />
      </div>
    </section>
  );
}
