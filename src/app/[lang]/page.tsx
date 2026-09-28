import type { Metadata } from "next";
import { HomeHero } from "@/components/home/HomeHero";
import { JoinBanner } from "@/components/home/JoinBanner";
import { Services } from "@/components/home/Services";
import { localeAlternates } from "@/i18n/alternates";
import { localePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  return {
    title: { absolute: `${dict.meta.homeTitle} — ${dict.meta.siteName}` },
    description: dict.meta.homeDescription,
    alternates: localeAlternates(locale),
  };
}

export default async function HomePage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <>
      <HomeHero hero={dict.home.hero} logoAlt={dict.a11y.logoAlt} />
      <Services services={dict.home.services} />
      <JoinBanner join={dict.home.join} href={localePath(locale, "/join")} />
    </>
  );
}
