import { localePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { StatusPage } from "./StatusPage";

/** Placeholder for sections planned for the next iterations. */
export async function ComingSoon({ title }: { title: string }) {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <StatusPage
      eyebrow={dict.comingSoon.eyebrow}
      title={title}
      text={dict.comingSoon.text}
      backLabel={dict.comingSoon.back}
      backHref={localePath(locale)}
    />
  );
}
