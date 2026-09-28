import type { Metadata } from "next";
import { AboutHero } from "@/components/about/AboutHero";
import { History } from "@/components/about/History";
import { Intro } from "@/components/about/Intro";
import { MarketEntry } from "@/components/about/MarketEntry";
import { localeAlternates } from "@/i18n/alternates";
import { localePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  return {
    title: dict.meta.aboutTitle,
    description: dict.meta.aboutDescription,
    alternates: localeAlternates(locale, "/about"),
  };
}

export default async function AboutPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <>
      <AboutHero hero={dict.about.hero} />
      <Intro intro={dict.about.intro} />
      <MarketEntry market={dict.about.market} ctaHref={localePath(locale, "/#services")} />
      <History history={dict.about.history} />
    </>
  );
}
