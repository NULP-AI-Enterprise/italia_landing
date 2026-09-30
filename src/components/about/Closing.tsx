import styles from "./Closing.module.css";

/** Closing statement above the "Join" button. */
export function Closing({ title }: { title: string }) {
  return (
    <section className={`container ${styles.closing}`} aria-labelledby="closing-title">
      <h2 className={`section-title ${styles.title}`} id="closing-title">
        {title}
      </h2>
    </section>
  );
}
