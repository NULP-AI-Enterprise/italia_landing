import { serviceAnchor } from "@/content/anchors";
import type { ServiceItem } from "@/content/repository";
import { ContentImage } from "@/components/ui/ContentImage";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./ServiceCards.module.css";

type ServiceCardsProps = {
  heading: string;
  services: ServiceItem[];
};

/** Three service teasers. Each card jumps (smooth scroll) to its detailed block below. */
export function ServiceCards({ heading, services }: ServiceCardsProps) {
  return (
    <section className={styles.section} aria-labelledby="services-title">
      <h2 className="visually-hidden" id="services-title">
        {heading}
      </h2>
      <ul className={`container ${styles.grid}`}>
        {services.map((service, index) => (
          <Reveal as="li" index={index} key={service.id}>
            <a
              className={styles.card}
              href={`#${serviceAnchor(service.id)}`}
              aria-labelledby={`card-${service.id}`}
            >
              <span className={styles.media}>
                <ContentImage
                  media={{ ...service.image, alt: undefined }}
                  sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 30vw"
                  eager
                />
              </span>
              <h3 className={styles.title} id={`card-${service.id}`}>
                {service.title}
              </h3>
              <p className={styles.text}>{service.summary}</p>
              {/* Shows that the card scrolls down to its detailed block */}
              <span className={styles.more} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M6 13l6 6 6-6" />
                </svg>
              </span>
            </a>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
