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
          asked us to keep.

          Whitespace tuned per feedback: previously this used
          `minHeight: 80vh` which floated the card in a giant black
          void above + below. Switched to natural sizing with snug
          padding so the card sits close to the page top and the
          essay body picks up right under it. `name=""` is passed so
          the in-card "Amber Xu" label is suppressed — the metallic
          AMBER XU wordmark below now carries the identity. */}
      <section
        aria-label="Profile card hero"
        className="relative flex w-full items-center justify-center"
        style={{ padding: "32px 24px 16px" }}
      >
        {/* The component is the canonical React Bits ProfileCard; we
            don't pass `name` or `title` so the canonical defaults
            ("Javi A. Torres" / "Software Engineer") would normally
            render at the bottom of the card. Two explicit empties
            override those defaults, and the `pc-no-text` wrapper
            class hides the now-empty .pc-details scrim band so the
            card ends cleanly at the avatar. (CSS rule in
            ProfileCard.css.) `showUserInfo={false}` separately hides
            the handle / status / contact-button row. */}
        <ProfileCard
          className="pc-no-text"
          name=""
          title=""
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
