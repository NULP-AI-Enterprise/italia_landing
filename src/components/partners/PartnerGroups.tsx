import type { PartnerGroupEntry } from "@/content/repository";
import { ContentImage } from "@/components/ui/ContentImage";
import { ExternalLink, displayDomain } from "@/components/ui/ExternalLink";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./PartnerGroups.module.css";

type PartnerGroupsProps = {
  groups: PartnerGroupEntry[];
  sections: Record<PartnerGroupEntry["category"], { title: string; intro?: string }>;
  newTabLabel: string;
};

export function PartnerGroups({ groups, sections, newTabLabel }: PartnerGroupsProps) {
  return (
    <div className={`container ${styles.groups}`}>
      {groups
        .filter((group) => group.partners.length > 0)
        .map(({ category, partners }) => (
          <section className={styles.group} aria-labelledby={`partners-${category}`} key={category}>
            <h2 className={`section-title ${styles.title}`} id={`partners-${category}`}>
              {sections[category].title}
            </h2>
            {sections[category].intro && <p className={styles.intro}>{sections[category].intro}</p>}
            <ul className={styles.grid}>
              {partners.map((partner, index) => (
                <Reveal as="li" className={styles.card} index={index % 2} key={partner.id}>
                  {partner.logo && (
                    <ContentImage className={styles.logo} media={partner.logo} sizes="96px" />
                  )}
                  <div className={styles.body}>
                    <h3 className={styles.name}>{partner.name}</h3>
                    {partner.description && <p className={styles.description}>{partner.description}</p>}
                    {partner.website && (
                      <p className={styles.site}>
                        <ExternalLink href={partner.website} newTabLabel={newTabLabel}>
                          {displayDomain(partner.website)}
                        </ExternalLink>
                      </p>
                    )}
                  </div>
                </Reveal>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
