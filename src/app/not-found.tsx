"use client";

/**
 * /_not-found — App Router 404 page.
 *
 * Replaces Next.js's default white "404 | This page could not be
 * found" with one that matches the rest of the portfolio's visual
 * voice: dark cosmic background, Times-serif italic display number,
 * bilingual EN/中 line (driven by the same useLang store as every
 * other page), and a single muted-amber link back to /work so a lost
 * visitor lands in the universe scene instead of the home wheel-
 * scroll handoff.
 *
 * Kept deliberately minimal — no shader background, no 3D scene —
 * because rendering anything heavy on a route the visitor probably
 * arrived at by typo doesn't earn its bandwidth. The cosmic feel
 * comes from a single radial-gradient + a faint star-dust SVG noise.
 */

import Link from "next/link";
import { useLang } from "@/lib/useLang";

const copy = {
  en: {
    label: "Off the orbit",
    body: "This page drifted past the edge of the map.",
    cta: "Return to the universe",
  },
  zh: {
    label: "脱离轨道",
    body: "这一页飘到了星图之外。",
    cta: "返回宇宙",
  },
} as const;

export default function NotFound() {
  const [lang] = useLang();
  const t = copy[lang];

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0807] text-center"
      style={{
        fontFamily: 'Times, "Times New Roman", serif',
      }}
    >
      {/* Soft warm-cool ambient orbs — same vocabulary as /about's
          radial glows so the page reads as part of the same family
          even without the heavy WebGL layers other pages run. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 left-1/2 -z-10 h-[120vh] w-[120vh] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(45,101,224,0.14), rgba(26,78,186,0.05) 40%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-1/4 right-0 -z-10 h-[80vh] w-[80vh] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(217,165,116,0.10), transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <p
        className="mb-6 text-xs uppercase tracking-[0.4em] text-muted"
        style={{ fontFamily: 'Times, "Times New Roman", serif' }}
      >
        {t.label}
      </p>

      {/* Display number: italic Times — same family as the home eyebrow
          + AboutBody closing pull. Huge clamp so it scales generously
          on desktop without crowding mobile. Inline cream colour (NOT
          text-foreground — that token is near-black on the dark
          theme; same trap the /about copy hit). */}
      <h1
        className="mb-8 italic leading-none"
        style={{
          fontSize: "clamp(7rem, 24vw, 18rem)",
          letterSpacing: "-0.04em",
          color: "#f0ece4",
        }}
      >
        404
      </h1>

      <p
        className="mb-12 max-w-md px-6 text-sm sm:text-base"
        style={{ color: "rgba(240,236,228,0.82)" }}
      >
        {t.body}
      </p>

      <Link
        href="/work"
        className="text-xs uppercase tracking-[0.3em] text-amber transition-colors hover:text-foreground"
      >
        {t.cta} →
      </Link>
    </main>
  );
}
