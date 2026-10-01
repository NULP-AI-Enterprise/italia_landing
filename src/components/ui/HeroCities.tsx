import styles from "./HeroCities.module.css";

/** The row of cities under the page title (home and association pages). */
export function HeroCities({ cities }: { cities: string[] }) {
  if (cities.length === 0) return null;
  return (
    <ul className={styles.cities}>
      {cities.map((city) => (
        <li key={city}>{city}</li>
      ))}
    </ul>
  );
}
