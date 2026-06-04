"use client";

/**
 * TopNav — shared, fixed-at-top glass nav bar.
 *
 * Composition:
 *   LEFT (optional)  — page-specific. Only the /work universe page
 *                      passes a left cluster (brand mark + INDEX
 *                      disclosure). On /, /about and every other page
 *                      the prop is omitted and the right-side links
 *                      hug the right edge thanks to justify-between.
 *   RIGHT (always)   — HOME · WORKS · ABOUT, identical across pages.
 *
 * The glass / refraction params match what Amber signed off on for
 * the /work bar — kept in this single source of truth so any future
 * tweak only lives in one file.
 *
 * `below` lets the caller render content directly under the bar
 * inside the same fixed wrapper — used by Universe.tsx to drop the
 * INDEX disclosure list below the bar.
 */

import { type ReactNode } from "react";
import GlassSurface from "@/components/GlassSurface";

interface TopNavProps {
  /** Optional left-side cluster (brand + extra controls). Omit for
   *  pages that should only show the right-side page nav. */
  left?: ReactNode;
  /** Optional content rendered below the bar (still inside the fixed
   *  top wrapper so it inherits the same horizontal insets). */
  below?: ReactNode;
}

export default function TopNav({ left, below }: TopNavProps) {
  return (
    <div className="pointer-events-none fixed left-6 right-6 top-6 sm:left-12 sm:right-12 sm:top-8 z-50">
      <GlassSurface
        width="100%"
        height="fit-content"
        borderRadius={22}
        /* Refractive glass with a light frost — same dial as the
           /work bar Amber approved. Don't touch unless she asks. */
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
        <div className="flex items-center justify-between gap-4 flex-wrap px-5 py-2.5">
          {/* Left cluster — empty span when caller passes nothing so
              justify-between still positions the right cluster against
              the right edge. */}
          <div className="flex items-center gap-4">
            {left ?? <span aria-hidden="true" />}
          </div>

          {/* Right cluster — page nav, identical on every page. */}
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
          </div>
        </div>
      </GlassSurface>
      {below}
    </div>
  );
}
