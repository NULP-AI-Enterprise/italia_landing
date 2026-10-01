"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { EventList, type EventView } from "./EventList";
import { MonthCalendar } from "./MonthCalendar";
import styles from "./EventCalendar.module.css";

type Sort = "asc" | "desc";

type CalendarProps = {
  /** Earliest first. */
  events: EventView[];
  locale: string;
  labels: Dictionary["events"];
  newTabLabel: string;
  /** Today in Italy ("2026-10-01"), from the server so both renders agree. */
  today: string;
};

type ViewProps = CalendarProps & {
  from: string;
  to: string;
  sort: Sort;
  onRangeChange?: (from: string, to: string) => void;
  onSortChange?: (value: Sort) => void;
  onReset?: () => void;
  /** Server HTML before the URL is read: the full list with inactive controls. */
  disabled?: boolean;
};

const readDate = (value: string | null) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "");

/**
 * Events with a month calendar. Picking a day shows its events, a second day
 * makes a period. The choice lives in the URL: ?from=2026-10-06&to=2026-10-14&sort=desc
 */
export function EventCalendar(props: CalendarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const from = readDate(params.get("from"));
  const to = readDate(params.get("to")) || from;
  const sort: Sort = params.get("sort") === "desc" ? "desc" : "asc";

  const updateUrl = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const search = next.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  };

  return (
    <EventCalendarView
      {...props}
      from={from}
      to={to}
      sort={sort}
      onRangeChange={(nextFrom, nextTo) => updateUrl({ from: nextFrom, to: nextTo })}
      onSortChange={(value) => updateUrl({ sort: value === "desc" ? value : "" })}
      onReset={() => updateUrl({ from: "", to: "" })}
    />
  );
}

export function EventCalendarView({
  events,
  locale,
  labels,
  newTabLabel,
  today,
  from,
  to,
  sort,
  onRangeChange,
  onSortChange,
  onReset,
  disabled,
}: ViewProps) {
  const ids = { list: useId(), sort: useId(), hint: useId() };
  const hasRange = Boolean(from && to && from <= to);
  const upcoming = events.filter((event) => event.endDate >= today);
  const [month, setMonth] = useState(() => (from || upcoming[0]?.startDate || today).slice(0, 7));

  // An event counts when any of its days falls inside the period; without a period, upcoming events.
  const filtered = hasRange ? events.filter((event) => event.endDate >= from && event.startDate <= to) : upcoming;
  const results = sort === "desc" ? [...filtered].reverse() : filtered;

  const dateFormat = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" });
  const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
  const title = hasRange
    ? labels.period.replace(
        "{period}",
        from === to ? dateFormat.format(asDate(from)) : dateFormat.formatRange(asDate(from), asDate(to)),
      )
    : labels.upcoming;
  const countText = labels.count[new Intl.PluralRules(locale).select(results.length) as keyof typeof labels.count]
    .replace("{count}", String(results.length));

  // First click picks a day; a click on another day closes the period; a third click starts again.
  const selectDay = (day: string) => {
    if (hasRange && from === to && day !== from) {
      onRangeChange?.(day < from ? day : from, day < from ? from : day);
    } else if (hasRange && from === to && day === from) {
      onReset?.();
    } else {
      onRangeChange?.(day, day);
    }
  };

  const sortOptions = [
    { value: "asc", label: labels.sortAsc },
    { value: "desc", label: labels.sortDesc },
  ] as const;

  return (
    <div className={`container ${styles.wrap}`}>
      <div className={styles.layout}>
        <aside className={styles.aside} aria-label={labels.calendarLabel}>
          <MonthCalendar
            month={month}
            events={events}
            from={hasRange ? from : ""}
            to={hasRange ? to : ""}
            today={today}
            locale={locale}
            labels={labels}
            onMonthChange={setMonth}
            onSelectDay={selectDay}
            disabled={disabled}
          />
          <p className={styles.hint} id={ids.hint}>
            {labels.calendarHint}
          </p>
        </aside>

        <section className={styles.results} aria-labelledby={ids.list}>
          <div className={styles.head}>
            <div className={styles.headText}>
              <h2 className={styles.title} id={ids.list}>
                {title}
              </h2>
              <p className={styles.count} role="status">
                {countText}
              </p>
            </div>
            <div className={styles.tools}>
              {hasRange && (
                <button type="button" className={styles.reset} onClick={onReset} disabled={disabled}>
                  {labels.reset}
                </button>
              )}
              <fieldset className={styles.sort} disabled={disabled}>
                <legend className="visually-hidden">{labels.sort}</legend>
                {sortOptions.map((option) => (
                  <label className={styles.segment} key={option.value}>
                    <input
                      type="radio"
                      name={ids.sort}
                      value={option.value}
                      checked={sort === option.value}
                      onChange={() => onSortChange?.(option.value)}
                    />
                    <span>
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                          d={option.value === "asc" ? "M12 19V5m-6 6 6-6 6 6" : "M12 5v14m-6-6 6 6 6-6"}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {option.label}
                    </span>
                  </label>
                ))}
              </fieldset>
            </div>
          </div>

          {results.length > 0 ? (
            <EventList events={results} locale={locale} newTabLabel={newTabLabel} />
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>{labels.empty}</p>
              <p>{labels.emptyHint}</p>
              {hasRange && (
                <button type="button" className={styles.reset} onClick={onReset}>
                  {labels.reset}
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
