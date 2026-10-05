import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site-url";

// SITE_URL is read per request (the Kubernetes image is built without it).
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // Vercel previews are copies of the site: keep them out of search results.
  if (process.env.VERCEL_ENV === "preview") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}
