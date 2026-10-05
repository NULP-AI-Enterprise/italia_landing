import { ContentImage } from "@/components/ui/ContentImage";
import { ExternalLink, displayDomain } from "@/components/ui/ExternalLink";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { MemberItem } from "./MemberResults";
import styles from "./MemberProfile.module.css";

type MemberProfileProps = {
  member: MemberItem;
  labels: Dictionary["members"];
  newTabLabel: string;
  titleId: string;
};

/** Company profile card, as in the design: contact card, "We offer", "We are looking for". */
export function MemberProfile({ member, labels, newTabLabel, titleId }: MemberProfileProps) {
  const { contact } = member;

  return (
    <article className={styles.profile} aria-labelledby={titleId}>
      <div className={styles.card}>
        <div className={styles.photo}>
          {contact?.photo ? (
            <ContentImage media={contact.photo} sizes="160px" />
          ) : (
            <span className={styles.photoPlaceholder} aria-hidden="true">
              {member.name.charAt(0)}
            </span>
          )}
        </div>

        <div className={styles.info}>
          <div className={styles.company}>
            {member.logo && <ContentImage className={styles.logo} media={member.logo} sizes="40px" />}
            <div>
              <h2 className={styles.name} id={titleId}>
                {member.name}
              </h2>
              {member.tagline && <p className={styles.tagline}>{member.tagline}</p>}
            </div>
          </div>
          {member.rebuildProgram && <p className={styles.programBadge}>{labels.rebuildBadge}</p>}

          {contact ? (
            <dl className={styles.facts}>
              <div>
                <dt className="visually-hidden">{labels.contactPerson}</dt>
                <dd>
                  <span className={styles.person}>{contact.name}</span>
                  {contact.position && <span className={styles.position}>{contact.position}</span>}
                </dd>
              </div>
              {member.expertise.length > 0 && (
                <div>
                  <dt className="visually-hidden">{labels.expertise}</dt>
                  <dd>{member.expertise.join(" | ")}</dd>
                </div>
              )}
              {contact.email && (
                <div>
                  <dt className="visually-hidden">{labels.email}</dt>
                  <dd>
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </dd>
                </div>
              )}
              {contact.phone && (
                <div>
                  <dt className="visually-hidden">{labels.phone}</dt>
                  <dd>
                    <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                  </dd>
                </div>
              )}
              {member.website && (
                <div>
                  <dt className="visually-hidden">{labels.website}</dt>
                  <dd>
                    <ExternalLink href={member.website} newTabLabel={newTabLabel}>
                      {displayDomain(member.website)}
                    </ExternalLink>
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className={styles.pending}>{member.description ?? labels.pending}</p>
          )}
        </div>
      </div>

      {[
        { title: labels.offers, items: member.offers },
        { title: labels.seeks, items: member.seeks },
      ].map((panel) => (
        <section className={styles.panel} key={panel.title} aria-label={panel.title}>
          <h3 className={styles.panelTitle}>{panel.title}</h3>
          {panel.items.length > 0 ? (
            <ul>
              {panel.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.pending}>{labels.pending}</p>
          )}
        </section>
      ))}
    </article>
  );
}
