import { createVowenaOgImage } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Vowena Subscriptions - Exact on-chain billing history";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return createVowenaOgImage({
    eyebrow: "Subscriptions",
    title: "Exact on-chain billing history",
    description:
      "Review active subscriptions, renewal timing, paid periods, and linked Stellar transaction hashes.",
    path: "dashboard.vowena.xyz/subscriptions",
    statLabel: "History",
    statValue: "Linked txs",
  });
}
