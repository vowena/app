import { createVowenaOgImage } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Vowena Projects - Manage recurring payment products";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return createVowenaOgImage({
    eyebrow: "Projects",
    title: "Manage recurring payment products",
    description:
      "Create projects, publish checkout links, monitor subscribers, and run Vowena billing on Stellar.",
    path: "dashboard.vowena.xyz/projects",
    statLabel: "Products",
    statValue: "Plans",
  });
}
