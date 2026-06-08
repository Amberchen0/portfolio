"use client";

/**
 * ResumeScroll — floating rolled-parchment-with-wax-seal CTA at the
 * bottom of /about. Click triggers an "unroll" animation then routes
 * to /cv (where the unfurled paper continues the motion).
 *
 * Layout (v6 per Amber): inline in the document flow, anchored
 * directly under the footer line on /about ("悉尼 · 接受精选合作")
 * with comfortable margin above and below. Previously this element
 * was `fixed bottom-8 left-1/2` so it stayed glued to the viewport
 * while scrolling — Amber found that too persistent and asked it to
 * just sit at one place in the page instead. So no more fixed
 * positioning, no more sticky z-index, no more padding hack on the
 * parent section to make room for it.
 *
 * Visual: a small horizontal "scroll seen edge-on" — parchment body
 * with darker rolled edges, a deep wine wax seal stamped in the
 * middle. Idle state has a gentle bob; hover lifts it and brightens
 * the seal; click plays an unroll (width expansion + opacity drop)
 * then navigates. The /cv page reads the `cv-arrived-via=scroll`
 * sessionStorage flag we drop here and plays its own continuation
 * animation.
 *
 * The previous "Download CV ↓" link in AboutBody's footer was
 * removed when this scroll was added — both pointed at the resume,
 * having two CV entry points was duplicated chrome.
 */

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ResumeScroll() {
  const router = useRouter();
  const [opening, setOpening] = useState(false);

  const handleOpen = () => {
    if (opening) return;
    setOpening(true);
    // Drop a flag so /cv knows to play the "continuation of the unroll"
    // entry animation instead of a generic fade-in.
    try {
      window.sessionStorage.setItem("cv-arrived-via", "scroll");
    } catch {
      // sessionStorage may be unavailable (private mode, etc.) — the /cv
      // page falls back to its plain fade-in. No-op.
    }
    // Wait for the click animation to play out before swapping routes —
    // gives the scroll time to expand and fade so the page transition
    // feels like one continuous motion, not a jump.
    window.setTimeout(() => {
      router.push("/cv");
    }, 520);
  };

  // Prefetch /cv so the route is warm by the time the user clicks.
  // Done via onMouseEnter to avoid prefetching for every visitor on
  // first paint (we only want the cost when there's actual hover
  // intent).
  const handlePrefetch = () => {
    router.prefetch("/cv");
  };

  return (
    <motion.button
      type="button"
      aria-label="Open résumé"
      onClick={handleOpen}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      /* v6: inline-flow centred block. `mx-auto block` does the
         horizontal centring; `mt-24` opens generous breathing room
         under the footer line above; `mb-16` keeps a tail margin
         before page bottom. No fixed/sticky/absolute — scroll moves
         with the rest of the document now. */
      className="pointer-events-auto mx-auto mt-24 mb-16 block outline-none"
      style={{ WebkitTapHighlightColor: "transparent" }}
      /* v4: Amber re-exported the PNG with a real transparent alpha
         channel (RGBA, was RGB-with-black-bg). The screen-mode hack
         + matching button background that v3 added to dissolve the
         black backdrop are no longer needed — and would now lift the
         scroll's actual cream colour slightly off-tone since screen
         blends each non-zero pixel against the dark backdrop too.
         Stripped both back to clean: transparent button + no blend
         on the img. */
      /* Idle bob: y goes 0 → -6 → 0 every 3.6s with easeInOut. Soft
         enough not to be distracting while the visitor reads the
         essay, persistent enough to draw the eye back. */
      animate={opening ? { scale: 1.8, opacity: 0 } : { y: [0, -6, 0] }}
      transition={
        opening
          ? { duration: 0.5, ease: [0.32, 0.72, 0.34, 1] }
          : { duration: 3.6, repeat: Infinity, ease: "easeInOut" }
      }
      whileHover={
        opening
          ? undefined
          : { scale: 1.06, y: -10, transition: { duration: 0.25, ease: "easeOut" } }
      }
      whileTap={opening ? undefined : { scale: 0.94 }}
    >
      {/* v4 per Amber: PNG re-exported with a real transparent alpha
          channel (RGBA). The mix-blend-mode: screen hack we needed
          for the previous RGB-with-black-background export is gone —
          the image renders directly with its own transparency.
          v5 per Amber ("放大 2 倍"): width 280 → 560 (height props
          follow proportionally; CSS height stays auto so the natural
          1536/1024 image aspect is preserved). */}
      <Image
        src="/scroll.png"
        alt="Rolled scroll — open résumé"
        width={560}
        height={280}
        priority={false}
        style={{
          width: "560px",
          height: "auto",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </motion.button>
  );
}
