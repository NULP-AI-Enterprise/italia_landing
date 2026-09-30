import type { MembersDirectory } from "@/content/repository";
import { ContentImage } from "@/components/ui/ContentImage";
import styles from "./MemberResults.module.css";

export type MemberItem = MembersDirectory["members"][number];

type MemberResultsProps = {
  members: MemberItem[];
  locale: string;
  industryNames: Record<string, string>;
  regionNames: Record<string, string>;
  openLabel: string;
  /** Opens the profile card. Without it (no JavaScript yet) cards are static. */
  onOpen?: (id: string) => void;
};

/** Groups members by first letter, keeping the locale's alphabetical order. */
function groupByLetter(members: MemberItem[], locale: string) {
  const groups = new Map<string, MemberItem[]>();
  for (const member of members) {
    const first = member.name.trim().charAt(0).toLocaleUpperCase(locale);
    const letter = /\p{L}/u.test(first) ? first : "#";
    groups.set(letter, [...(groups.get(letter) ?? []), member]);
  }
  return [...groups.entries()].map(([letter, items]) => ({ letter, items }));
}

/** Search result cards, grouped by letter as in the design. */
export function MemberResults({ members, locale, industryNames, regionNames, openLabel, onOpen }: MemberResultsProps) {
  return (
    <div className={styles.letters}>
      {groupByLetter(members, locale).map(({ letter, items }) => (
        <section aria-labelledby={`letter-${letter}`} key={letter}>
          <h3 className={styles.letter} id={`letter-${letter}`}>
            {letter}
          </h3>
          <ul className={styles.grid}>
            {items.map((member) => {
              const meta = [
                ...member.industries.map((id) => industryNames[id]),
                ...member.regions.map((code) => regionNames[code]),
              ].filter(Boolean);
              const content = (
                <>
                  <span className={styles.logo} aria-hidden="true">
                    {member.logo ? (
                      <ContentImage media={{ ...member.logo, alt: undefined }} sizes="48px" />
                    ) : (
                      member.name.charAt(0)
                    )}
                  </span>
                  <span className={styles.text}>
                    <span className={styles.name}>{member.name}</span>
                    {member.tagline && <span className={styles.tagline}>{member.tagline}</span>}
                    {meta.length > 0 && <span className={styles.meta}>{meta.join(" · ")}</span>}
                  </span>
                  {onOpen && (
                    <span className={styles.more}>
                      {openLabel}
                      <span aria-hidden="true"> →</span>
                    </span>
                  )}
                </>
              );
              return (
                <li key={member.id}>
                  {onOpen ? (
                    <button
                      type="button"
                      className={styles.card}
                      aria-haspopup="dialog"
                      onClick={() => onOpen(member.id)}
                    >
                      {content}
                    </button>
                  ) : (
                    <div className={styles.card}>{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
