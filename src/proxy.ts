import { NextResponse, type NextRequest } from "next/server";
import { legacyRedirect } from "@/config/legacy-urls";
import { canonicalHostFor } from "@/config/site-url";
import {
  defaultLocale,
  hasLocale,
  localeCookie,
  looksLikeLocale,
  resolveLocale,
  type Locale,
} from "@/i18n/config";

/** Picks a locale: saved choice first, then Accept-Language, then the default. */
function pickLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(localeCookie)?.value;
  if (saved && hasLocale(saved)) return saved;

  const header = request.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag, q: q ? Number(q.split("=")[1]) : 1 };
    })
    .filter((entry) => entry.tag && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const locale = resolveLocale(tag);
    if (locale) return locale;
  }
  return defaultLocale;
}

function redirectTo(request: NextRequest, pathname: string, permanent: boolean) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url, permanent ? 308 : 307);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // One public copy of the site: *.vercel.app and other domains go to SITE_URL.
  const canonicalHost = canonicalHostFor(request.headers.get("host") ?? request.nextUrl.host);
  if (canonicalHost) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = canonicalHost;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  // Addresses of the previous WordPress site that search engines still list.
  const legacy = legacyRedirect(pathname);
  if (legacy) return redirectTo(request, legacy, true);
  const [, first = "", ...rest] = pathname.split("/");
  const tail = rest.length ? `/${rest.join("/")}` : "";

  // Canonical locale in the URL: serve it and remember it for the next visit to "/".
  if (hasLocale(first)) {
    // Repair double prefixes produced by the old redirect ("/uk/ua/about" -> "/uk/about").
    // Safe because no page slug is a two-letter code.
    const [second = "", ...remaining] = rest;
    if (looksLikeLocale(second)) {
      const target = resolveLocale(second) ?? first;
      return redirectTo(request, `/${target}${remaining.length ? `/${remaining.join("/")}` : ""}`, true);
    }
    const response = NextResponse.next();
    if (request.cookies.get(localeCookie)?.value !== first) {
      response.cookies.set(localeCookie, first, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return response;
  }

  // The first segment is a language code in another spelling ("/ua", "/UK", "/it-IT")
  // or an unsupported one ("/en"): replace it instead of prefixing, so "/ua/about"
  // becomes "/uk/about" and never "/uk/ua/about".
  if (looksLikeLocale(first)) {
    const alias = resolveLocale(first);
    return redirectTo(request, `/${alias ?? pickLocale(request)}${tail}`, alias !== null);
  }

  // No locale at all ("/", "/about"): prefix the visitor's locale.
  return redirectTo(request, `/${pickLocale(request)}${pathname === "/" ? "" : pathname}`, false);
}

export const config = {
  // Skip Next internals, API routes, the admin panel and any file with an extension.
  matcher: ["/((?!_next|api|admin|.*\\..*).*)"],
};
