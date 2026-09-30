import { FormTrigger } from "@/components/forms/FormTrigger";
import styles from "./JoinButton.module.css";

/** Large "Join" call to action, centred, as in the design. Opens the join form. */
export function JoinButton({ href, label }: { href: string; label: string }) {
  return (
    <div className={styles.wrap}>
      <FormTrigger className={`btn ${styles.join}`} href={href} kind="join">
        {label}
      </FormTrigger>
    </div>
  );
}
