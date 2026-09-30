import Image from "next/image";
import emblem from "@/assets/images/emblem.png";
import styles from "./ImagePlaceholder.module.css";

/** Neutral frame shown where a photo will be added later (decorative, hidden from screen readers). */
export function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={`${styles.placeholder} ${className ?? ""}`} aria-hidden="true">
      <Image className={styles.mark} src={emblem} alt="" sizes="120px" />
    </div>
  );
}
