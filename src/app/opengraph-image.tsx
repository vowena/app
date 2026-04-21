import { createVowenaOgImage } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Vowena Dashboard - Recurring payments on Stellar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return createVowenaOgImage({
    eyebrow: "Dashboard",
    title: "Recurring payments on Stellar",
    description:
      "Manage Vowena subscriptions, projects, plans, and on-chain billing from one protocol-grade dashboard.",
    path: "dashboard.vowena.xyz",
  });
}
