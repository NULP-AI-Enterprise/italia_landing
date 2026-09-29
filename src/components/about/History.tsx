import type { AboutPageContent } from "@/content/repository";
import { ContentImage } from "@/components/ui/ContentImage";
import { Reveal } from "@/components/ui/Reveal";
import { RichText, TextLines } from "@/components/ui/RichText";
import styles from "./History.module.css";

export function History({ history }: { history: AboutPageContent["history"] }) {
  return (
    <section className={styles.history} aria-labelledby="history-title">
      <div className={`container ${styles.grid}`}>
        <Reveal>
          <p className="eyebrow">{history.eyebrow}</p>
          <h2 className={`section-title ${styles.title}`} id="history-title">
            <TextLines text={history.title} />
          </h2>
          <div className={styles.body}>
            {history.paragraphs.map((paragraph, index) => (
              <p key={index}>
                <RichText text={paragraph} />
              </p>
            ))}
          </div>
        </Reveal>

        <ul className={styles.collage}>
          {history.images.map((image, index) => (
            <Reveal as="li" className={styles.item} index={index} key={image.src}>
              <ContentImage media={image} sizes="(max-width: 960px) 50vw, 24vw" />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
