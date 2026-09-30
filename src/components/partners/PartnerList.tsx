import type { PartnerItem } from "@/content/repository";
import { LinkPreview } from "@/components/ui/LinkPreview";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./PartnerList.module.css";

type PartnerListProps = {
  partners: PartnerItem[];
  newTabLabel: string;
};

/**
 * Link-preview cards in two staggered columns, as on the design pages.
 * Items alternate between the columns, so the editor's order reads left, right, left…
 * A card with a website opens it in a new tab.
 */
export function PartnerList({ partners, newTabLabel }: PartnerListProps) {
  const columns = [0, 1].map((column) => partners.filter((_, index) => index % 2 === column));

  return (
    <div className={`container ${styles.wrap}`}>
      <div className={styles.columns}>
        {columns.map(
          (items, column) =>
            items.length > 0 && (
              <ul className={styles.list} key={column}>
                {items.map((partner, index) => (
                  <Reveal as="li" index={index + column} key={partner.id}>
                    <LinkPreview
                      title={partner.name}
                      heading="h2"
                      description={partner.description}
                      href={partner.website}
                      image={partner.image}
                      imageLayout={partner.imageLayout}
                      newTabLabel={newTabLabel}
                    />
                  </Reveal>
                ))}
              </ul>
            ),
        )}
      </div>
    </div>
  );
}
