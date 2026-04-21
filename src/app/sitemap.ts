import type { MetadataRoute } from "next";
import { DASHBOARD_ORIGIN } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: DASHBOARD_ORIGIN,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.4,
    },
  ];
}
