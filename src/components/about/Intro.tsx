import type { AboutPageContent } from "@/content/repository";
import { ContentImage } from "@/components/ui/ContentImage";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { Reveal } from "@/components/ui/Reveal";
import { RichText } from "@/components/ui/RichText";
import styles from "./Intro.module.css";

/** Title and text on the left, photo on the right (placeholder until provided). */
export function Intro({ intro }: { intro: AboutPageContent["intro"] }) {
  return (
    <section className={styles.intro} aria-labelledby="intro-title">
      <Reveal className={styles.content}>
        <h2 className={`section-title ${styles.title}`} id="intro-title">
          {intro.title}
        </h2>
        <div className={styles.text}>
          {intro.paragraphs.map((paragraph, index) => (
            <p key={index}>
              <RichText text={paragraph} />
            </p>
          ))}
        </div>
      </Reveal>

      <div className={styles.media}>
        {intro.image ? (
          <ContentImage media={intro.image} sizes="(max-width: 960px) 100vw, 45vw" eager />
        ) : (
          <ImagePlaceholder />
        )}
      </div>
    </section>
  );
}
