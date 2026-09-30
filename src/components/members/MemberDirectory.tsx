"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useId, useRef, useState } from "react";
import type { MembersDirectory } from "@/content/repository";
import type { Dictionary } from "@/i18n/get-dictionary";
import { MemberProfile } from "./MemberProfile";
import { MemberResults, type MemberItem } from "./MemberResults";
import { RegionMap } from "./RegionMap";
import styles from "./MemberDirectory.module.css";

type MemberDirectoryProps = MembersDirectory & {
  locale: string;
  labels: Dictionary["members"];
  newTabLabel: string;
};

type MemberSearchProps = MemberDirectoryProps & {
  /** Current query string, e.g. "q=abra&region=UA-30". */
  search: string;
  /** Replaces the query string. Without it (server HTML before the URL is read) controls are inactive. */
  navigate?: (search: string) => void;
};

type Country = "UA" | "IT";

const normalize = (value: string, locale: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase(locale).trim();

const plural = (forms: Record<"one" | "few" | "many" | "other", string>, count: number, locale: string) =>
  forms[new Intl.PluralRules(locale).select(count) as keyof typeof forms].replace("{count}", String(count));

/** Reads and writes the filters in the URL. */
export function MemberDirectory(props: MemberDirectoryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <MemberSearch
      {...props}
      search={params.toString()}
      navigate={(search) => router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false })}
    />
  );
}

/**
 * Member search. One filter panel on the left, in the order of the design:
 * name (text field), industry (drop-down), region (country switch, region list
 * and a clickable map); results on the right. Filters live in the URL:
 * ?q=…&industry=…&country=…&region=…
 */
export function MemberSearch({
  members,
  industries,
  regions,
  locale,
  labels,
  newTabLabel,
  search,
  navigate,
}: MemberSearchProps) {
  const params = new URLSearchParams(search);
  const disabled = !navigate;
  const ids = { name: useId(), industry: useId(), region: useId(), regionTitle: useId(), results: useId() };

  const [query, setQuery] = useState(params.get("q") ?? "");
  const deferredQuery = useDeferredValue(query);
  const industry = params.get("industry") ?? "";
  const region = params.get("region") ?? "";
  const country: Country = region.startsWith("IT") || params.get("country") === "IT" ? "IT" : "UA";

  const [hovered, setHovered] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  const updateUrl = (changes: Record<string, string>) => {
    const next = new URLSearchParams(search);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    navigate?.(next.toString());
  };

  const setName = (value: string) => {
    setQuery(value);
    updateUrl({ q: value });
  };
  const setCountry = (value: Country) =>
    updateUrl({ country: value === "UA" ? "" : value, region: region.startsWith(value) ? region : "" });
  const setRegion = (code: string) => updateUrl({ region: code, country: code.startsWith("IT") ? "IT" : "" });
  const reset = () => {
    setQuery("");
    navigate?.("");
  };
  // A removed filter chip disappears, so focus moves to the results heading.
  const removeFilter = (key: "q" | "industry" | "region") => {
    if (key === "q") setName("");
    else updateUrl({ [key]: "" });
    resultsHeadingRef.current?.focus();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (profileId && dialog && !dialog.open) dialog.showModal();
  }, [profileId]);

  // Cheap enough to recompute on every render; React Compiler memoizes it.
  const needle = normalize(deferredQuery, locale);
  const matches = (member: MemberItem) =>
    (!needle || normalize(member.name, locale).includes(needle)) && (!industry || member.industries.includes(industry));
  // The map counts members under the name and industry filters, whatever region is selected.
  const counts: Record<string, number> = {};
  for (const member of members) {
    if (!matches(member)) continue;
    for (const code of member.regions) counts[code] = (counts[code] ?? 0) + 1;
  }
  const results = members.filter((member) => matches(member) && (!region || member.regions.includes(region)));

  const collator = new Intl.Collator(locale);
  const regionNames = Object.fromEntries(regions.map((r) => [r.code, r.name]));
  const industryNames = Object.fromEntries(industries.map((i) => [i.id, i.name]));
  const countryRegions = regions
    .filter((r) => r.code.startsWith(country))
    .sort((a, b) => collator.compare(a.name, b.name));
  const countryName = country === "UA" ? labels.ukraine : labels.italy;

  const focusRegion = hovered ?? (region || null);
  const mapCaption = focusRegion
    ? `${regionNames[focusRegion]} · ${plural(labels.regionCount, counts[focusRegion] ?? 0, locale)}`
    : labels.mapHint;

  const chips = [
    query && { key: "q" as const, label: labels.byName, value: `«${query}»` },
    industry && { key: "industry" as const, label: labels.industryLabel, value: industryNames[industry] },
    region && { key: "region" as const, label: labels.regionLabel, value: regionNames[region] },
  ].filter((chip) => chip && chip.value) as { key: "q" | "industry" | "region"; label: string; value: string }[];
  const hasFilters = chips.length > 0 || Boolean(params.get("country"));
  const profile = members.find((member) => member.id === profileId);

  return (
    <div className={`container ${styles.directory}`}>
      <div className={styles.panel} role="search" aria-label={labels.filtersLabel}>
        {/* 1. Name */}
        <div className={styles.block}>
          <label className={styles.label} htmlFor={ids.name}>
            {labels.byName}
          </label>
          <div className={styles.searchField}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3.8-3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              ref={nameRef}
              id={ids.name}
              type="search"
              value={query}
              onChange={(event) => setName(event.target.value)}
              placeholder={labels.namePlaceholder}
              autoComplete="off"
              spellCheck={false}
              disabled={disabled}
            />
            {query && (
              <button
                type="button"
                className={styles.clear}
                onClick={() => {
                  setName("");
                  nameRef.current?.focus();
                }}
                aria-label={labels.clearSearch}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 2. Industry: the 12 industries in a drop-down */}
        <div className={styles.block}>
          <label className={styles.label} htmlFor={ids.industry}>
            {labels.byIndustry}
          </label>
          <select
            id={ids.industry}
            className={styles.select}
            value={industry}
            disabled={disabled}
            onChange={(event) => updateUrl({ industry: event.target.value })}
          >
            <option value="">{labels.allIndustries}</option>
            {industries.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Region: country, then a region from the list or the map */}
        <fieldset className={`${styles.block} ${styles.regionBlock}`} disabled={disabled}>
          <legend className={styles.label}>{labels.byRegion}</legend>
          <div className={styles.regionControls}>
            <div className={styles.countries} role="radiogroup" aria-label={labels.country}>
              {(["UA", "IT"] as const).map((value) => (
                <label key={value} className={styles.country}>
                  <input
                    type="radio"
                    name={ids.region + "-country"}
                    value={value}
                    checked={country === value}
                    onChange={() => setCountry(value)}
                  />
                  <span>{value === "UA" ? labels.ukraine : labels.italy}</span>
                </label>
              ))}
            </div>
            <label className="visually-hidden" htmlFor={ids.region}>
              {labels.regionLabel}
            </label>
            <select
              id={ids.region}
              className={styles.select}
              value={region}
              onChange={(event) => setRegion(event.target.value)}
            >
              <option value="">{labels.allRegions}</option>
              {countryRegions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <figure className={styles.map}>
            <p className="visually-hidden">{labels.mapLabel.replace("{country}", countryName)}</p>
            <RegionMap
              country={country}
              selected={region}
              counts={counts}
              onSelect={setRegion}
              onHover={setHovered}
            />
            <figcaption className={styles.mapCaption} aria-hidden="true">
              {mapCaption}
            </figcaption>
            <ul className={styles.legend} aria-hidden="true">
              <li>
                <span className={`${styles.swatch} ${styles.swatchHas}`} />
                {labels.legendHas}
              </li>
              <li>
                <span className={`${styles.swatch} ${styles.swatchSelected}`} />
                {labels.legendSelected}
              </li>
            </ul>
          </figure>
        </fieldset>
      </div>

      <section className={styles.results} aria-labelledby={ids.results}>
        <div className={styles.resultsHead}>
          <h2 className={styles.resultsTitle} id={ids.results} ref={resultsHeadingRef} tabIndex={-1}>
            {labels.resultsTitle}
          </h2>
          <p className={styles.count} role="status">
            {plural(labels.count, results.length, locale)}
          </p>
        </div>

        {hasFilters && (
          <div className={styles.active}>
            {chips.length > 0 && (
              <ul className={styles.chips}>
                {chips.map((chip) => (
                  <li key={chip.key}>
                    <button type="button" className={styles.chip} onClick={() => removeFilter(chip.key)}>
                      <span className="visually-hidden">{labels.removeFilter}: </span>
                      <span className={styles.chipLabel}>{chip.label}:</span> {chip.value}
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className={styles.reset} onClick={reset}>
              {labels.reset}
            </button>
          </div>
        )}

        {results.length > 0 ? (
          <MemberResults
            members={results}
            locale={locale}
            industryNames={industryNames}
            regionNames={regionNames}
            openLabel={labels.openProfile}
            onOpen={disabled ? undefined : setProfileId}
          />
        ) : (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>{labels.empty}</p>
            <p>{labels.emptyHint}</p>
          </div>
        )}
      </section>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="profile-title"
        onClose={() => setProfileId(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        {profile && (
          <div className={styles.dialogPanel}>
            <button
              type="button"
              className={styles.dialogClose}
              onClick={() => dialogRef.current?.close()}
              aria-label={labels.profileClose}
            >
              <span aria-hidden="true">×</span>
            </button>
            <MemberProfile member={profile} labels={labels} newTabLabel={newTabLabel} titleId="profile-title" />
          </div>
        )}
      </dialog>
    </div>
  );
}
