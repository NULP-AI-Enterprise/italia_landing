"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { EventView } from "./EventList";
import styles from "./MonthCalendar.module.css";

type MonthCalendarProps = {
  /** "2026-10" */
  month: string;
  events: EventView[];
  /** Chosen period; a single day has from === to. Empty when nothing is chosen. */
  from: string;
  to: string;
  /** Today in Italy ("2026-10-01"). */
  today: string;
  locale: string;
  labels: Dictionary["events"];
  onMonthChange?: (month: string) => void;
  onSelectDay?: (day: string) => void;
  disabled?: boolean;
};

const pad = (value: number) => String(value).padStart(2, "0");
const utc = (year: number, month: number, day: number) => new Date(Date.UTC(year, month - 1, day));
const isoOf = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const parse = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return utc(year, month, day);
};

/** "2026-10" plus or minus whole months. */
export function shiftMonth(month: string, offset: number) {
  const [year, value] = month.split("-").map(Number);
  const date = utc(year, value + offset, 1);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

const addDays = (iso: string, days: number) => {
  const date = parse(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return isoOf(date);
};

const capitalize = (text: string, locale: string) => text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);

/**
 * Month grid as on the reference site: weeks from Monday, a dot under every day
 * with an event. A day is picked with a click; a second day closes a period.
 * Keyboard as in a date picker: arrows move by day and week, Page Up / Page Down
 * by month, Home / End to the start or end of the week.
 */
export function MonthCalendar({
  month,
  events,
  from,
  to,
  today,
  locale,
  labels,
  onMonthChange,
  onSelectDay,
  disabled,
}: MonthCalendarProps) {
  const titleId = useId();
  const tableRef = useRef<HTMLTableElement>(null);
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = utc(year, monthNumber + 1, 0).getUTCDate();
  const leadingBlanks = (utc(year, monthNumber, 1).getUTCDay() + 6) % 7;

  // The one day in the grid reachable with Tab (roving tabindex)
  const [cursor, setCursor] = useState<string | null>(null);
  const [pendingFocus, setPendingFocus] = useState(false);
  const inMonth = (iso: string) => iso.startsWith(month);
  const activeDay =
    cursor && inMonth(cursor) ? cursor : inMonth(from) ? from : inMonth(today) ? today : `${month}-01`;

  useEffect(() => {
    if (!pendingFocus) return;
    tableRef.current?.querySelector<HTMLButtonElement>(`[data-day="${activeDay}"]`)?.focus();
  }, [pendingFocus, activeDay]);

  const moveTo = (iso: string) => {
    setCursor(iso);
    setPendingFocus(true);
    if (!inMonth(iso)) onMonthChange?.(iso.slice(0, 7));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const weekday = (parse(activeDay).getUTCDay() + 6) % 7;
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(activeDay, -1),
      ArrowRight: () => addDays(activeDay, 1),
      ArrowUp: () => addDays(activeDay, -7),
      ArrowDown: () => addDays(activeDay, 7),
      Home: () => addDays(activeDay, -weekday),
      End: () => addDays(activeDay, 6 - weekday),
      PageUp: () => {
        const target = shiftMonth(month, -1);
        return `${target}-${pad(Math.min(Number(activeDay.slice(8)), utc(+target.slice(0, 4), +target.slice(5) + 1, 0).getUTCDate()))}`;
      },
      PageDown: () => {
        const target = shiftMonth(month, 1);
        return `${target}-${pad(Math.min(Number(activeDay.slice(8)), utc(+target.slice(0, 4), +target.slice(5) + 1, 0).getUTCDate()))}`;
      },
    };
    const move = moves[event.key];
    if (!move || disabled) return;
    event.preventDefault();
    moveTo(move());
  };

  const monthName = capitalize(
    new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(utc(year, monthNumber, 1)),
    locale,
  );
  const dayFormat = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" });
  const weekdays = Array.from({ length: 7 }, (_, index) => {
    const date = utc(2024, 1, 1 + index); // 1 January 2024 was a Monday
    return {
      short: capitalize(new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(date), locale),
      long: new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(date),
    };
  });
  const plural = new Intl.PluralRules(locale);

  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));

  const eventsOn = (day: string) => events.filter((event) => event.startDate <= day && event.endDate >= day).length;

  return (
    <div className={styles.calendar}>
      <div className={styles.head}>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => onMonthChange?.(shiftMonth(month, -1))}
          disabled={disabled}
          aria-label={labels.prevMonth}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className={styles.title} id={titleId} aria-live="polite">
          {monthName} {year}
        </h2>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => onMonthChange?.(shiftMonth(month, 1))}
          disabled={disabled}
          aria-label={labels.nextMonth}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <table ref={tableRef} className={styles.grid} aria-labelledby={titleId} onKeyDown={onKeyDown}>
        <thead>
          <tr>
            {weekdays.map((weekday) => (
              <th scope="col" key={weekday.long}>
                <abbr title={weekday.long}>{weekday.short}</abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((day, index) => {
                if (day === null) return <td key={`blank-${index}`} />;
                const iso = `${month}-${pad(day)}`;
                const count = eventsOn(iso);
                const isToday = iso === today;
                const inRange = Boolean(from && to && iso >= from && iso <= to);
                const edge = iso === from || iso === to;
                const countText =
                  count > 0
                    ? labels.dayCount[plural.select(count) as keyof typeof labels.dayCount].replace("{count}", String(count))
                    : "";
                return (
                  <td key={iso}>
                    <button
                      type="button"
                      className={styles.day}
                      data-day={iso}
                      data-has={count > 0 || undefined}
                      data-today={isToday || undefined}
                      data-range={inRange || undefined}
                      data-edge={(inRange && edge) || undefined}
                      tabIndex={iso === activeDay ? 0 : -1}
                      aria-pressed={inRange}
                      aria-label={[dayFormat.format(utc(year, monthNumber, day)), isToday && labels.today, countText]
                        .filter(Boolean)
                        .join(", ")}
                      onClick={() => {
                        setCursor(iso);
                        onSelectDay?.(iso);
                      }}
                      onBlur={() => setPendingFocus(false)}
                      disabled={disabled}
                    >
                      {day}
                      {count > 0 && <span className={styles.dot} aria-hidden="true" />}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
