import type { Metadata } from "next";
import { ServiceCards } from "@/components/home/ServiceCards";
import { ServiceDetails } from "@/components/home/ServiceDetails";
import { HeroCities } from "@/components/ui/HeroCities";
import { JoinButton } from "@/components/ui/JoinButton";
import { PageHero } from "@/components/ui/PageHero";
import { getPage, getServices } from "@/content/repository";
import { localeAlternates } from "@/i18n/alternates";
import { localePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const [page, dict] = await Promise.all([getPage("home", locale), getDictionary()]);
  return {
    title: { absolute: `${page.seo.title} — ${dict.siteName}` },
    description: page.seo.description,
    alternates: localeAlternates(locale),
  };
}

export default async function HomePage() {
  const locale = await getLocale();
  const [page, services, dict] = await Promise.all([
    getPage("home", locale),
    getServices(locale),
    getDictionary(),
  ]);

  return (
    <>
      <PageHero title={page.hero.title} logoAlt={dict.a11y.logoAlt}>
        <HeroCities cities={page.hero.cities} />
      </PageHero>
      <ServiceCards heading={page.servicesHeading} services={services} />
      <JoinButton href={localePath(locale, "/join")} label={dict.actions.join} />
      <ServiceDetails locale={locale} heading={page.detailsHeading} services={services} />
    </>
  );
}
