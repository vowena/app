import type { ReactNode } from "react";
import { createPageMetadata, PRIVATE_DASHBOARD_ROBOTS } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Subscriptions",
  description:
    "Review every Vowena subscription, billing period, and exact Stellar transaction hash from your subscriber dashboard.",
  path: "/subscriptions",
  imagePath: "/subscriptions/opengraph-image",
  robots: PRIVATE_DASHBOARD_ROBOTS,
});

export default function SubscriptionsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
