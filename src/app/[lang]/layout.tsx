import type { Metadata, Viewport } from "next";
import { Montserrat, Noto_Sans } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
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

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
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
        <SiteHeader locale={locale} siteName={dict.siteName} nav={dict.nav} a11y={dict.a11y} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter locale={locale} dict={dict} />
      </body>
    </html>
  );
}
