import { StatusPage } from "@/components/ui/StatusPage";
import { localePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export default async function NotFound() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <StatusPage
      eyebrow={dict.notFound.eyebrow}
      title={dict.notFound.title}
      text={dict.notFound.text}
      backLabel={dict.notFound.back}
      backHref={localePath(locale)}
    />
  );
}
