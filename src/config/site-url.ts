/**
 * Public address of the site: canonical and hreflang links, sitemap.xml, robots.txt,
 * and the host every other address redirects to (src/proxy.ts).
 * SITE_URL wins; on Vercel without it, the project's production domain.
 * Read at request time, so a deployment sets it without a rebuild.
 */
export function siteUrl(): URL {
  if (process.env.SITE_URL) return new URL(process.env.SITE_URL);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  return new URL("http://localhost:3000");
}

/**
 * Host that should answer instead of this one, if any: production requests to a
 * *.vercel.app address or another domain go to SITE_URL, so search engines see
 * one copy of the site. Never in previews, development or on localhost.
 */
export function canonicalHostFor(host: string): string | null {
  if (!process.env.SITE_URL || process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview") return null;
  const canonical = new URL(process.env.SITE_URL).host;
  const name = host.split(":")[0];
  if (host === canonical || name === "localhost" || name === "127.0.0.1" || name === "[::1]") return null;
  return canonical;
}
