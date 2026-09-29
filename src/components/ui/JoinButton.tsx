import Link from "next/link";
import styles from "./JoinButton.module.css";

/** Large "Join" call to action, centred, as in the design. */
export function JoinButton({ href, label }: { href: string; label: string }) {
  return (
    <div className={styles.wrap}>
      <Link className={`btn ${styles.join}`} href={href}>
        {label}
      </Link>
    </div>
  );
}
