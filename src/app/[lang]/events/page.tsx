import type { Metadata } from "next";
import { Suspense } from "react";
import { EventCalendar, EventCalendarView } from "@/components/events/EventCalendar";
import type { EventView } from "@/components/events/EventList";
import { JoinButton } from "@/components/ui/JoinButton";
import { PageHero } from "@/components/ui/PageHero";
import { getEvents, getPage } from "@/content/repository";
import { pageMetadata } from "@/i18n/alternates";
import { localePath, type Locale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const page = await getPage("events", locale);
  return pageMetadata(page.seo, locale, "/events");
}

/** "1–6 October" in the page language; dates are plain calendar days (UTC). */
function formatRange(start: string, end: string, locale: Locale) {
  const format = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" });
  return format.formatRange(new Date(`${start}T00:00:00Z`), new Date(`${end}T00:00:00Z`));
}

export default async function EventsPage() {
  const locale = await getLocale();
  const [page, events, dict] = await Promise.all([getPage("events", locale), getEvents(locale), getDictionary()]);

  // Dates are written out once on the server, so both renders show the same text.
  const items: EventView[] = events.map((event) => ({
    ...event,
    dateLabel: formatRange(event.startDate, event.endDate, locale),
  }));
  const calendarProps = { events: items, locale, labels: dict.events, newTabLabel: dict.a11y.newTab };

  return (
    <>
      <PageHero title={page.hero.title} lead={page.hero.lead} logoAlt={dict.a11y.logoAlt} />
      {/* Filters read the URL on the client; the static HTML already lists every event */}
      <Suspense fallback={<EventCalendarView {...calendarProps} from="" to="" sort="asc" disabled />}>
        <EventCalendar {...calendarProps} />
      </Suspense>
      <JoinButton href={localePath(locale, "/join")} label={dict.actions.join} />
    </>
  );
}
