"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { EventList, type EventView } from "./EventList";
import styles from "./EventCalendar.module.css";

type Sort = "asc" | "desc";

type CalendarProps = {
  /** Earliest first. */
  events: EventView[];
  locale: string;
  labels: Dictionary["events"];
  newTabLabel: string;
};

type ViewProps = CalendarProps & {
  from: string;
  to: string;
  sort: Sort;
  onFromChange?: (value: string) => void;
  onToChange?: (value: string) => void;
  onSortChange?: (value: Sort) => void;
  onReset?: () => void;
  /** Server HTML before the URL is read: the full list with inactive controls. */
  disabled?: boolean;
};

const readDate = (value: string | null) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "");

/**
 * Events filtered by a date range and sorted by date in either direction.
 * Filters live in the URL: ?from=2026-10-01&to=2026-11-30&sort=desc
 */
export function EventCalendar(props: CalendarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Local state keeps typing in the date fields smooth while the URL catches up.
  const [from, setFrom] = useState(() => readDate(params.get("from")));
  const [to, setTo] = useState(() => readDate(params.get("to")));
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
      onFromChange={(value) => {
        setFrom(value);
        updateUrl({ from: value });
      }}
      onToChange={(value) => {
        setTo(value);
        updateUrl({ to: value });
      }}
      onSortChange={(value) => updateUrl({ sort: value === "desc" ? value : "" })}
      onReset={() => {
        setFrom("");
        setTo("");
        router.replace(pathname, { scroll: false });
      }}
    />
  );
}

export function EventCalendarView({
  events,
  locale,
  labels,
  newTabLabel,
  from,
  to,
  sort,
  onFromChange,
  onToChange,
  onSortChange,
  onReset,
  disabled,
}: ViewProps) {
  const ids = { from: useId(), to: useId(), sort: useId(), message: useId() };

  const invalidRange = Boolean(from && to && from > to);
  // An event counts when any of its days falls inside the range.
  const filtered = invalidRange
    ? []
    : events.filter((event) => (!from || event.endDate >= from) && (!to || event.startDate <= to));
  const results = sort === "desc" ? [...filtered].reverse() : filtered;

  const hasFilters = Boolean(from || to || sort === "desc");
  const countText = labels.count[new Intl.PluralRules(locale).select(results.length) as keyof typeof labels.count]
    .replace("{count}", String(results.length));
  const sortOptions = [
    { value: "asc", label: labels.sortAsc },
    { value: "desc", label: labels.sortDesc },
  ] as const;

  return (
    <div className={`container ${styles.wrap}`}>
      <div className={styles.toolbar} role="search" aria-label={labels.filtersLabel}>
        <fieldset className={styles.group} disabled={disabled}>
          <legend className={styles.legend}>{labels.period}</legend>
          <div className={styles.range}>
            <div className={styles.field}>
              <label htmlFor={ids.from}>{labels.from}</label>
              <input
                id={ids.from}
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => onFromChange?.(event.target.value)}
              />
            </div>
            <span className={styles.dash} aria-hidden="true">
              –
            </span>
            <div className={styles.field}>
              <label htmlFor={ids.to}>{labels.to}</label>
              <input
                id={ids.to}
                type="date"
                value={to}
                min={from || undefined}
                aria-invalid={invalidRange || undefined}
                aria-describedby={invalidRange ? ids.message : undefined}
                onChange={(event) => onToChange?.(event.target.value)}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className={styles.group} disabled={disabled}>
          <legend className={styles.legend}>{labels.sort}</legend>
          <div className={styles.segmented}>
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
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={styles.summary}>
        <p className={styles.count} role="status">
          {invalidRange ? labels.rangeError : countText}
        </p>
        {hasFilters && (
          <button type="button" className={styles.reset} onClick={onReset}>
            {labels.reset}
          </button>
        )}
      </div>

      {results.length > 0 ? (
        <EventList events={results} newTabLabel={newTabLabel} />
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyTitle} id={ids.message}>
            {invalidRange ? labels.rangeError : labels.empty}
          </p>
          <p>{labels.emptyHint}</p>
        </div>
      )}
    </div>
  );
}
