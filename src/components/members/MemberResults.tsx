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
  /** Badge for members of the Rebuild Ukraine Better programme. */
  rebuildLabel: string;
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

/** Companies as rows of a directory, grouped by first letter. */
export function MemberResults({
  members,
  locale,
  industryNames,
  regionNames,
  openLabel,
  rebuildLabel,
  onOpen,
}: MemberResultsProps) {
  return (
    <div className={styles.letters}>
      {groupByLetter(members, locale).map(({ letter, items }) => (
        <section className={styles.group} aria-labelledby={`letter-${letter}`} key={letter}>
          <h3 className={styles.letter} id={`letter-${letter}`}>
            {letter}
          </h3>
          <ul className={styles.list}>
            {items.map((member) => {
              const tags = [
                ...member.industries.map((id) => industryNames[id]),
                ...member.regions.map((code) => regionNames[code]),
              ].filter(Boolean);
              const content = (
                <>
                  <span className={styles.logo} aria-hidden="true">
                    {member.logo ? (
                      <ContentImage media={{ ...member.logo, alt: undefined }} sizes="56px" />
                    ) : (
                      member.name.charAt(0)
                    )}
                  </span>
                  <span className={styles.main}>
                    <span className={styles.name}>{member.name}</span>
                    {member.tagline && <span className={styles.tagline}>{member.tagline}</span>}
                    {(tags.length > 0 || member.rebuildProgram) && (
                      <span className={styles.tags}>
                        {member.rebuildProgram && <span className={styles.badge}>{rebuildLabel}</span>}
                        {tags.map((tag) => (
                          <span className={styles.tag} key={tag}>
                            {tag}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                  {onOpen && (
                    <span className={styles.chevron}>
                      <span className="visually-hidden">{openLabel}</span>
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </>
              );
              return (
                <li key={member.id}>
                  {onOpen ? (
                    <button
                      type="button"
                      className={styles.row}
                      aria-haspopup="dialog"
                      onClick={() => onOpen(member.id)}
                    >
                      {content}
                    </button>
                  ) : (
                    <div className={styles.row}>{content}</div>
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
