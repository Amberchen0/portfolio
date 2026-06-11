import type { Metadata } from "next";
import ProfileCardHero from "@/components/ProfileCardHero";
import AboutBody from "@/components/AboutBody";
import Plasma from "@/components/Plasma";
// Grainient + Silk imports kept around as rollback paths — Amber
// has cycled through Silk (v1) → Grainient (v2, rolled back) → Silk
// → Plasma (current). Both fallbacks stay warm in the bundler graph
// so swapping back is a single JSX edit.
import Grainient from "@/components/Grainient";
import Silk from "@/components/Silk";
import TopNav from "@/components/TopNav";

void Grainient;
void Silk;

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
      {/* Background shader — fullscreen WebGL2 canvas painting the
          page backdrop. Sits at z-0 behind every other layer; TopNav
          and the glass content card both run at z-10+ on top.
          v3 per Amber: Silk replaced by Plasma — raymarched
          volumetric pattern tinted lavender (#B497CF). Props are
          the exact values Amber pasted from the React Bits demo:
            • color #B497CF — pale lilac that the raymarched intensity
              gets multiplied through; bright core stays mostly white,
              fade-off zones drift toward the lavender tint.
            • speed 0.4 — gentle drift (further attenuated by the
              shader's internal 0.4 multiplier so effective is 0.16).
            • scale 2.7 — zoom into a larger pattern so individual
              plasma blobs read as broad slow swirls instead of busy
              detail.
            • mouseInteractive — the pattern drifts toward the
              cursor (scaled by distance from centre).
          Silk + Grainient imports retained at top of file for fast
          rollback (see `void Silk` / `void Grainient`). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
      >
        {/* v2 per Amber — four dial tweaks, color + direction stay:
            • speed 0.4 → 0.8 (doubled — the plasma drifts twice as
              fast, more "alive").
            • scale 2.7 → 2.5 (slight zoom-out → pattern reads a
              hair tighter / denser).
            • opacity 1 → 0.7 (alpha multiplier on the final pixel
              — the plasma blends softer with the dark page bg, no
              longer fully opaque).
            • mouseInteractive true → false — the pattern no longer
              drifts toward the cursor; pure time-driven motion. */}
        <Plasma
          color="#B497CF"
          speed={0.8}
          direction="forward"
          scale={2.5}
          opacity={0.7}
          mouseInteractive={false}
        />
      </div>

      {/* Shared TopNav — right cluster only (HOME · WORKS · ABOUT).
          The left cluster (brand mark + INDEX disclosure) is /work
          exclusive per Amber, so no `left` prop is passed here. The
          earlier ← Universe corner pill is gone — TopNav now carries
          the back-to-/work navigation. */}
      <TopNav />

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
      {/* Frosted-glass content card — v3 per Amber:
            • Wider: max-w-4xl → max-w-5xl (896 → 1024 px). Side gaps
              shrink on a 1280-wide viewport from ~192px each to
              ~128px each, but still leave a clearly visible Silk
              border on both sides.
            • FIXED position + internal scroll. The glass card is now
              anchored to the viewport (top-6 / bottom-6, centred
              horizontally) so as the visitor scrolls, the card frame
              stays put and the content (ProfileCard + AboutBody)
              slides inside it via overflow-y: auto.
              overscroll-behavior: contain stops wheel events from
              leaking to the window once the inner content reaches
              its edges, so you can't accidentally pull the silk
              backdrop with a trackpad. scrollbar-gutter: stable
              reserves space for the scrollbar even when not visible,
              preventing a tiny horizontal jitter when content height
              flips above/below the viewport.
          backdrop-filter is inline-styled (not via CSS class) — Next
          16 + Tailwind v4's pipeline strips `backdrop-filter` rules
          during build (same issue GlassSurface and the earlier
          LiquidGlassPanel had to work around). */}
      <div
        /* v4 per Amber:
            • max-w-5xl → max-w-6xl (1024 → 1152 px) — wider glass,
              ~64px Silk borders on each side at 1280-wide viewports.
            • Scrollbar hidden via Tailwind arbitrary selectors —
              [&::-webkit-scrollbar]:hidden zeros the Chrome/Safari
              webkit scrollbar; [scrollbar-width:none] does the same
              for Firefox. scrollbar-gutter was REMOVED so no empty
              gutter strip remains. Scroll still works via wheel +
              touchpad; the bar just isn't drawn.
            • Refraction feel: layered background-image (3 gradients)
              + multi-tinted box-shadows. Top-left gets a cool blue
              wisp, bottom-right a warm pink wisp — suggests light
              passing through glass and dispersing. The inset box-
              shadow at the LEFT edge picks up that blue tint, and
              the RIGHT edge picks up the warm tint, so the rim
              reads as a faint chromatic aberration at the borders. */
        className="fixed left-1/2 top-6 bottom-6 z-10 w-[calc(100%-3rem)] max-w-6xl -translate-x-1/2 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        style={{
          backdropFilter: "blur(24px) saturate(1.08)",
          WebkitBackdropFilter: "blur(24px) saturate(1.08)",
          backgroundImage: [
            // Diagonal "light catches the bevel" sheen.
            "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.06) 100%)",
            // Cool blue refraction wisp at upper-left.
            "radial-gradient(at 28% 18%, rgba(170,200,255,0.10), transparent 55%)",
            // Warm pink refraction wisp at lower-right.
            "radial-gradient(at 72% 82%, rgba(255,180,220,0.08), transparent 55%)",
          ].join(", "),
          // Base translucent fill — sits under the gradients above.
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          boxShadow: [
            // Bright top rim highlight (chrome bevel catching light).
            "inset 0 1px 0 rgba(255,255,255,0.22)",
            // Soft cool tint on the LEFT vertical edge.
            "inset 1px 0 0 rgba(180,200,255,0.10)",
            // Soft warm tint on the RIGHT vertical edge.
            "inset -1px 0 0 rgba(255,200,220,0.10)",
            // Subtle bottom-edge wash (light wrapping around).
            "inset 0 -1px 0 rgba(255,255,255,0.08)",
            // Drop shadow under the whole card.
            "0 16px 56px rgba(0,0,0,0.40)",
          ].join(", "),
          borderRadius: "1.75rem",
          overscrollBehavior: "contain",
        }}
      >
        <section
          aria-label="Profile card hero"
          className="flex w-full items-center justify-center"
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
          <ProfileCardHero />
        </section>

        {/* Body block — eyebrow + name + 6-paragraph essay + closing
            pull + three-discipline grid + footer. Language toggle
            (ZH default) is inside the client component. */}
        <AboutBody />
      </div>
    </main>
  );
}
