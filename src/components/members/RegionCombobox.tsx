"use client";

import { useId, useState, type KeyboardEvent } from "react";
import styles from "./RegionCombobox.module.css";

type Region = { code: string; name: string };

type RegionComboboxProps = {
  id: string;
  /** Regions of both countries. */
  regions: Region[];
  /** Selected region code, or "". */
  value: string;
  onChange: (code: string) => void;
  locale: string;
  labels: {
    placeholder: string;
    noMatch: string;
    clear: string;
    ukraine: string;
    italy: string;
    suggestions: string;
  };
  disabled?: boolean;
  describedBy?: string;
};

const normalize = (value: string, locale: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase(locale).trim();

/**
 * Text field with suggestions for the region (WAI-ARIA combobox with a list):
 * type a few letters, pick with the mouse or with ↑ ↓ and Enter, Esc closes.
 */
export function RegionCombobox({
  id,
  regions,
  value,
  onChange,
  locale,
  labels,
  disabled,
  describedBy,
}: RegionComboboxProps) {
  const listId = useId();
  const statusId = useId();
  const selected = regions.find((region) => region.code === value);
  // null: show the selected region; a string: what the visitor is typing
  const [text, setText] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const needle = normalize(text ?? "", locale);
  const options = needle
    ? regions
        .filter((region) => normalize(region.name, locale).includes(needle))
        .sort(
          (a, b) =>
            Number(!normalize(a.name, locale).startsWith(needle)) - Number(!normalize(b.name, locale).startsWith(needle)),
        )
    : regions;
  const country = (code: string) => (code.startsWith("IT") ? labels.italy : labels.ukraine);

  const choose = (code: string) => {
    onChange(code);
    setText(null);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      else setActive((index) => Math.min(index + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && options[active]) {
      event.preventDefault();
      choose(options[active].code);
    } else if (event.key === "Escape") {
      setText(null);
      setOpen(false);
    }
  };

  const activeId = open && options[active] ? `${listId}-${options[active].code}` : undefined;

  return (
    <div className={styles.combo}>
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        aria-describedby={describedBy}
        autoComplete="off"
        spellCheck={false}
        placeholder={labels.placeholder}
        value={text ?? selected?.name ?? ""}
        disabled={disabled}
        onChange={(event) => {
          setText(event.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          // An exact name counts as a choice; anything else goes back to the current region.
          const exact = text && regions.find((region) => normalize(region.name, locale) === needle);
          if (exact) choose(exact.code);
          else {
            setText(null);
            setOpen(false);
          }
        }}
      />
      {(value || text) && (
        <button
          type="button"
          className={styles.clear}
          aria-label={labels.clear}
          disabled={disabled}
          onClick={() => {
            setText(null);
            onChange("");
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}

      <ul id={listId} role="listbox" className={styles.list} hidden={!open}>
        {options.length === 0 ? (
          <li className={styles.empty} role="option" aria-disabled="true" aria-selected="false">
            {labels.noMatch}
          </li>
        ) : (
          options.map((region, index) => (
            <li
              key={region.code}
              id={`${listId}-${region.code}`}
              role="option"
              aria-selected={region.code === value}
              data-active={index === active || undefined}
              className={styles.option}
              // Keeps focus in the field, so the click lands before the field closes the list
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(region.code)}
            >
              <span>{region.name}</span>
              <span className={styles.country}>{country(region.code)}</span>
            </li>
          ))
        )}
      </ul>
      <p className="visually-hidden" id={statusId} role="status">
        {open && text ? labels.suggestions.replace("{count}", String(options.length)) : ""}
      </p>
    </div>
  );
}
