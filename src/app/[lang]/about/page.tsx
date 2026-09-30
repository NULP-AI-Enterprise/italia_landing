import type { Metadata } from "next";
import { Closing } from "@/components/about/Closing";
import { ExportSectors } from "@/components/about/ExportSectors";
import { History } from "@/components/about/History";
import { Intro } from "@/components/about/Intro";
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

  return (
    <>
      <PageHero title={page.hero.title} lead={page.hero.lead} logoAlt={dict.a11y.logoAlt} />
      <Intro intro={page.intro} />
      <ExportSectors sectors={page.sectors} locale={locale} heading={dict.about.sectorsHeading} />
      <History history={page.history} />
      <Closing title={page.closing.title} />
      <JoinButton href={localePath(locale, "/join")} label={dict.actions.join} />
    </>
  );
}
