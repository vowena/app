import type { ReactNode } from "react";
import { createPageMetadata, PRIVATE_DASHBOARD_ROBOTS } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Project Dashboard",
  description:
    "Manage a Vowena project, plans, subscribers, billing analytics, keeper automation, and integration settings.",
  path: "/projects",
  imagePath: "/projects/opengraph-image",
  robots: PRIVATE_DASHBOARD_ROBOTS,
});

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return children;
}
