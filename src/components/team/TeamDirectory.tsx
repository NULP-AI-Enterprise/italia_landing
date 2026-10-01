import { FormTrigger } from "@/components/forms/FormTrigger";
import type { TeamGroupEntry, TeamGroupKey } from "@/content/repository";
import { ContentImage } from "@/components/ui/ContentImage";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/i18n/get-dictionary";
import styles from "./TeamDirectory.module.css";

type TeamDirectoryProps = {
  groups: TeamGroupEntry[];
  /** People per row for each group, e.g. { departments: [3, 2, 1] }. */
  rows?: Partial<Record<TeamGroupKey, number[]>>;
  labels: Dictionary["team"]["groups"];
  contactLabels: Dictionary["contacts"];
  contactLabel: string;
  /** Page with the contact form, used without JavaScript (already locale-prefixed). */
  contactHref: string;
};

type Person = TeamGroupEntry["people"][number];

/** Splits people into rows of the given sizes; the rest go in rows of three. */
function toRows(people: Person[], sizes: number[] = []) {
  const rows: Person[][] = [];
  let index = 0;
  for (const size of sizes) {
    if (index >= people.length) break;
    rows.push(people.slice(index, index + size));
    index += size;
  }
  while (index < people.length) {
    rows.push(people.slice(index, index + 3));
    index += 3;
  }
  return rows;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toLocaleUpperCase();

/** "+39 331 34 37 100" -> "tel:+393313437100" */
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export function TeamDirectory({ groups, rows, labels, contactLabels, contactLabel, contactHref }: TeamDirectoryProps) {
  return (
    <div className={`container ${styles.team}`}>
      {groups.map(({ group, people }) => (
        <section className={styles.group} aria-labelledby={`team-${group}`} key={group}>
          <h2 className={styles.groupTitle} id={`team-${group}`}>
            {labels[group]}
          </h2>
          {toRows(people, rows?.[group]).map((row, rowIndex) => (
            <ul className={styles.row} key={rowIndex}>
              {row.map((person, index) => (
                <Reveal as="li" className={styles.person} index={index} key={person.id}>
                  {person.photo ? (
                    <ContentImage className={styles.photo} media={person.photo} sizes="(max-width: 767px) 60vw, 240px" />
                  ) : (
                    // Placeholder until the photo is uploaded in the admin panel
                    <span className={styles.placeholder} aria-hidden="true">
                      {initials(person.name)}
                    </span>
                  )}
                  <h3 className={styles.name}>{person.name}</h3>
                  <p className={styles.role}>{person.role}</p>
                  {person.quote && (
                    <blockquote className={styles.quote}>
                      <p>«{person.quote}»</p>
                    </blockquote>
                  )}
                  {(person.phones.length > 0 || person.email || person.telegram) && (
                    <ul className={styles.contacts}>
                      {person.phones.map((phone) => (
                        <li key={phone}>
                          <a href={telHref(phone)}>
                            <span className="visually-hidden">{contactLabels.phone}: </span>
                            {phone}
                          </a>
                        </li>
                      ))}
                      {person.email && (
                        <li>
                          <a href={`mailto:${person.email}`}>
                            <span className="visually-hidden">{contactLabels.email}: </span>
                            {person.email}
                          </a>
                        </li>
                      )}
                      {person.telegram && (
                        <li>
                          <a href={`https://t.me/${person.telegram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer">
                            TG: @{person.telegram.replace(/^@/, "")}
                            <span className="visually-hidden"> ({contactLabels.telegram})</span>
                          </a>
                        </li>
                      )}
                    </ul>
                  )}
                  {person.contactButton && (
                    <FormTrigger
                      className={styles.contact}
                      href={`${contactHref}?to=${person.id}`}
                      kind="contact"
                      recipientId={person.id}
                      recipientName={person.name}
                    >
                      {contactLabel}
                      <span className="visually-hidden">: {person.name}</span>
                    </FormTrigger>
                  )}
                </Reveal>
              ))}
            </ul>
          ))}
        </section>
      ))}
    </div>
  );
}
