import type { EventItem } from "@/content/repository";
import { LinkPreview } from "@/components/ui/LinkPreview";
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

/** Month headings; each event as a date column next to its link preview. */
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
                  <p className={styles.when}>
                    <time dateTime={event.startDate}>
                      {sameMonth ? (
                        <>
                          <span className={styles.days} aria-hidden="true">
                            {startDay === endDay ? startDay : `${startDay}–${endDay}`}
                          </span>
                          <span className={styles.month} aria-hidden="true">
                            {monthShort.format(asDate(event.startDate))}
                          </span>
                          <span className="visually-hidden">{event.dateLabel}</span>
                        </>
                      ) : (
                        <span className={styles.span}>{event.dateLabel}</span>
                      )}
                    </time>
                    <span className={styles.city}>{event.city}</span>
                  </p>
                  <LinkPreview
                    title={event.title}
                    heading="h4"
                    description={event.description}
                    href={event.website}
                    image={event.image}
                    imageLayout={event.imageLayout}
                    newTabLabel={newTabLabel}
                  />
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
