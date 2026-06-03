import type { Metadata } from "next";
import ProfileCard from "@/components/ProfileCard";
import AboutBody from "@/components/AboutBody";

/**
 * /about — About Me page.
 *
 * Restored from the earlier design (the ProfileCard + cool-blue glow +
 * cream Times-serif body) after the HTML rebuild was rejected: user
 * said "I really like the previous webpage's colors and design — just
 * change the text." So the visual frame here is byte-for-byte the
 * same as the page we shipped on Jun 3 (ProfileCard hero, three-
 * discipline grid, amber-token contact link). Only the body essay
 * is new — replaced with Amber's six-paragraph self-portrait, with a
 * ZH ↔ EN toggle held inside <AboutBody />.
 *
 * Why this file stays a Server Component: the metadata export below
 * runs at build time so OG / twitter previews are populated when a
 * crawler hits the static HTML — that's only possible from a Server
 * Component. Interactive state (the language toggle) lives in the
 * child <AboutBody /> which is marked "use client".
 */

const ABOUT_DESC =
  "About Amber Xu — Visual Artist · Content Creator · Concept Designer. " +
  "Drawing is my way of understanding the world.";

export const metadata: Metadata = {
  title: "About",
  description: ABOUT_DESC,
  openGraph: {
    title: "About — Amber Xu",
    description: ABOUT_DESC,
    url: "/about",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "About — Amber Xu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About — Amber Xu",
    description: ABOUT_DESC,
    images: ["/og-default.jpg"],
  },
};

export default function AboutPage() {
  return (
    <main className="relative flex min-h-screen flex-col">
      {/* Hero: profile card centered at top of page. Cool blue/purple
          inner gradient + soft blue rim glow — the palette Amber
          asked us to keep. */}
      <section
        aria-label="Profile card hero"
        className="relative flex w-full items-center justify-center"
        style={{ minHeight: "80vh", padding: "48px 24px" }}
      >
        <ProfileCard
          name="Amber Xu"
          avatarUrl="/og-default.jpg"
          showUserInfo={false}
          enableTilt
          enableMobileTilt
          behindGlowEnabled
          behindGlowColor="rgba(125, 190, 255, 0.67)"
          innerGradient="linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)"
        />
      </section>

      {/* Body block — eyebrow + name + 6-paragraph essay + closing pull
          + three-discipline grid + footer. Language toggle (ZH default)
          is inside the client component. */}
      <AboutBody />
    </main>
  );
}
