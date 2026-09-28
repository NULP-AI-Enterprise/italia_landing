import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/i18n/get-dictionary";
import { Reveal } from "@/components/ui/Reveal";
import { RichText } from "@/components/ui/RichText";
import arches from "@/assets/images/arches.jpg";
import styles from "./MarketEntry.module.css";

type MarketEntryProps = {
  market: Dictionary["about"]["market"];
  ctaHref: string;
};

export function MarketEntry({ market, ctaHref }: MarketEntryProps) {
  return (
    <section className={styles.market} aria-labelledby="market-title">
      <Image
        className={styles.photo}
        src={arches}
        alt={market.imageAlt}
        sizes="(max-width: 960px) 100vw, 50vw"
      />
      <Reveal className={styles.panel}>
        <h2 className={`section-title ${styles.title}`} id="market-title">
          {market.title}
        </h2>
        <span className="rule" aria-hidden="true" />
        <p className={styles.text}>
          <RichText text={market.text} />
        </p>
        <Link className="btn" href={ctaHref}>
          {market.cta}
        </Link>
      </Reveal>
    </section>
  );
}
