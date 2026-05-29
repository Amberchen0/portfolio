"use client";

import { motion, type Transition } from "framer-motion";
import { useEffect, useState } from "react";
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
  }, []);

  const snap: Transition = { duration: 0, delay: 0 };

  return (
    <>
      {/* Layer 0: LiquidEther fluid background — fades in first */}
      <motion.div
        aria-hidden
        className="fixed inset-0 z-0"
        style={{ pointerEvents: "none" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          isReturn
            ? snap
            : { duration: 3.0, delay: 0.4, ease: "easeInOut" }
        }
      >
        <LiquidEther
          mouseForce={20}
          cursorSize={100}
          isViscous
          viscous={30}
          colors={["#2787ff", "#c39fff", "#b69fce"]}
          autoDemo={false}
          autoSpeed={0.5}
          autoIntensity={2.2}
          isBounce={false}
          resolution={0.5}
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
          isReturn
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
          isReturn
            ? snap
            : { duration: 1.5, delay: 0.5, ease: "easeInOut" }
        }
      />
    </>
  );
}
