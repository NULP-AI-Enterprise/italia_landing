import type { Metadata, Viewport } from "next";
import { Montserrat, Noto_Sans } from "next/font/google";
import { FormDialogProvider } from "@/components/forms/FormDialog";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { buildNavigation } from "@/config/navigation";
import { siteUrl } from "@/config/site-url";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { turnstileSiteKey } from "@/server/forms/turnstile";
import "../globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800"],
  variable: "--font-montserrat",
});

const notoSans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-noto-sans",
});

/*
 * Content is edited in the admin panel, so pages are not built ahead of time:
 * each page is rendered on its first visit from the current content and cached.
 * A save in the admin panel rebuilds them (revalidatePath); the hourly
 * revalidation is only a safety net. Unknown locales end in notFound().
 */
export function generateStaticParams() {
  return [];
}

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    // Read at request time (SITE_URL), so the deployment sets it without a rebuild.
    metadataBase: siteUrl(),
    title: {
      default: dict.siteName,
      template: `%s — ${dict.siteName}`,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#00004a",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const dict = await getDictionary();
  const navigation = buildNavigation(locale, dict.nav);
  const brandName = "Made in Ukraine for Italy";

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${montserrat.variable} ${notoSans.variable}`}
    >
      <body>
        <a className="skip-link" href="#main">
          {dict.a11y.skipToContent}
        </a>
        <FormDialogProvider locale={locale} labels={dict.form} turnstileSiteKey={turnstileSiteKey()}>
        <SiteHeader
          locale={locale}
          brandName={brandName}
          navigation={navigation}
          joinLabel={dict.actions.join}
          a11y={dict.a11y}
        />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter navigation={navigation} brandName={brandName} dict={dict} />
        </FormDialogProvider>
      </body>
    </html>
  );
}
