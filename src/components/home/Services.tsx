import Image from "next/image";
import type { Dictionary } from "@/i18n/get-dictionary";
import { Reveal } from "@/components/ui/Reveal";
import officeImage from "@/assets/images/service-office.jpg";
import roadmapImage from "@/assets/images/service-roadmap.jpg";
import b2bImage from "@/assets/images/service-b2b.jpg";
import styles from "./Services.module.css";

const images = [officeImage, roadmapImage, b2bImage];

export function Services({ services }: { services: Dictionary["home"]["services"] }) {
  return (
    <section className={styles.services} id="services" aria-labelledby="services-title">
      <h2 className="visually-hidden" id="services-title">
        {services.heading}
      </h2>
      <div className={`container ${styles.grid}`}>
        {services.items.map((item, index) => (
          <Reveal as="article" className={styles.card} index={index} key={item.title}>
            <div className={styles.media}>
              <Image
                src={images[index]}
                alt={item.imageAlt}
                placeholder="blur"
                sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 33vw"
              />
            </div>
            <div className={styles.body}>
              <h3 className={styles.title}>{item.title}</h3>
              <p className={styles.text}>{item.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
