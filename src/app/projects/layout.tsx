import type { ReactNode } from "react";
import { createPageMetadata, PRIVATE_DASHBOARD_ROBOTS } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Projects",
  description:
    "Create Vowena projects, manage subscription plans, track subscribers, and reconcile billing on Stellar.",
  path: "/projects",
  imagePath: "/projects/opengraph-image",
  robots: PRIVATE_DASHBOARD_ROBOTS,
});

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return children;
}
