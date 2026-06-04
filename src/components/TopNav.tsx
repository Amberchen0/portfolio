"use client";

/**
 * TopNav — site-wide top glass capsule.
 *
 * Two modes depending on whether the caller passes a `left` cluster:
 *
 *   • No `left` (home + about + any page that just wants the page nav)
 *     → renders a fit-content pill pinned to the top-right corner.
 *     Contents: HOME · WORKS · ABOUT  | EN / 中.
 *
 *   • `left` provided (only /work) → renders a full-width pill that
 *     spans from left-6 to right-6, fusing the left cluster (brand
 *     + INDEX disclosure) and the always-on right cluster (page nav
 *     + EN/中) into a single continuous glass surface. This is what
 *     Amber asked for: on /work the two clusters read as one
 *     connected bar; elsewhere only the right capsule appears.
 *
 * `below` is rendered inside the same fixed wrapper directly under
 * the bar — used by /work to drop the INDEX disclosure list under
 * the left side of the bar.
 *
 * Glass / refraction params are the single source of truth here.
 * Change them in this file and every page picks up the new dial.
 */

import { type ReactNode } from "react";
import GlassSurface from "@/components/GlassSurface";
import { useLang } from "@/lib/useLang";

interface TopNavProps {
  /** Optional left-side cluster — when present, the bar expands to
   *  full width and the left + right clusters share one glass pill. */
  left?: ReactNode;
  /** Optional content rendered directly under the bar (same fixed
   *  wrapper, inherits the bar's horizontal insets). */
  below?: ReactNode;
}

export default function TopNav({ left, below }: TopNavProps) {
  // Shared site-wide language toggle (localStorage-backed). Both / and
  // /about subscribe via the same hook, so flipping EN/中 here updates
  // their body copy at the same time.
  const [lang, setLang] = useLang();

  const isWide = Boolean(left);

  // Wrapper positioning differs by mode: full-edges when wide so the
  // bar can stretch; right-corner-only when narrow.
  const wrapperClass = isWide
    ? "pointer-events-none fixed left-6 right-6 top-6 sm:left-12 sm:right-12 sm:top-8 z-50"
    : "pointer-events-none fixed right-6 top-6 sm:right-12 sm:top-8 z-50";

  // Inner row: justify-between when wide so the two clusters hug the
  // pill's two ends; simple gap row when narrow (just the right
  // cluster).
  const innerClass = isWide
    ? "flex items-center justify-between gap-4 flex-wrap px-5 py-2.5"
    : "flex items-center gap-6 px-5 py-2.5";

  return (
    <div className={wrapperClass}>
      <GlassSurface
        width={isWide ? "100%" : "fit-content"}
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
        <div className={innerClass}>
          {/* Left cluster — page-specific. Only /work passes anything;
              everywhere else the bar starts directly with the right
              cluster (and the wrapper itself is narrower). */}
          {isWide && (
            <div className="flex items-center gap-5">{left}</div>
          )}

          {/* Right cluster — always on. HOME · WORKS · ABOUT + lang. */}
          <div className="flex items-center gap-6">
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
            {/* Thin divider + EN / 中 toggle at the rightmost end of
                the pill — the lang switch lives inside the capsule per
                Amber, not in a floating row below. */}
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
        </div>
      </GlassSurface>
      {below}
    </div>
  );
}
