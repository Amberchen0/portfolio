import type { Metadata } from "next";
import WorkScene from "@/components/WorkScene";

const WORK_DESC =
  "Each work, a world of its own. Move your cursor to drift through the system.";

// title here ("Universe") goes through the layout's "%s — Amber Xu"
// template, so the final <title> reads "Universe — Amber Xu" without
// the suffix being repeated by hand.
export const metadata: Metadata = {
  title: "Universe",
  description: WORK_DESC,
  openGraph: {
    title: "Universe — Amber Xu",
    description: WORK_DESC,
    url: "/work",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Amber Xu — Universe overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Universe — Amber Xu",
    description: WORK_DESC,
    images: ["/og-default.jpg"],
  },
};

export default function WorkPage() {
  return <WorkScene />;
}
