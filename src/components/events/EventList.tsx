import type { EventYearEntry } from "@/content/repository";
import { ExternalLink, displayDomain } from "@/components/ui/ExternalLink";
import { Reveal } from "@/components/ui/Reveal";
import type { Locale } from "@/i18n/config";
import styles from "./EventList.module.css";

type EventListProps = {
  years: EventYearEntry[];
  locale: Locale;
  newTabLabel: string;
};

/** "1–6 October 2026" in the page language; dates are plain calendar days (UTC). */
function formatRange(start: string, end: string, locale: Locale) {
  const format = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" });
  return format.formatRange(new Date(`${start}T00:00:00Z`), new Date(`${end}T00:00:00Z`));
}

export function EventList({ years, locale, newTabLabel }: EventListProps) {
  return (
    <div className={`container ${styles.calendar}`}>
      {years.map(({ year, events }) => (
        <section className={styles.year} aria-labelledby={`year-${year}`} key={year}>
          <h2 className={styles.yearTitle} id={`year-${year}`}>
            {year}
          </h2>
          <ol className={styles.list}>
            {events.map((event, index) => (
              <Reveal as="li" className={styles.event} index={index % 3} key={event.id}>
                <p className={styles.when}>
                  <time dateTime={event.startDate}>{formatRange(event.startDate, event.endDate, locale)}</time>
                  <span aria-hidden="true"> · </span>
                  <span className={styles.city}>{event.city}</span>
                </p>
                <h3 className={styles.title}>{event.title}</h3>
                {event.description && <p className={styles.description}>{event.description}</p>}
                {event.website && (
                  <p className={styles.site}>
                    <ExternalLink href={event.website} newTabLabel={newTabLabel}>
                      {displayDomain(event.website)}
                    </ExternalLink>
                  </p>
                )}
              </Reveal>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
