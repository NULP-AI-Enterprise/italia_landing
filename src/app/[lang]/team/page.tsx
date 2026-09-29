import type { Metadata } from "next";
import { TeamDirectory } from "@/components/team/TeamDirectory";
import { JoinButton } from "@/components/ui/JoinButton";
import { PageHero } from "@/components/ui/PageHero";
import { getPage, getSettings, getTeam } from "@/content/repository";
import { pageMetadata } from "@/i18n/alternates";
import { localePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const page = await getPage("team", locale);
  return pageMetadata(page.seo, locale, "/team");
}

export default async function TeamPage() {
  const locale = await getLocale();
  const [page, groups, settings, dict] = await Promise.all([
    getPage("team", locale),
    getTeam(locale),
    getSettings(),
    getDictionary(),
  ]);

  return (
    <>
      <PageHero title={page.hero.title} lead={page.hero.lead} logoAlt={dict.a11y.logoAlt} />
      <TeamDirectory
        groups={groups}
        labels={dict.team.groups}
        contactLabel={dict.actions.contact}
        fallbackContactHref={localePath(locale, settings.contactHref)}
      />
      <JoinButton href={localePath(locale, "/join")} label={dict.actions.join} />
    </>
  );
}
