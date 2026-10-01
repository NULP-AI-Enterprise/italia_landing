import type { AboutPageContent } from "@/content/repository";
import { ContentImage } from "@/components/ui/ContentImage";
import { Reveal } from "@/components/ui/Reveal";
import { RichText } from "@/components/ui/RichText";
import styles from "./AboutStory.module.css";

type AboutStoryProps = Omit<AboutPageContent, "seo" | "hero">;

/**
 * The association page as in the design: three statements in large type,
 * a bold lead, the economic context, a wide photo and the story of MIUFI.
 */
export function AboutStory({ statement, lead, paragraphs, image, story }: AboutStoryProps) {
  return (
    <>
      <section className={`container ${styles.intro}`} aria-labelledby="about-statement">
        <h2 className={styles.statement} id="about-statement">
          {statement.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>
        <Reveal>
          <p className={styles.lead}>
            <RichText text={lead} />
          </p>
          {paragraphs.map((paragraph) => (
            <p className={styles.text} key={paragraph}>
              <RichText text={paragraph} />
            </p>
          ))}
        </Reveal>
      </section>

      {image && (
        <figure className={styles.photo}>
          <ContentImage media={image} sizes="100vw" />
        </figure>
      )}

      <div className={`container ${styles.story}`}>
        {story.map((paragraph, index) => (
          <Reveal key={paragraph} index={index}>
            <p className={styles.text}>
              <RichText text={paragraph} />
            </p>
          </Reveal>
        ))}
      </div>
    </>
  );
}
