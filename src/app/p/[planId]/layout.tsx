import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getCheckoutSeo } from "@/lib/plan-seo";
import { createPageMetadata, PUBLIC_INDEX_ROBOTS } from "@/lib/seo";

type CheckoutLayoutProps = {
  children: ReactNode;
};

type CheckoutMetadataProps = {
  params: Promise<{ planId: string }>;
};

export async function generateMetadata({
  params,
}: CheckoutMetadataProps): Promise<Metadata> {
  const { planId } = await params;
  const seo = await getCheckoutSeo(planId);
  const path = `/p/${encodeURIComponent(planId)}`;

  return createPageMetadata({
    title: seo.title,
    description: seo.description,
    path,
    imagePath: `${path}/opengraph-image`,
    robots: PUBLIC_INDEX_ROBOTS,
  });
}

export default function CheckoutLayout({ children }: CheckoutLayoutProps) {
  return children;
}
