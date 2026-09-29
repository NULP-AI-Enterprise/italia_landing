"use client";

import { italyMap, ukraineMap, type CountryMap } from "./map-data";
import styles from "./RegionMaps.module.css";

type RegionMapsProps = {
  selected: string;
  regionNames: Record<string, string>;
  onSelect: (code: string) => void;
};

/**
 * Clickable maps for mouse and touch users. They are hidden from assistive
 * technology because the region <select> next to them offers the same choice.
 */
export function RegionMaps({ selected, regionNames, onSelect }: RegionMapsProps) {
  return (
    <div className={styles.maps} aria-hidden="true">
      <CountryShape map={ukraineMap} country="ua" selected={selected} names={regionNames} onSelect={onSelect} />
      <CountryShape map={italyMap} country="it" selected={selected} names={regionNames} onSelect={onSelect} />
    </div>
  );
}

function CountryShape({
  map,
  country,
  selected,
  names,
  onSelect,
}: {
  map: CountryMap;
  country: "ua" | "it";
  selected: string;
  names: Record<string, string>;
  onSelect: (code: string) => void;
}) {
  return (
    <svg className={`${styles.map} ${styles[country]}`} viewBox={map.viewBox} focusable="false">
      {map.regions.map((region) => (
        <path
          key={region.code}
          d={region.d}
          className={region.code === selected ? styles.selected : undefined}
          onClick={() => onSelect(region.code === selected ? "" : region.code)}
        >
          <title>{names[region.code]}</title>
        </path>
      ))}
    </svg>
  );
}
