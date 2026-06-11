import type { Metadata } from "next";
import CvBody from "@/components/CvBody";

/**
 * /cv — Amber's résumé page. The actual content lives in
 * /public/cv/{zh,en}.html (her hand-styled HTML CVs); this page
 * wraps an iframe pointing at the right one based on the shared
 * useLang store. The wrapper provides the "unfurled parchment"
 * frame around the iframe + the entry animation that continues the
 * unroll motion from the ResumeScroll click on /about.
 *
 * Title goes through the layout's "%s — Amber Xu" template so the
 * final tab title reads "Résumé — Amber Xu".
 */

const CV_DESC =
  "Amber Xu's résumé — bilingual CV (EN / 中) covering visual artistry, content creation, and concept design.";

export const metadata: Metadata = {
  title: "Résumé",
  description: CV_DESC,
  openGraph: {
    title: "Résumé — Amber Xu",
    description: CV_DESC,
    url: "/cv",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Amber Xu — Résumé",
      },
    ],
  },
  /* Twitter card was missing in v1 of this file — every other page in
     the app router supplies a summary_large_image, so when a /cv URL
     was pasted into Twitter / X the preview fell back to the layout-
     level default rather than carrying the CV-specific title. Added. */
  twitter: {
    card: "summary_large_image",
    title: "Résumé — Amber Xu",
    description: CV_DESC,
    images: ["/og-default.jpg"],
  },
};

export default function CvPage() {
  return <CvBody />;
}
