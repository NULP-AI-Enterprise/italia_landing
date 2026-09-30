import type { Metadata } from "next";
import { PartnerList } from "@/components/partners/PartnerList";
import { JoinButton } from "@/components/ui/JoinButton";
import { PageHero } from "@/components/ui/PageHero";
import { getPage, getPartners } from "@/content/repository";
import { pageMetadata } from "@/i18n/alternates";
import { localePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const page = await getPage("rebuild", locale);
  return pageMetadata(page.seo, locale, "/rebuild-ukraine-better");
}

export default async function RebuildUkraineBetterPage() {
  const locale = await getLocale();
  const [page, partners, dict] = await Promise.all([
    getPage("rebuild", locale),
    getPartners("rebuild", locale),
    getDictionary(),
  ]);

  return (
    <>
      <PageHero title={page.hero.title} lead={page.hero.lead} logoAlt={dict.a11y.logoAlt} />
      <PartnerList partners={partners} newTabLabel={dict.a11y.newTab} />
      <JoinButton href={localePath(locale, "/join")} label={dict.actions.join} />
    </>
  );
}
