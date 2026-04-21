import { createVowenaOgImage } from "@/lib/og-image";
import { decodePlanId, encodePlanId } from "@/lib/plan-id-codec";

export const runtime = "edge";
export const alt = "Vowena Checkout - Secure subscription checkout";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type ImageProps = {
  params: Promise<{ planId: string }>;
};

export default async function Image({ params }: ImageProps) {
  const { planId } = await params;
  const decoded = decodePlanId(planId);
  const displayId =
    Number.isFinite(decoded) && decoded > 0 ? encodePlanId(decoded) : planId;

  return createVowenaOgImage({
    eyebrow: "Secure checkout",
    title: "Subscribe with Vowena",
    description:
      "Authorize recurring USDC payments through a trustless Stellar checkout built for exact on-chain settlement.",
    path: `dashboard.vowena.xyz/p/${displayId}`,
    statLabel: "Checkout",
    statValue: "One signature",
  });
}
