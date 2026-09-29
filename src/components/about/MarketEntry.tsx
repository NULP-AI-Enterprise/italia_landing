import type { AboutPageContent } from "@/content/repository";
import { ContentImage } from "@/components/ui/ContentImage";
import { Reveal } from "@/components/ui/Reveal";
import { RichText } from "@/components/ui/RichText";
import styles from "./MarketEntry.module.css";

/** Photo on the left (full bleed), statement on the right. */
export function MarketEntry({ market }: { market: AboutPageContent["market"] }) {
  return (
    <section className={styles.market} aria-labelledby="market-title">
      <div className={styles.media}>
        <ContentImage media={market.image} sizes="(max-width: 960px) 100vw, 52vw" />
      </div>
      <Reveal className={styles.content}>
        <h2 className={`section-title ${styles.title}`} id="market-title">
          {market.title}
        </h2>
        <span className="rule" aria-hidden="true" />
        <p className={styles.text}>
          <RichText text={market.text} />
        </p>
      </Reveal>
    </section>
  );
}
