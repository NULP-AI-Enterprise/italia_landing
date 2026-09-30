"use client";

import { italyMap, ukraineMap } from "./map-data";
import styles from "./RegionMap.module.css";

type RegionMapProps = {
  country: "UA" | "IT";
  selected: string;
  /** Members per region under the other filters; regions with members are drawn darker. */
  counts: Record<string, number>;
  onSelect: (code: string) => void;
  onHover: (code: string | null) => void;
};

/**
 * Clickable map of one country (mouse and touch). Hidden from assistive
 * technology: the region <select> next to it offers the same choice.
 */
export function RegionMap({ country, selected, counts, onSelect, onHover }: RegionMapProps) {
  const map = country === "UA" ? ukraineMap : italyMap;
  // The selected region is painted last, so its outline is not covered by its neighbours.
  const regions = [...map.regions].sort((a, b) => Number(a.code === selected) - Number(b.code === selected));
  return (
    <svg
      className={`${styles.map} ${country === "IT" ? styles.it : ""}`}
      viewBox={map.viewBox}
      aria-hidden="true"
      focusable="false"
      onPointerLeave={() => onHover(null)}
    >
      {regions.map((region) => (
        <path
          key={region.code}
          d={region.d}
          className={
            region.code === selected ? styles.selected : counts[region.code] ? styles.has : undefined
          }
          onPointerEnter={() => onHover(region.code)}
          onClick={() => onSelect(region.code === selected ? "" : region.code)}
        />
      ))}
    </svg>
  );
}
