import type { Metadata } from "next";
import { TeamDirectory } from "@/components/team/TeamDirectory";
import { PageHero } from "@/components/ui/PageHero";
import { getPage, getTeam } from "@/content/repository";
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
  const [page, groups, dict] = await Promise.all([getPage("team", locale), getTeam(locale), getDictionary()]);

  return (
    <>
      <PageHero title={page.hero.title} lead={page.hero.lead} logoAlt={dict.a11y.logoAlt} />
      {/* No "Join" button here: every card already has "Contact" (THE-7) */}
      <TeamDirectory
        groups={groups}
        rows={page.rows}
        labels={dict.team.groups}
        contactLabel={dict.actions.contact}
        contactHref={localePath(locale, "/join")}
      />
    </>
  );
}
