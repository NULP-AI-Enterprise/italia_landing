import type { Metadata } from "next";
import { EventList } from "@/components/events/EventList";
import { JoinButton } from "@/components/ui/JoinButton";
import { PageHero } from "@/components/ui/PageHero";
import { getEvents, getPage } from "@/content/repository";
import { pageMetadata } from "@/i18n/alternates";
import { localePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const page = await getPage("events", locale);
  return pageMetadata(page.seo, locale, "/events");
}

export default async function EventsPage() {
  const locale = await getLocale();
  const [page, years, dict] = await Promise.all([
    getPage("events", locale),
    getEvents(locale),
    getDictionary(),
  ]);

  return (
    <>
      <PageHero title={page.hero.title} lead={page.hero.lead} logoAlt={dict.a11y.logoAlt} />
      <EventList years={years} locale={locale} newTabLabel={dict.a11y.newTab} />
      <JoinButton href={localePath(locale, "/join")} label={dict.actions.join} />
    </>
  );
}
