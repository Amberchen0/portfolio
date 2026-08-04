"use client";

import { motion, type Transition } from "framer-motion";
import { useEffect, useState } from "react";
// Aurora import kept around even though the two Aurora layers are
// currently disabled (replaced by Grainient per Amber). Re-enable by
// uncommenting the two Aurora blocks below if she wants to switch back.
import Aurora from "@/components/Aurora";
import Galaxy from "@/components/Galaxy";
import Grainient from "@/components/Grainient";
import LiquidEther from "@/components/LiquidEther";
import Universe from "@/components/Universe";
import VersionSwitcher from "@/components/VersionSwitcher";

// Aurora is still imported so it appears as "used" to TypeScript and
// also so the rollback path stays warm in the bundler graph. Silence
// the "unused" lint by referencing it once at module scope.
void Aurora;

/**
 * /work entry choreography continuing seamlessly from the home page's
 * scroll-darkening transition.  Initial state: full-black overlay (matching
 * the state home left at when routing).  Then:
 *
 *   0.0 – 0.5s  →  pure black (handoff buffer)
 *   0.3 – 1.8s  →  LiquidEther fluid fades in (visible against black)
 *   1.0 – 3.5s  →  Universe (planets + nebula + UI) fades in over the fluid
 *   0.5 – 1.3s  →  black overlay fades out (revealing LiquidEther first)
 *
 * When the user returns here from a project detail page (any URL under
 * /works/), the slow entry choreography is skipped — everything snaps to
 * its final state on the first frame so going "back" feels instant.
 */
export default function WorkScene() {
  // Detect navigation back from a project page SYNCHRONOUSLY at component
  // init — both via useState lazy initializers — so the value is correct
  // on the very first render. The previous setup put both reads inside
  // useEffect, which fires AFTER first render: by then framer-motion has
  // already kicked off the 4.8s entry animation with shouldSnap=false,
  // and flipping `transition` mid-flight doesn't cancel the in-progress
  // motion. Result: returning visitors waited ~5s of fade-in every time
  // they clicked back from a project page, which is what Amber flagged
  // as "near-1-minute black screen".
  const [isReturn] = useState<boolean>(() => {
    if (typeof document === "undefined") return false; // SSR guard
    try {
      const ref = document.referrer;
      if (!ref) return false;
      const refPath = new URL(ref).pathname;
      return refPath.startsWith("/works/");
    } catch {
      return false;
    }
  });

  // Honour OS-level "reduce motion" preference. Anyone with vestibular
  // sensitivity, motion sickness, or who's simply set the OS toggle
  // gets the same instant-snap treatment as a returning visitor — no
  // 4.8s fade-in choreography. Read synchronously at init like isReturn
  // above; a follow-up listener inside useEffect catches the (rare)
  // case where the preference flips while the page is open.
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mql.matches);
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  // Single boolean drives every transition below: snap immediately when
  // returning from a project page OR when the user has asked for less
  // motion at the OS level.
  const shouldSnap = isReturn || reduceMotion;
  const snap: Transition = { duration: 0, delay: 0 };

  return (
    <>
      {/* Galaxy starfield — twinkling stars + mouse repulsion.
          Container is pointer-events: none so cursor still reaches
          Universe; Galaxy.tsx binds its mousemove on window so its
          repulsion still responds.
          v2 per Amber ("星空一点都看不清，要不星空往上提一个图层"):
          moved up from z-0 to z-[2] so it paints ON TOP of the
          Grainient gradient (z-[1]) instead of underneath it. Stars
          now read as bright pinpricks against the dark Grainient
          backdrop rather than being smothered by the opaque shader
          output. Still below LiquidEther (z-[3]), so the purple
          fluid keeps flowing on top of both. */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[2]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          shouldSnap
            ? snap
            : { duration: 3.0, delay: 0.4, ease: "easeInOut" }
        }
      >
        <Galaxy
          mouseRepulsion
          mouseInteraction
          density={3}
          glowIntensity={0.2}
          saturation={0.6}
          hueShift={180}
          twinkleIntensity={0.4}
          rotationSpeed={0}
          repulsionStrength={0}
          autoCenterRepulsion={0}
          starSpeed={0.1}
          speed={0.2}
          /* transparent={true} is REQUIRED when Galaxy sits on top of
             another visual layer (here: above Grainient at z-[1]).
             Default false → gl.clearColor(0,0,0,1) paints an opaque
             black canvas with stars on top, which then masks
             everything below in the stacking order. true →
             alpha-blended, only star pixels are opaque, gradient
             shows through every other pixel. */
          transparent
        />
      </motion.div>

      {/* ┌──────────────────────────────────────────────────────────┐
          │ Aurora layers (DISABLED per Amber — replaced by         │
          │ Grainient below). Kept commented for fast rollback —    │
          │ if the Grainient experiment doesn't land, uncomment     │
          │ these two blocks and remove the Grainient block.        │
          └──────────────────────────────────────────────────────────┘

          Layer 1 was Aurora #2 — vertically flipped via scaleY(-1)
          so its glow rose from the BOTTOM of the viewport:

          <motion.div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[1]"
            style={{ transform: "scaleY(-1)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.539 }}
            transition={shouldSnap ? snap : { duration: 3.0, delay: 0.4, ease: "easeInOut" }}
          >
            <Aurora colorStops={["#693f74", "#63699d", "#1b7098"]} blend={1} amplitude={1.0} speed={0.8} />
          </motion.div>

          Layer 2 was Aurora #1 — native orientation, glow at TOP:

          <motion.div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[2]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.539 }}
            transition={shouldSnap ? snap : { duration: 3.0, delay: 0.4, ease: "easeInOut" }}
          >
            <Aurora colorStops={["#743f69", "#7c639d", "#2b1b98"]} blend={1} amplitude={1.0} speed={0.8} />
          </motion.div>
      */}

      {/* Layers 1+2 (NEW): Grainient — single fullscreen WebGL2 quad
          replacing both Aurora ribbons. Props are the exact values
          Amber pasted from the React Bits demo: dark cool palette
          (#451755 / #171032 / #2a395a), high warp + grain, mild
          desaturation. Opacity fades in on the same 3s/0.4s curve
          as the old Aurora layers so the entry choreography reads
          continuous with the home → /work transition.
          v4 per Amber ("你怎么把星空背景给去掉了"): final opacity
          dropped 1.0 → 0.65 so the Galaxy starfield (z-0, layer 0)
          shows through. Grainient's shader outputs alpha=1 on every
          pixel (unlike Aurora which had a semi-transparent canvas),
          so at opacity 1 it was completely masking the stars below.
          0.65 keeps the gradient as the dominant background colour
          while letting twinkling stars register through it. */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        initial={{ opacity: 0 }}
        /* v5 per Amber ("极光背景特效太实在了"): 0.65 → 0.35.
           "极光" 在用户语境里是 Grainient gradient — Aurora 那两层早
           就被注释禁用了。Grainient 现在淡到只占 35%，Galaxy 星空和
           行星本身成为画面的主角。 */
        animate={{ opacity: 0.35 }}
        transition={
          shouldSnap
            ? snap
            : { duration: 3.0, delay: 0.4, ease: "easeInOut" }
        }
      >
        {/* v3 per Amber ("动态频率也太低了") — three motion-speed bumps,
            colours + grain settings from v2 untouched:
            • noiseScale 0.05 → 0.5 (back to v1's value — the v2 cut
              made the overall rotation drift nearly static; this was
              the main cause of the "too slow" feel)
            • timeSpeed 1.6 → 2.4 (overall time multiplier +50%)
            • warpSpeed 2.2 → 3.5 (warp ripple animation speed +60%)
            Combined: the field now rotates more visibly while the
            internal ripples flow faster — much more "alive". */}
        <Grainient
          color1="#50245f"
          color2="#171032"
          color3="#35466b"
          timeSpeed={2.4}
          colorBalance={-0.1}
          warpStrength={0.8}
          warpFrequency={10.5}
          warpSpeed={3.5}
          warpAmplitude={60}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={610}
          noiseScale={0.5}
          grainAmount={0}
          grainScale={0.2}
          grainAnimated={false}
          contrast={1.5}
          /* v4 per Amber ("亮度稍微调低 10%"): gamma 1.3 → 1.17.
             Lower gamma reduces the midtone "lift" the previous 1.3
             applied, so the whole gradient sits slightly darker.
             Colour palette + saturation untouched — only luminance
             curve shifts. */
          gamma={1.17}
          saturation={0.85}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />
      </motion.div>

      {/* Layer 3: LiquidEther fluid background — bumped from z-[2] to z-[3]
          to stay above Galaxy. Fades in first. */}
      <motion.div
        aria-hidden
        className="fixed inset-0 z-[3]"
        style={{ pointerEvents: "none" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          shouldSnap
            ? snap
            : { duration: 3.0, delay: 0.4, ease: "easeInOut" }
        }
      >
        <LiquidEther
          colors={["#403372", "#8067af", "#968fc4"]}     /* v4 per user: color0/1/2 = 深紫 → 中段薰衣草 → 灰蓝紫 */
          mouseForce={21}
          cursorSize={70}
          isViscous
          viscous={34}
          iterationsViscous={48}
          iterationsPoisson={59}
          resolution={0.4}
          isBounce={false}
          autoDemo
          autoSpeed={0.5}
          autoIntensity={0.6}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </motion.div>

      {/* Layer 10: Universe (planets / nebula / UI) — fades in second.
          Universe internally renders a fixed inset-0 z-10 wrapper, so
          we just supply opacity via this parent motion.div (CSS opacity
          inherits to descendants). */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          shouldSnap
            ? snap
            : { duration: 3.0, delay: 1.8, ease: "easeInOut" }
        }
      >
        <Universe />
      </motion.div>

      {/* Layer 100: Black entry overlay — picks up where home's black
          overlay left off (opacity 1) and fades out so LiquidEther can
          appear "out of the dark".  Pointer-events stay off the whole
          time so it never blocks cursor interaction. */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[100] bg-black"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={
          shouldSnap
            ? snap
            : { duration: 1.5, delay: 0.5, ease: "easeInOut" }
        }
      />

      {/* Layer 20 (chrome): Version 1 / Version 2 pill at bottom
          centre. Fades in on the same curve as the Universe (delay
          1.8, duration 3.0) so it lands as part of the same reveal
          rather than popping in cold. Kept OUT of the Universe
          motion.div wrapper so its own pointer-events / z-index
          rules stay clean and it doesn't inherit any transform from
          a shared parent. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          shouldSnap
            ? snap
            : { duration: 3.0, delay: 1.8, ease: "easeInOut" }
        }
      >
        <VersionSwitcher />
      </motion.div>
    </>
  );
}
