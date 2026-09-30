import Link from "next/link";
import { serviceAnchor } from "@/content/anchors";
import type { ServiceItem } from "@/content/repository";
import { ContentImage } from "@/components/ui/ContentImage";
import { Reveal } from "@/components/ui/Reveal";
import { RichText } from "@/components/ui/RichText";
import { localePath, type Locale } from "@/i18n/config";
import styles from "./ServiceDetails.module.css";

type ServiceDetailsProps = {
  locale: Locale;
  heading: string;
  services: ServiceItem[];
};

/** Full description of every service; targets of the cards above. */
export function ServiceDetails({ locale, heading, services }: ServiceDetailsProps) {
  return (
    <section className={styles.details} aria-labelledby="details-title">
      <h2 className="visually-hidden" id="details-title">
        {heading}
      </h2>
      {services.map((service) => (
        <article
          className={`container ${styles.service}`}
          id={serviceAnchor(service.id)}
          aria-labelledby={`${serviceAnchor(service.id)}-title`}
          key={service.id}
        >
          <Reveal className={styles.top}>
            <div className={styles.media}>
              <ContentImage media={service.image} sizes="(max-width: 767px) 100vw, 32vw" />
            </div>
            <div>
              <h3 className={styles.title} id={`${serviceAnchor(service.id)}-title`}>
                {service.title}
              </h3>
              <p className={styles.lead}>
                <RichText text={service.lead} />
              </p>
            </div>
          </Reveal>
          <div className={styles.body}>
            {service.body.map((paragraph, index) => (
              <p key={index}>
                <RichText text={paragraph} />
              </p>
            ))}
            {service.link && (
              <p>
                <Link className={styles.link} href={localePath(locale, service.link.href)}>
                  {service.link.label}
                  <span aria-hidden="true"> →</span>
                </Link>
              </p>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
