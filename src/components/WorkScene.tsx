"use client";

import { motion, type Transition } from "framer-motion";
import { useEffect, useState } from "react";
import Aurora from "@/components/Aurora";
import Galaxy from "@/components/Galaxy";
import LiquidEther from "@/components/LiquidEther";
import Universe from "@/components/Universe";

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
  // Detect navigation back from a project page. document.referrer is a
  // client-only API, so on first render we don't yet know — we play the
  // full entry animation. Once useEffect runs we flip the transitions to
  // duration 0, which framer-motion treats as "snap to target", and the
  // half-played animation completes instantly.
  const [isReturn, setIsReturn] = useState(false);
  // Honour OS-level "reduce motion" preference. Anyone with vestibular
  // sensitivity, motion sickness, or who's simply set the OS toggle
  // gets the same instant-snap treatment as a returning visitor — no
  // 4.8s fade-in choreography.
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    try {
      if (document.referrer) {
        const refPath = new URL(document.referrer).pathname;
        if (refPath.startsWith("/works/")) {
          setIsReturn(true);
        }
      }
    } catch {
      // Malformed referrer URL — treat as first visit. No-op.
    }
    if (typeof window !== "undefined" && window.matchMedia) {
      const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
      const update = () => setReduceMotion(mql.matches);
      update();
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }
  }, []);

  // Single boolean drives every transition below: snap immediately when
  // returning from a project page OR when the user has asked for less
  // motion at the OS level.
  const shouldSnap = isReturn || reduceMotion;
  const snap: Transition = { duration: 0, delay: 0 };

  return (
    <>
      {/* Layer 0: Galaxy starfield — moved BELOW both Aurora ribbons per user.
          Twinkling stars + mouse repulsion. Container is pointer-events:
          none so cursor still reaches Universe; Galaxy.tsx binds its
          mousemove on window so its repulsion still responds. */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
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
        />
      </motion.div>

      {/* Layer 1: Aurora #2 — vertically flipped so its glow rises from
          the BOTTOM of the viewport. CSS `scaleY(-1)` on the wrapper
          inverts the canvas without touching the shader. */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{ transform: "scaleY(-1)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.539 }}   /* +10% per user — was 0.49 → 0.49×1.1=0.539 */
        transition={
          shouldSnap
            ? snap
            : { duration: 3.0, delay: 0.4, ease: "easeInOut" }
        }
      >
        <Aurora
          colorStops={["#693f74", "#63699d", "#1b7098"]}
          blend={1}
          amplitude={1.0}
          speed={0.8}
        />
      </motion.div>

      {/* Layer 2: Aurora #1 — sits above Aurora #2, native orientation
          (glow at TOP of viewport). Still beneath LiquidEther + Universe. */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[2]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.539 }}   /* +10% per user — was 0.49 → 0.49×1.1=0.539 */
        transition={
          shouldSnap
            ? snap
            : { duration: 3.0, delay: 0.4, ease: "easeInOut" }
        }
      >
        <Aurora
          colorStops={["#743f69", "#7c639d", "#2b1b98"]}
          blend={1}
          amplitude={1.0}
          speed={0.8}
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
          colors={["#12467e", "#9182da", "#8193c0"]}     /* v3 per user: 用 color0/1/2 作为 palette (深湖蓝 → 薰衣草紫 → 灰蓝) */
          mouseForce={10}
          cursorSize={95}
          isViscous={false}
          viscous={19}
          iterationsViscous={8}
          iterationsPoisson={30}
          resolution={0.45}
          isBounce={false}
          autoDemo
          autoSpeed={0.05}
          autoIntensity={1}
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
    </>
  );
}
