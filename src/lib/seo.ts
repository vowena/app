import type { Metadata } from "next";

const DEFAULT_DASHBOARD_ORIGIN = "https://dashboard.vowena.xyz";

export const DASHBOARD_ORIGIN = resolveDashboardOrigin();
export const DASHBOARD_METADATA_BASE = new URL(DASHBOARD_ORIGIN);

export const DASHBOARD_DESCRIPTION =
  "Manage Vowena subscriptions, projects, plans, and on-chain billing on Stellar.";

export const PUBLIC_INDEX_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

export const PRIVATE_DASHBOARD_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
};

export function createPageMetadata({
  title,
  description,
  path,
  imagePath,
  robots = PUBLIC_INDEX_ROBOTS,
}: {
  title: string;
  description: string;
  path: string;
  imagePath: string;
  robots?: Metadata["robots"];
}): Metadata {
  const canonical = normalizePath(path);
  const openGraphImage = normalizePath(imagePath);
  const twitterImage = openGraphImage.replace(
    /\/opengraph-image$/,
    "/twitter-image",
  );

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "Vowena Dashboard",
      title,
      description,
      images: [
        {
          url: openGraphImage,
          width: 1200,
          height: 630,
          alt: `${title} on Vowena`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [twitterImage],
    },
    robots,
  };
}

function resolveDashboardOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_DASHBOARD_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    DEFAULT_DASHBOARD_ORIGIN;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return DEFAULT_DASHBOARD_ORIGIN;
  }
}

function normalizePath(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}
