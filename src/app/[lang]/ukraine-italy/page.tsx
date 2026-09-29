import type { Metadata } from "next";
import { ArticleBody } from "@/components/article/ArticleBody";
import { JoinButton } from "@/components/ui/JoinButton";
import { PageHero } from "@/components/ui/PageHero";
import { getPage } from "@/content/repository";
import { pageMetadata } from "@/i18n/alternates";
import { localePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const page = await getPage("ukraineItaly", locale);
  return pageMetadata(page.seo, locale, "/ukraine-italy");
}

export default async function UkraineItalyPage() {
  const locale = await getLocale();
  const [page, dict] = await Promise.all([getPage("ukraineItaly", locale), getDictionary()]);

  return (
    <>
      <PageHero title={page.hero.title} lead={page.hero.lead} logoAlt={dict.a11y.logoAlt} />
      <ArticleBody blocks={page.blocks} figuresLabel={dict.article.keyFigures} />
      <JoinButton href={localePath(locale, "/join")} label={dict.actions.join} />
    </>
  );
}
