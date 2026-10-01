import type { Metadata } from "next";
import { Montserrat, Noto_Sans } from "next/font/google";
import "../globals.css";
import "./admin.css";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["700"],
  variable: "--font-montserrat",
});

const notoSans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-noto-sans",
});

export const metadata: Metadata = {
  title: { default: "Адмін-панель", template: "%s — адмін-панель MIUFI" },
  robots: { index: false, follow: false },
};

/** Separate root layout: the admin panel has its own shell and is Ukrainian only. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="uk" className={`${montserrat.variable} ${notoSans.variable}`}>
      <body className="admin">{children}</body>
    </html>
  );
}
