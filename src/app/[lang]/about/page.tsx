import type { Metadata } from "next";
import { AboutStory } from "@/components/about/AboutStory";
import { HeroCities } from "@/components/ui/HeroCities";
import { JoinButton } from "@/components/ui/JoinButton";
import { PageHero } from "@/components/ui/PageHero";
import { getPage } from "@/content/repository";
import { pageMetadata } from "@/i18n/alternates";
import { localePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const page = await getPage("about", locale);
  return pageMetadata(page.seo, locale, "/about");
}

export default async function AboutPage() {
  const locale = await getLocale();
  const [page, dict] = await Promise.all([getPage("about", locale), getDictionary()]);
  const { hero } = page;

  return (
    <>
      <PageHero title={hero.title} lead={hero.lead} logoAlt={dict.a11y.logoAlt}>
        <HeroCities cities={hero.cities} />
      </PageHero>
      <AboutStory
        statement={page.statement}
        lead={page.lead}
        paragraphs={page.paragraphs}
        image={page.image}
        story={page.story}
      />
      {/* Kept although the design ends without it (THE-6: keep the join call to action) */}
      <JoinButton href={localePath(locale, "/join")} label={dict.actions.join} />
    </>
  );
}
