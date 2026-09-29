"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useId, useState } from "react";
import type { MembersDirectory } from "@/content/repository";
import type { Dictionary } from "@/i18n/get-dictionary";
import { MemberList } from "./MemberList";
import { RegionMaps } from "./RegionMaps";
import styles from "./MemberDirectory.module.css";

type MemberDirectoryProps = MembersDirectory & {
  locale: string;
  labels: Dictionary["members"];
  newTabLabel: string;
};

const normalize = (value: string, locale: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase(locale).trim();

/**
 * Member search by industry, name and region. The filter state lives in the
 * URL (?q=…&industry=…&region=…) so any result can be shared or bookmarked.
 */
export function MemberDirectory({
  members,
  industries,
  regions,
  locale,
  labels,
  newTabLabel,
}: MemberDirectoryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const ids = { name: useId(), region: useId(), hint: useId() };

  const [query, setQuery] = useState(params.get("q") ?? "");
  const deferredQuery = useDeferredValue(query);
  const selectedIndustries = params.getAll("industry");
  const selectedRegion = params.get("region") ?? "";

  const updateUrl = (change: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    change(next);
    const search = next.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  };

  const setName = (value: string) => {
    setQuery(value);
    updateUrl((next) => (value ? next.set("q", value) : next.delete("q")));
  };

  const toggleIndustry = (id: string) =>
    updateUrl((next) => {
      const current = next.getAll("industry");
      next.delete("industry");
      const updated = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      updated.forEach((value) => next.append("industry", value));
    });

  const setRegion = (code: string) =>
    updateUrl((next) => (code ? next.set("region", code) : next.delete("region")));

  const reset = () => {
    setQuery("");
    router.replace(pathname, { scroll: false });
  };

  // Cheap enough to recompute on every render; React Compiler memoizes it.
  const needle = normalize(deferredQuery, locale);
  const results = members.filter(
    (member) =>
      (!needle || normalize(member.name, locale).includes(needle)) &&
      (selectedIndustries.length === 0 ||
        member.industries.some((id) => selectedIndustries.includes(id))) &&
      (!selectedRegion || member.regions.includes(selectedRegion)),
  );

  const hasFilters = Boolean(query || selectedIndustries.length || selectedRegion);
  const regionNames = Object.fromEntries(regions.map((r) => [r.code, r.name]));
  const collator = new Intl.Collator(locale);
  const sortedRegions = (country: "UA" | "IT") =>
    regions.filter((r) => r.code.startsWith(country)).sort((a, b) => collator.compare(a.name, b.name));
  const countText = labels.count[new Intl.PluralRules(locale).select(results.length) as keyof typeof labels.count]
    .replace("{count}", String(results.length));

  return (
    <div className={`container ${styles.directory}`}>
      <div className={styles.top}>
        <nav aria-label={labels.searchModes}>
          <ul className={styles.modes}>
            <li>
              <a className={styles.pill} href="#search-industry">
                {labels.byIndustry}
              </a>
            </li>
            <li>
              <a className={styles.pill} href="#search-name">
                {labels.byName}
              </a>
            </li>
            <li>
              <a className={styles.pill} href="#search-region">
                {labels.byRegion}
              </a>
            </li>
          </ul>
        </nav>

        <section className={styles.region} id="search-region" aria-labelledby={`${ids.region}-title`}>
          <h2 className="visually-hidden" id={`${ids.region}-title`}>
            {labels.byRegion}
          </h2>
          <RegionMaps selected={selectedRegion} regionNames={regionNames} onSelect={setRegion} />
          <div className={styles.field}>
            <label htmlFor={ids.region}>{labels.regionLabel}</label>
            <select
              id={ids.region}
              value={selectedRegion}
              onChange={(event) => setRegion(event.target.value)}
              aria-describedby={`${ids.region}-hint`}
            >
              <option value="">{labels.allRegions}</option>
              <optgroup label={labels.ukraine}>
                {sortedRegions("UA").map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label={labels.italy}>
                {sortedRegions("IT").map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <p className={styles.hint} id={`${ids.region}-hint`}>
              {labels.mapHint}
            </p>
          </div>
        </section>
      </div>

      <section className={styles.block} id="search-industry" aria-labelledby={`${ids.hint}-legend`}>
        <fieldset className={styles.fieldset} aria-describedby={ids.hint}>
          <legend className={styles.pill} id={`${ids.hint}-legend`}>
            {labels.byIndustry}
          </legend>
          <p className={styles.hint} id={ids.hint}>
            {labels.industryHint}
          </p>
          <ul className={styles.chips}>
            {industries.map((industry) => {
              const pressed = selectedIndustries.includes(industry.id);
              return (
                <li key={industry.id}>
                  <button
                    type="button"
                    className={styles.chip}
                    aria-pressed={pressed}
                    onClick={() => toggleIndustry(industry.id)}
                  >
                    {industry.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      </section>

      <section className={styles.block} id="search-name" aria-labelledby={`${ids.name}-label`}>
        <label className={styles.pill} htmlFor={ids.name} id={`${ids.name}-label`}>
          {labels.byName}
        </label>
        <div className={styles.search}>
          <input
            id={ids.name}
            type="search"
            value={query}
            onChange={(event) => setName(event.target.value)}
            placeholder={labels.namePlaceholder}
            autoComplete="off"
            spellCheck={false}
          />
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <path d="m20 20-3.8-3.8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </section>

      <section className={styles.results} aria-labelledby="results-title">
        <div className={styles.resultsHead}>
          <h2 className={styles.resultsTitle} id="results-title">
            {labels.resultsTitle}
          </h2>
          <p className={styles.count} role="status">
            {countText}
          </p>
          {hasFilters && results.length > 0 && (
            <button type="button" className={styles.reset} onClick={reset}>
              {labels.reset}
            </button>
          )}
        </div>

        {results.length > 0 ? (
          <MemberList members={results} locale={locale} labels={labels} newTabLabel={newTabLabel} />
        ) : (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>{labels.empty}</p>
            <p>{labels.emptyHint}</p>
            <button type="button" className={styles.reset} onClick={reset}>
              {labels.reset}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
