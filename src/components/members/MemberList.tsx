import type { MembersDirectory } from "@/content/repository";
import { ContentImage } from "@/components/ui/ContentImage";
import { ExternalLink, displayDomain } from "@/components/ui/ExternalLink";
import type { Dictionary } from "@/i18n/get-dictionary";
import styles from "./MemberList.module.css";

export type MemberItem = MembersDirectory["members"][number];

type MemberListProps = {
  members: MemberItem[];
  locale: string;
  labels: Dictionary["members"];
  newTabLabel: string;
};

/** Groups members by first letter, keeping the locale's alphabetical order. */
export function groupByLetter(members: MemberItem[], locale: string) {
  const groups = new Map<string, MemberItem[]>();
  for (const member of members) {
    const first = member.name.trim().charAt(0).toLocaleUpperCase(locale);
    const letter = /\p{L}/u.test(first) ? first : "#";
    groups.set(letter, [...(groups.get(letter) ?? []), member]);
  }
  return [...groups.entries()].map(([letter, items]) => ({ letter, items }));
}

function hasDetails(member: MemberItem) {
  return Boolean(
    member.tagline ||
      member.description ||
      member.contact ||
      member.website ||
      member.expertise.length ||
      member.offers.length ||
      member.seeks.length,
  );
}

/** Alphabetical list of members; every entry expands into a company card. */
export function MemberList({ members, locale, labels, newTabLabel }: MemberListProps) {
  return (
    <div className={styles.letters}>
      {groupByLetter(members, locale).map(({ letter, items }) => (
        <section aria-labelledby={`letter-${letter}`} key={letter}>
          <h3 className={styles.letter} id={`letter-${letter}`}>
            {letter}
          </h3>
          <ul className={styles.list}>
            {items.map((member) => (
              <li key={member.id}>
                <details className={styles.member}>
                  <summary className={styles.summary}>
                    <span className={styles.name}>{member.name}</span>
                    {member.tagline && <span className={styles.tagline}>{member.tagline}</span>}
                  </summary>
                  <MemberCard member={member} labels={labels} newTabLabel={newTabLabel} />
                </details>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function MemberCard({
  member,
  labels,
  newTabLabel,
}: {
  member: MemberItem;
  labels: Dictionary["members"];
  newTabLabel: string;
}) {
  if (!hasDetails(member)) {
    return <p className={styles.noDetails}>{labels.noDetails}</p>;
  }

  const { contact } = member;

  return (
    <div className={styles.card}>
      <div className={styles.cardMain}>
        {contact?.photo && (
          <ContentImage className={styles.photo} media={contact.photo} sizes="120px" />
        )}
        <div className={styles.cardText}>
          <div className={styles.company}>
            {member.logo && <ContentImage className={styles.logo} media={member.logo} sizes="40px" />}
            <div>
              <p className={styles.companyName}>{member.name}</p>
              {member.tagline && <p className={styles.cardTagline}>{member.tagline}</p>}
            </div>
          </div>

          {member.description && <p className={styles.description}>{member.description}</p>}

          {contact && (
            <dl className={styles.facts}>
              <div>
                <dt>{labels.contactPerson}</dt>
                <dd>
                  {contact.name}
                  {contact.position && `, ${contact.position}`}
                </dd>
              </div>
              {member.expertise.length > 0 && (
                <div>
                  <dt>{labels.expertise}</dt>
                  <dd>{member.expertise.join(" · ")}</dd>
                </div>
              )}
              {contact.email && (
                <div>
                  <dt>{labels.email}</dt>
                  <dd>
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </dd>
                </div>
              )}
              {contact.phone && (
                <div>
                  <dt>{labels.phone}</dt>
                  <dd>
                    <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                  </dd>
                </div>
              )}
            </dl>
          )}

          {member.website && (
            <p className={styles.website}>
              <ExternalLink href={member.website} newTabLabel={newTabLabel}>
                {displayDomain(member.website)}
              </ExternalLink>
            </p>
          )}
        </div>
      </div>

      {(member.offers.length > 0 || member.seeks.length > 0) && (
        <div className={styles.needs}>
          {member.offers.length > 0 && (
            <div className={styles.needsBlock}>
              <h4>{labels.offers}</h4>
              <ul>
                {member.offers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {member.seeks.length > 0 && (
            <div className={styles.needsBlock}>
              <h4>{labels.seeks}</h4>
              <ul>
                {member.seeks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
