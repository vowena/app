import type { MetadataRoute } from "next";
import { DASHBOARD_ORIGIN } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/p/"],
        disallow: ["/api/", "/projects", "/subscriptions"],
      },
    ],
    sitemap: `${DASHBOARD_ORIGIN}/sitemap.xml`,
    host: DASHBOARD_ORIGIN,
  };
}
