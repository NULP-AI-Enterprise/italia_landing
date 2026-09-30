import type { EventItem } from "@/content/repository";
import { LinkPreview } from "@/components/ui/LinkPreview";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./EventList.module.css";

/** An event with its dates already written out in the page language ("1–6 жовтня"). */
export type EventView = EventItem & { dateLabel: string };

type EventListProps = {
  /** Already filtered and sorted; the list keeps this order. */
  events: EventView[];
  newTabLabel: string;
};

/** Consecutive events that start in the same year, in the given order. */
function groupByYear(events: EventView[]) {
  const groups: { year: string; events: EventView[] }[] = [];
  for (const event of events) {
    const year = event.startDate.slice(0, 4);
    const last = groups.at(-1);
    if (last?.year === year) last.events.push(event);
    else groups.push({ year, events: [event] });
  }
  return groups;
}

/** Year headings, then the date and city line above each event's link preview, as in the design. */
export function EventList({ events, newTabLabel }: EventListProps) {
  return (
    <div className={styles.calendar}>
      {groupByYear(events).map(({ year, events: items }) => (
        <section aria-labelledby={`year-${year}`} key={year}>
          <h2 className={styles.yearTitle} id={`year-${year}`}>
            {year}
          </h2>
          <ol className={styles.list}>
            {items.map((event, index) => (
              <Reveal as="li" className={styles.event} index={index % 3} key={event.id}>
                <p className={styles.when}>
                  <time dateTime={event.startDate}>{event.dateLabel}</time> {event.city}
                </p>
                <LinkPreview
                  title={event.title}
                  heading="h3"
                  description={event.description}
                  href={event.website}
                  image={event.image}
                  imageLayout={event.imageLayout}
                  newTabLabel={newTabLabel}
                />
              </Reveal>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
