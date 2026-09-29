import Link from "next/link";
import type { TeamGroupEntry } from "@/content/repository";
import { ContentImage } from "@/components/ui/ContentImage";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/i18n/get-dictionary";
import styles from "./TeamDirectory.module.css";

type TeamDirectoryProps = {
  groups: TeamGroupEntry[];
  labels: Dictionary["team"]["groups"];
  contactLabel: string;
  /** Used when a person has no e-mail yet (already locale-prefixed). */
  fallbackContactHref: string;
};

export function TeamDirectory({ groups, labels, contactLabel, fallbackContactHref }: TeamDirectoryProps) {
  return (
    <div className={`container ${styles.team}`}>
      {groups.map(({ group, people }) => (
        <section className={styles.group} data-group={group} aria-labelledby={`team-${group}`} key={group}>
          <h2 className="visually-hidden" id={`team-${group}`}>
            {labels[group]}
          </h2>
          <ul className={styles.list}>
            {people.map((person, index) => {
              const href = person.email ? `mailto:${person.email}` : fallbackContactHref;
              return (
                <Reveal as="li" className={styles.person} index={index % 3} key={person.id}>
                  {person.photo && (
                    <ContentImage className={styles.photo} media={person.photo} sizes="160px" />
                  )}
                  <h3 className={styles.name}>{person.name}</h3>
                  <p className={styles.role}>{person.role}</p>
                  {person.quote && (
                    <blockquote className={styles.quote}>
                      <p>«{person.quote}»</p>
                    </blockquote>
                  )}
                  <Link className={styles.contact} href={href}>
                    {contactLabel}
                    <span className="visually-hidden">: {person.name}</span>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
