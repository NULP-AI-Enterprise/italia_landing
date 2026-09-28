import Link from "next/link";
import styles from "./StatusPage.module.css";

type StatusPageProps = {
  eyebrow: string;
  title: string;
  text: string;
  backLabel: string;
  backHref: string;
};

/** Simple centered message: sections under construction and 404. */
export function StatusPage({ eyebrow, title, text, backLabel, backHref }: StatusPageProps) {
  return (
    <section className={styles.status}>
      <div className="container">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className={`section-title ${styles.title}`}>{title}</h1>
        <span className="rule" aria-hidden="true" />
        <p className={styles.text}>{text}</p>
        <Link className="btn" href={backHref}>
          {backLabel}
        </Link>
      </div>
    </section>
  );
}
