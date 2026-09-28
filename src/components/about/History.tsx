import Image from "next/image";
import type { Dictionary } from "@/i18n/get-dictionary";
import { Reveal } from "@/components/ui/Reveal";
import { RichText } from "@/components/ui/RichText";
import signing from "@/assets/images/history-signing.jpg";
import conference from "@/assets/images/history-conference.jpg";
import expo from "@/assets/images/history-expo.jpg";
import members from "@/assets/images/history-members.jpg";
import styles from "./History.module.css";

const photos = [signing, conference, expo, members];

export function History({ history }: { history: Dictionary["about"]["history"] }) {
  return (
    <section className={styles.history} aria-labelledby="history-title">
      <div className={`container ${styles.grid}`}>
        <Reveal>
          <span className="eyebrow">{history.eyebrow}</span>
          <h2 className={`section-title ${styles.title}`} id="history-title">
            {history.titleLines.map((line) => (
              <span className="line" key={line}>
                {line}{" "}
              </span>
            ))}
          </h2>
          <div className={styles.body}>
            {history.paragraphs.map((paragraph) => (
              <p key={paragraph}>
                <RichText text={paragraph} />
              </p>
            ))}
          </div>
        </Reveal>

        <div className={styles.collage}>
          {photos.map((photo, index) => (
            <Reveal as="figure" className={styles.item} index={index} key={photo.src}>
              <Image
                src={photo}
                alt={history.imageAlts[index]}
                placeholder="blur"
                sizes="(max-width: 960px) 50vw, 25vw"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
