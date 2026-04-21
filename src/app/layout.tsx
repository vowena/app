import type { Metadata } from "next";
import { DM_Sans, Space_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/wallet/wallet-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClientProvider } from "@/components/query-client-provider";
import {
  DASHBOARD_DESCRIPTION,
  DASHBOARD_METADATA_BASE,
  PUBLIC_INDEX_ROBOTS,
} from "@/lib/seo";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: DASHBOARD_METADATA_BASE,
  applicationName: "Vowena Dashboard",
  title: {
    default: "Vowena Dashboard - Recurring Payments on Stellar",
    template: "%s - Vowena Dashboard",
  },
  description: DASHBOARD_DESCRIPTION,
  keywords: [
    "Vowena",
    "Stellar",
    "recurring payments",
    "USDC subscriptions",
    "on-chain billing",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Vowena Dashboard",
    title: "Vowena Dashboard - Recurring Payments on Stellar",
    description: DASHBOARD_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Vowena Dashboard - Recurring payments on Stellar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vowena Dashboard - Recurring Payments on Stellar",
    description: DASHBOARD_DESCRIPTION,
    images: ["/twitter-image"],
  },
  robots: PUBLIC_INDEX_ROBOTS,
  category: "finance",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${spaceMono.variable} ${instrumentSerif.variable} h-full dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <ThemeProvider>
          <QueryClientProvider>
            <WalletProvider>{children}</WalletProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
