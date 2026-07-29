import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteDescription = "Compare time zones and find fair meeting times. Drag to select, get best-overlap suggestions, share links or QR codes, and export to calendar.";

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`) } : {}),
  title: {
    default: "TimeGrid",
    template: "%s · TimeGrid"
  },
  description: siteDescription,
  applicationName: "TimeGrid",
  authors: [{ name: "Thomas Brown", url: "https://github.com/tbjr" }, { name: "Evolvtech, LLC", url: "https://evolvtech.org/" }],
  creator: "Evolvtech, LLC",
  keywords: ["timezone", "meeting planner", "world clock", "scheduling", "remote work", "calendar"],
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    type: "website",
    title: "TimeGrid",
    description: siteDescription,
    siteName: "TimeGrid",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TimeGrid — plan across time zones" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "TimeGrid",
    description: siteDescription,
    images: ["/og.png"]
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0F766E" },
    { media: "(prefers-color-scheme: dark)", color: "#14B8A6" }
  ]
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
