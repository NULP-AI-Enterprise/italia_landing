import Image from "next/image";
import type { Dictionary } from "@/i18n/get-dictionary";
import heroImage from "@/assets/images/hero-home.jpg";
import logo from "@/assets/images/logo.png";
import styles from "./HomeHero.module.css";

type HomeHeroProps = {
  hero: Dictionary["home"]["hero"];
  logoAlt: string;
};

export function HomeHero({ hero, logoAlt }: HomeHeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <Image
        className={styles.bg}
        src={heroImage}
        alt=""
        fill
        sizes="100vw"
        loading="eager"
        fetchPriority="high"
      />
      <div className={styles.inner}>
        <Image className={styles.logo} src={logo} alt={logoAlt} sizes="(max-width: 767px) 150px, 330px" preload />

        <div className={styles.content}>
          <h1 className={styles.title} id="hero-title">
            {hero.title}
          </h1>
          <ul className={styles.tricolore}>
            {hero.pillars.map((pillar) => (
              <li key={pillar}>{pillar}</li>
            ))}
          </ul>
          <ul className={styles.cities} aria-label={hero.citiesLabel}>
            {hero.cities.map((city) => (
              <li key={city}>{city}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
