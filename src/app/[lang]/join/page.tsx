import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHero } from "@/components/ui/PageHero";
import { getTeamMember } from "@/content/repository";
import { pageMetadata } from "@/i18n/alternates";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { turnstileSiteKey } from "@/server/forms/turnstile";
import styles from "./join.module.css";

// Reads ?to= for every request, so it is never cached like the other pages.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  return pageMetadata({ title: dict.form.joinTitle, description: dict.form.requiredNote }, locale, "/join");
}

/**
 * The join / contact form as a page: used without JavaScript and when a
 * "Join" or "Contact" link is opened in a new tab (?to=<team member id>).
 */
export default async function JoinPage({ searchParams }: PageProps<"/[lang]/join">) {
  const [locale, dict, params] = await Promise.all([getLocale(), getDictionary(), searchParams]);
  const to = typeof params.to === "string" ? params.to : undefined;
  const recipient = to ? await getTeamMember(to, locale) : null;

  return (
    <>
      <PageHero
        title={recipient ? dict.form.contactTitle : dict.form.joinTitle}
        lead={recipient ? dict.form.contactWith.replace("{name}", recipient.name) : undefined}
        logoAlt={dict.a11y.logoAlt}
      />
      <div className={`container ${styles.wrap}`}>
        <ContactForm
          kind={recipient ? "contact" : "join"}
          recipientId={recipient?.id}
          locale={locale}
          labels={dict.form}
          turnstileSiteKey={turnstileSiteKey()}
        />
      </div>
    </>
  );
}
