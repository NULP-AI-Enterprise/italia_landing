import { ContentImage, type MediaItem } from "@/components/ui/ContentImage";
import { displayDomain } from "@/components/ui/ExternalLink";
import styles from "./LinkPreview.module.css";

type LinkPreviewProps = {
  title: string;
  /** Keep the page outline: h2 under the page title, h3 under a section heading. */
  heading: "h2" | "h3";
  description?: string;
  /** External site. With it, the whole card is a link that opens in a new tab. */
  href?: string;
  image?: MediaItem;
  imageLayout?: "cover" | "thumb";
  /** Screen-reader note, e.g. "opens in a new tab". */
  newTabLabel: string;
};

/**
 * Card in the style of a link preview from the design: thin frame, a photo on top
 * or a logo on the left, title, short text and the site's domain.
 * The title link is stretched over the card, so the accessible name stays short.
 */
export function LinkPreview({
  title,
  heading: Heading,
  description,
  href,
  image,
  imageLayout = "cover",
  newTabLabel,
}: LinkPreviewProps) {
  const thumb = image && imageLayout === "thumb";

  return (
    <div className={[styles.card, thumb && styles.thumb, href && styles.linked].filter(Boolean).join(" ")}>
      {image && (
        <div className={styles.media}>
          <ContentImage media={image} sizes={thumb ? "160px" : "(max-width: 767px) 100vw, 640px"} />
        </div>
      )}
      <div className={styles.body}>
        <Heading className={styles.title}>
          {href ? (
            <a className={styles.link} href={href} target="_blank" rel="noopener noreferrer">
              {title}
              <span className="visually-hidden"> ({newTabLabel})</span>
            </a>
          ) : (
            title
          )}
        </Heading>
        {description && <p className={styles.description}>{description}</p>}
        {href && (
          <p className={styles.source}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
            </svg>
            {displayDomain(href)}
          </p>
        )}
      </div>
    </div>
  );
}
