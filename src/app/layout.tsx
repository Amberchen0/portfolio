import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://amberxu.vercel.app";
const SITE_DESC =
  "Portfolio of Amber Xu — visual design, motion, illustration, and crafted interaction. Based in Sydney.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Inheriting pages set their own `title` string; layout supplies the
  // template so individual titles become "<page> — Amber Xu" without
  // each page repeating the suffix. `default` covers any page that
  // forgets to set a title (won't happen, but a safety net).
  title: {
    default: "Amber Xu — Visual Artist · Content Creator · Concept Designer",
    template: "%s — Amber Xu",
  },
  description: SITE_DESC,
  keywords: [
    "Amber Xu",
    "portfolio",
    "visual design",
    "motion design",
    "illustration",
    "concept design",
    "Sydney designer",
  ],
  authors: [{ name: "Amber Xu", url: SITE_URL }],
  creator: "Amber Xu",
  // Open Graph — the preview card people see when the URL is pasted
  // into WeChat / Twitter / LinkedIn / iMessage.
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: SITE_URL,
    siteName: "Amber Xu",
    title: "Amber Xu — Visual Artist · Content Creator · Concept Designer",
    description: SITE_DESC,
    // 1200×630 is the universal sweet spot. Drop the actual file at
    // /public/og-default.jpg when the cover art is ready; URL is
    // resolved against `metadataBase` automatically.
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Amber Xu — portfolio cover",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Amber Xu — Visual Artist · Content Creator · Concept Designer",
    description: SITE_DESC,
    images: ["/og-default.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
