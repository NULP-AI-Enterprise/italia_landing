import type { EventItem } from "@/content/repository";
import { ContentImage } from "@/components/ui/ContentImage";
import { displayDomain } from "@/components/ui/ExternalLink";
import styles from "./EventList.module.css";

/** An event with its dates already written out in the page language ("1–6 жовтня"). */
export type EventView = EventItem & { dateLabel: string };

type EventListProps = {
  /** Already filtered and sorted; the list keeps this order. */
  events: EventView[];
  locale: string;
  newTabLabel: string;
};

const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const capitalize = (text: string, locale: string) => text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);

/** Consecutive events that start in the same month, in the given order. */
function groupByMonth(events: EventView[]) {
  const groups: { month: string; events: EventView[] }[] = [];
  for (const event of events) {
    const month = event.startDate.slice(0, 7);
    const last = groups.at(-1);
    if (last?.month === month) last.events.push(event);
    else groups.push({ month, events: [event] });
  }
  return groups;
}

/**
 * Month headings; every event as the same card: the date block on the left,
 * city, name, text and site in the middle, the logo or picture on the right.
 */
export function EventList({ events, locale, newTabLabel }: EventListProps) {
  const monthTitle = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" });
  const monthShort = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });

  return (
    <div className={styles.calendar}>
      {groupByMonth(events).map(({ month, events: items }) => (
        <section aria-labelledby={`month-${month}`} key={month}>
          <h3 className={styles.monthTitle} id={`month-${month}`}>
            {capitalize(monthTitle.format(asDate(`${month}-01`)), locale)} <span>{month.slice(0, 4)}</span>
          </h3>
          <ol className={styles.list}>
            {items.map((event) => {
              const sameMonth = event.startDate.slice(0, 7) === event.endDate.slice(0, 7);
              const startDay = Number(event.startDate.slice(8));
              const endDay = Number(event.endDate.slice(8));
              return (
                <li className={styles.event} key={event.id} id={`event-${event.id}`}>
                  <article className={styles.card} data-linked={event.website ? true : undefined}>
                    <p className={styles.date}>
                      <time dateTime={event.startDate}>
                        <span className="visually-hidden">{event.dateLabel}</span>
                        <span aria-hidden="true" className={sameMonth ? styles.days : styles.span}>
                          {sameMonth ? (startDay === endDay ? startDay : `${startDay}–${endDay}`) : event.dateLabel}
                        </span>
                        {sameMonth && (
                          <span aria-hidden="true" className={styles.month}>
                            {monthShort.format(asDate(event.startDate))} {event.startDate.slice(0, 4)}
                          </span>
                        )}
                      </time>
                    </p>

                    <div className={styles.body}>
                      <p className={styles.city}>
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path
                            d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          <circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        {event.city}
                      </p>
                      <h4 className={styles.title}>
                        {event.website ? (
                          <a className={styles.link} href={event.website} target="_blank" rel="noopener noreferrer">
                            {event.title}
                            <span className="visually-hidden"> ({newTabLabel})</span>
                          </a>
                        ) : (
                          event.title
                        )}
                      </h4>
                      {event.description && <p className={styles.description}>{event.description}</p>}
                      {event.website && <p className={styles.source}>{displayDomain(event.website)} ↗</p>}
                    </div>

                    <div className={styles.media} aria-hidden="true">
                      {event.image ? (
                        <ContentImage media={{ ...event.image, alt: undefined }} sizes="120px" />
                      ) : (
                        <span>{event.title.charAt(0)}</span>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
