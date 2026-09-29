import type { ArticlePageContent } from "@/content/repository";
import { RichText } from "@/components/ui/RichText";
import styles from "./ArticleBody.module.css";

type ArticleBodyProps = {
  blocks: ArticlePageContent["blocks"];
  figuresLabel: string;
};

/** Renders structured article blocks from content (paragraphs, headings, lists, key figures). */
export function ArticleBody({ blocks, figuresLabel }: ArticleBodyProps) {
  return (
    <article className={`container ${styles.article}`}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return <h2 key={index}>{block.text}</h2>;
          case "paragraph":
            return (
              <p key={index}>
                <RichText text={block.text} />
              </p>
            );
          case "list":
            return (
              <ul key={index}>
                {block.items.map((item, i) => (
                  <li key={i}>
                    <RichText text={item} />
                  </li>
                ))}
              </ul>
            );
          case "figures":
            return (
              <section className={styles.figures} aria-label={figuresLabel} key={index}>
                <dl>
                  {block.items.map((item, i) => (
                    <div key={i}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
        }
      })}
    </article>
  );
}
