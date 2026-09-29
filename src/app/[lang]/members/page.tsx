import type { Metadata } from "next";
import { Suspense } from "react";
import { MemberDirectory } from "@/components/members/MemberDirectory";
import { MemberList } from "@/components/members/MemberList";
import { JoinButton } from "@/components/ui/JoinButton";
import { PageHero } from "@/components/ui/PageHero";
import { getMembersDirectory, getPage } from "@/content/repository";
import { pageMetadata } from "@/i18n/alternates";
import { localePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const page = await getPage("members", locale);
  return pageMetadata(page.seo, locale, "/members");
}

export default async function MembersPage() {
  const locale = await getLocale();
  const [page, directory, dict] = await Promise.all([
    getPage("members", locale),
    getMembersDirectory(locale),
    getDictionary(),
  ]);

  const directoryProps = { ...directory, locale, labels: dict.members, newTabLabel: dict.a11y.newTab };

  return (
    <>
      <PageHero title={page.hero.title} lead={page.hero.lead} logoAlt={dict.a11y.logoAlt} />
      {/* Filters read the URL on the client; the static HTML already lists every member */}
      <Suspense
        fallback={
          <div className="container">
            <h2 className="visually-hidden">{dict.members.resultsTitle}</h2>
            <MemberList
              members={directory.members}
              locale={locale}
              labels={dict.members}
              newTabLabel={dict.a11y.newTab}
            />
          </div>
        }
      >
        <MemberDirectory {...directoryProps} />
      </Suspense>
      <JoinButton href={localePath(locale, "/join")} label={dict.actions.join} />
    </>
  );
}
