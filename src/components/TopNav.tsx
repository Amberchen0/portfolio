"use client";

/**
 * TopNav — the right-side glass capsule pinned to the top-right
 * corner: HOME · WORKS · ABOUT.
 *
 * This is the only nav element shared by every page. It is a
 * fit-content pill, NOT a full-width bar — so it leaves the left
 * corner free for any page-specific chrome. On /work, Universe.tsx
 * renders its own separate left capsule (AMBER XU · UNIVERSE +
 * INDEX). On / and /about no left capsule is rendered.
 *
 * Glass / refraction params match the dial Amber approved on the
 * /work bar (same backgroundOpacity, displace, RGB offsets, blur).
 * Keep this file as the single source of truth — if she asks to
 * retune the glass, change the values here and every page picks it
 * up.
 */

import GlassSurface from "@/components/GlassSurface";
import { useLang } from "@/lib/useLang";

export default function TopNav() {
  // Shared site-wide language toggle (localStorage-backed). Both / and
  // /about subscribe via the same hook, so flipping EN/中 here updates
  // their body copy at the same time.
  const [lang, setLang] = useLang();

  return (
    <div className="pointer-events-none fixed right-6 top-6 sm:right-12 sm:top-8 z-50">
      <GlassSurface
        width="fit-content"
        height="fit-content"
        borderRadius={22}
        displace={3}
        distortionScale={-180}
        redOffset={5}
        greenOffset={10}
        blueOffset={20}
        brightness={50}
        opacity={0.93}
        blur={14}
        backgroundOpacity={0.1}
        saturation={1}
        mixBlendMode="normal"
      >
        <div className="flex items-center gap-6 px-5 py-2.5">
          <a
            href="/"
            className="pointer-events-auto font-mono text-xs uppercase tracking-[0.3em] text-muted hover:text-amber transition-colors"
          >
            Home
          </a>
          <a
            href="/work"
            className="pointer-events-auto font-mono text-xs uppercase tracking-[0.3em] text-muted hover:text-amber transition-colors"
          >
            Works
          </a>
          <a
            href="/about"
            className="pointer-events-auto font-mono text-xs uppercase tracking-[0.3em] text-muted hover:text-amber transition-colors"
          >
            About
          </a>
          {/* Thin divider + EN / 中 toggle at the rightmost end of the
              pill — per Amber, the lang switch should live inside the
              capsule, not float below it. The "|" is a quiet visual
              separator between page nav and lang controls. */}
          <span aria-hidden className="font-mono text-xs text-muted/40 select-none">
            |
          </span>
          <div className="flex items-center font-mono text-xs uppercase tracking-[0.2em]">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`pointer-events-auto transition-colors ${
                lang === "en" ? "text-amber" : "text-muted hover:text-white"
              }`}
            >
              EN
            </button>
            <span className="mx-2 text-muted/50 select-none">/</span>
            <button
              type="button"
              onClick={() => setLang("zh")}
              className={`pointer-events-auto transition-colors ${
                lang === "zh" ? "text-amber" : "text-muted hover:text-white"
              }`}
            >
              中
            </button>
          </div>
        </div>
      </GlassSurface>
    </div>
  );
}
