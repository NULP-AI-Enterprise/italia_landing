"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { moveItemAction } from "@/app/admin/content/actions";

export type BrowserItem = {
  id: string;
  label: string;
  details?: string;
  thumb?: string;
  published?: boolean;
};

type CollectionBrowserProps = {
  collection: string;
  items: BrowserItem[];
  ordered: boolean;
  /** Partner page the list is limited to; moves stay within it. */
  filter?: string;
  base: string;
};

const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Cards with a picture, a search field and move buttons for ordered lists. */
export function CollectionBrowser({ collection, items, ordered, filter, base }: CollectionBrowserProps) {
  const [query, setQuery] = useState("");
  const searchId = useId();
  const needle = normalize(query.trim());
  const shown = needle
    ? items.filter((item) => normalize(`${item.label} ${item.details ?? ""} ${item.id}`).includes(needle))
    : items;
  const canMove = ordered && !needle;

  return (
    <div className="adm-browser">
      {items.length > 6 && (
        <div className="adm-search" role="search">
          <label htmlFor={searchId}>Пошук у списку</label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Назва, ім’я або місто"
            autoComplete="off"
          />
          <p className="adm-muted" role="status">
            {needle ? `Знайдено: ${shown.length} з ${items.length}` : `Усього: ${items.length}`}
          </p>
        </div>
      )}

      {shown.length === 0 ? (
        <p className="adm-empty">{items.length === 0 ? "Тут поки порожньо. Натисніть «Додати»." : "Нічого не знайдено."}</p>
      ) : (
        <ol className="adm-cards">
          {shown.map((item, index) => (
            <li key={item.id} id={`item-${item.id}`} className="adm-card" data-hidden={item.published === false || undefined}>
              <Link className="adm-card-link" href={`${base}/${item.id}`}>
                <span className="adm-card-thumb" aria-hidden="true">
                  {item.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element -- small admin preview
                    <img src={item.thumb} alt="" loading="lazy" />
                  ) : (
                    <span>{item.label.charAt(0)}</span>
                  )}
                </span>
                <span className="adm-card-body">
                  <span className="adm-card-title">{item.label}</span>
                  {item.details && <span className="adm-card-text">{item.details}</span>}
                  {item.published === false && <span className="adm-chip">Приховано</span>}
                </span>
              </Link>
              {canMove && (
                <div className="adm-card-move" role="group" aria-label={`Порядок: ${item.label}`}>
                  {(["up", "down"] as const).map((direction) => (
                    <form action={moveItemAction} key={direction}>
                      <input type="hidden" name="collection" value={collection} />
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="direction" value={direction} />
                      {filter && <input type="hidden" name="filter" value={filter} />}
                      <button
                        type="submit"
                        className="adm-icon"
                        disabled={direction === "up" ? index === 0 : index === shown.length - 1}
                        aria-label={`${direction === "up" ? "Вище" : "Нижче"}: ${item.label}`}
                      >
                        {direction === "up" ? "↑" : "↓"}
                      </button>
                    </form>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
