"use client";

/**
 * LiquidGlassPanel — thin wrapper around the .liquid-glass /
 * .liquid-glass-strong CSS utilities from the cinematic-landing-page
 * build prompt Amber shared. Provides a positioned div that paints
 * a frosted glass panel over whatever sits behind it (backdrop-filter
 * blur + chrome-rim edge highlight).
 *
 * Sized 100% × 100% of its positioned parent — wrap in a relatively-
 * positioned container with a fixed aspect ratio (the existing
 * `<div className="absolute inset-0">` slot inside the wordmark
 * motion.div on /page.tsx already does this).
 *
 * Variant:
 *   "subtle"  → .liquid-glass        (4px backdrop blur, light rim)
 *   "strong"  → .liquid-glass-strong (50px blur, brighter rim + shadow)
 *
 * borderRadius defaults to "1.25rem" which matches the card radius
 * used by GlassSurface on /work; pass any CSS length to override.
 */

import type { CSSProperties } from "react";
import "./LiquidGlassPanel.css";

export interface LiquidGlassPanelProps {
  variant?: "subtle" | "strong";
  borderRadius?: string;
  className?: string;
  style?: CSSProperties;
}

export default function LiquidGlassPanel({
  variant = "strong",
  borderRadius = "1.25rem",
  className = "",
  style,
}: LiquidGlassPanelProps) {
  const variantClass =
    variant === "strong" ? "liquid-glass-strong" : "liquid-glass";

  /* Next.js 16 + Tailwind v4's CSS pipeline strips bare
     `backdrop-filter: blur(...)` declarations during build — the
     computed style on the rendered element resolves to "none" and
     the panel reads as a plain transparent box with just the edge
     highlight. Same issue we hit with GlassSurface on /work; same
     fix: set backdrop-filter as INLINE style here. The class still
     supplies the rim-highlight ::before, the background tint, the
     box-shadow, and the position/overflow setup — only the blur
     amount jumps out of the .css file. */
  const blurAmount = variant === "strong" ? "50px" : "4px";
  const backdropFilterValue = `blur(${blurAmount})`;

  return (
    <div
      className={`${variantClass} ${className}`.trim()}
      style={{
        width: "100%",
        height: "100%",
        borderRadius,
        backdropFilter: backdropFilterValue,
        WebkitBackdropFilter: backdropFilterValue,
        ...style,
      }}
    />
  );
}
