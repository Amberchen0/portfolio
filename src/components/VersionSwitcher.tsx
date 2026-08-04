"use client";

/**
 * VersionSwitcher — bottom-center pill on /work that lets a visitor
 * pick between two visual presentations of the same portfolio.
 *
 * v1 = the planet-universe view currently at /work (this is what's
 * always rendered right now).
 * v2 = a self-portrait-centred alternative Amber will build with
 * Claude — reserved but not implemented yet.
 *
 * Because both v1 and v2 will live at the same /work URL (state
 * flip inside WorkScene rather than a route change), the pill is
 * ambient chrome, not navigation: v1 shows as active (bright), v2
 * shows dimmed with a small dot indicator and, when clicked,
 * surfaces a brief "under construction" toast above the pill that
 * fades out after ~1.6s. No route change, no modal, no
 * pointer-block outside the pill itself.
 *
 * Copy — bilingual, driven by the shared useLang store so it
 * matches the rest of the site's EN/中 toggle.
 */

import { useEffect, useState } from "react";
import { useLang } from "@/lib/useLang";

const COPY = {
  zh: {
    v1: "版本 1",
    v2: "版本 2",
    comingSoon: "尚在建造中，敬请期待",
  },
  en: {
    v1: "VERSION 1",
    v2: "VERSION 2",
    comingSoon: "Under construction — coming soon",
  },
} as const;

export default function VersionSwitcher() {
  const [lang] = useLang();
  const t = COPY[lang];
  const [showToast, setShowToast] = useState(false);

  /* Auto-dismiss the toast 1.6s after V2 is clicked. Effect re-runs
     each time showToast flips true (including re-clicks while the
     toast is already visible — that resets the timer, so a fast
     re-click extends the visible window rather than cutting it off
     mid-fade). The cleanup clears the pending timer on unmount so
     we don't setState on a torn-down component. */
  useEffect(() => {
    if (!showToast) return;
    const id = window.setTimeout(() => setShowToast(false), 1600);
    return () => window.clearTimeout(id);
  }, [showToast]);

  return (
    /* Full-width flex container so the pill self-centres regardless
       of viewport width. pointer-events-none on the outer wrapper
       lets clicks pass through the gutters on either side of the
       pill so the planet-universe below stays fully interactive;
       the pill itself re-enables pointer-events-auto. */
    <div
      className="pointer-events-none fixed inset-x-0 bottom-5 z-20 flex justify-center px-4 sm:bottom-6"
    >
      <div className="relative">
        {/* Toast — floats above the pill; visible when showToast is
            true. Positioned absolutely with bottom: 100% + 8px so it
            sits just above the pill regardless of language length.
            Fades opacity only (no transform) — subtle, no motion
            trigger for the visitor's peripheral attention. */}
        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-black/75 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm transition-opacity duration-300 sm:text-xs ${
            showToast ? "opacity-100" : "opacity-0"
          }`}
          style={{
            fontFamily: 'Times, "Times New Roman", serif',
            bottom: "calc(100% + 8px)",
          }}
        >
          {t.comingSoon}
        </div>

        {/* Pill — matches the TopNav vocabulary: Times uppercase
            caps + wide letter-spacing + translucent dark glass with
            a hairline white border. */}
        <div
          className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/15 bg-black/50 px-4 py-1.5 text-[10px] uppercase tracking-[0.28em] text-white/70 backdrop-blur-sm sm:gap-4 sm:px-5 sm:text-xs"
          style={{ fontFamily: 'Times, "Times New Roman", serif' }}
        >
          {/* V1 — active. Rendered as a span (not a button) because
              you're already looking at v1; clicking it would be a
              no-op and having a hover state on a no-op button reads
              as broken. aria-current tells assistive tech this is
              the "current" version. */}
          <span className="text-white/95" aria-current="page">
            {t.v1}
          </span>

          <span className="text-white/30" aria-hidden>
            ·
          </span>

          {/* V2 — coming-soon. Real button (keyboard-focusable, has
              hover state) so the "clickable but not yet ready"
              affordance is honest. The small filled dot after the
              label is the "in progress / not shipped yet" cue —
              subtler than a badge or icon, but immediately parseable
              as "there's a status here". aria-label spells out the
              full status for screen readers so they don't just hear
              "VERSION 2 button" and expect navigation. */}
          <button
            type="button"
            onClick={() => setShowToast(true)}
            className="inline-flex items-center gap-1.5 text-white/45 transition-colors hover:text-white/80"
            aria-label={`${t.v2} — ${t.comingSoon}`}
          >
            {t.v2}
            <span
              className="inline-block h-1 w-1 rounded-full bg-white/40"
              aria-hidden
            />
          </button>
        </div>
      </div>
    </div>
  );
}
