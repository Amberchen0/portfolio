"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LiquidChrome } from "@/components/LiquidChrome";
import DotField from "@/components/DotField";
import MetallicPaint from "@/components/MetallicPaint";
import ShinyText from "@/components/ShinyText";
import TopNav from "@/components/TopNav";
import { useLang } from "@/lib/useLang";

const copy = {
  en: {
    eyebrow: "Portfolio · 2026",
    title: ["Amber", "Xu"],
    // Three-tag identity replaces the older single "Multidisciplinary
    // Visual Designer" line. Each tag covers a distinct axis of the
    // practice: artist (eye/hand/craft) · content creator (reach &
    // distribution) · concept designer (worlds & narrative).
    subtitle: "Visual Artist · Content Creator · Concept Designer",
    // Manifesto, per user direction (post-GPT-feedback session).
    // The previous tagline was generic; this two-sentence statement
    // anchors the home with the core thesis: creation as the
    // expansion of perception, emotion, and modes of expression
    // — not a display of technique.
    body: "A creator who began with drawing — growing continuously across visual expression and cross-disciplinary practice. For me, creation isn't a display of technique; it's the continuous expansion of perception, emotion, and the ways of telling.",
    soon: "The full archive is being assembled.",
    cta: "Selected works arriving soon.",
    footer: "Sydney · Available for select collaborations",
  },
  zh: {
    eyebrow: "作品集 · 2026",
    title: ["Amber", "Xu"],
    subtitle: "视觉艺术家 · 内容创作者 · 概念设计师",
    body: "我是一个以绘画为起点，在视觉表达与跨领域创作之间持续生长的创造者。对我而言，创作不是技术的展示，而是认知、情感与表达方式的不断扩展。",
    soon: "完整作品归档正在装配中。",
    cta: "精选作品即将上线。",
    footer: "悉尼 · 接受精选合作",
  },
} as const;

export default function Home() {
  // Language now lives in the shared `useLang` store (localStorage +
  // window event), driven by the EN/中 toggle inside TopNav. The
  // local header that used to render its own EN/中 row was removed —
  // see the deleted <header> below for what used to live there.
  const [lang] = useLang();
  const t = copy[lang];

  /* ─── Scroll-darkening transition to /work ───
     Wheel events accumulate into `progress` (0..1) which drives a
     black overlay's opacity.  When progress reaches 95%, we navigate
     to /work — whose own entry choreography continues the fade-out
     starting from full black so the visual handoff is seamless. */
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);          /* sync mirror of progress for use inside event handlers */
  const transitionStarted = useRef(false);
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/work");
    const handleWheel = (e: WheelEvent) => {
      if (transitionStarted.current) return;
      e.preventDefault();
      /* Use ref (not the setState updater) so we can call router.push
         OUTSIDE of React's render phase — the previous code called
         router.push inside setProgress's updater function, which
         triggers "Cannot update a component while rendering a
         different component" because the Router state mutation
         happens during Home's render. */
      const next = Math.min(1, Math.max(0, progressRef.current + e.deltaY * 0.0015));
      progressRef.current = next;
      setProgress(next);
      if (next >= 0.95 && !transitionStarted.current) {
        transitionStarted.current = true;
        router.push("/work");
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [router]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* LiquidChrome — fullscreen fluid background.  Sits at z-0
          (just above body bg, below all content which is at z>0).
          NOTE: pointer-events DELIBERATELY enabled here so cursor
          mousemove can reach LiquidChrome's container → ripple
          interaction works.  Content sits at z-10 so links / hover
          lens / language buttons still receive their own events
          first (higher z always wins for pointer hit-testing). */}
      <div
        aria-hidden
        className="fixed inset-0 z-0"
      >
        <LiquidChrome
          /* v3 per Amber: switched to the React Bits docs-default
             values. baseColor was [0.05, 0.04, 0.08] (very dim cool
             purple) → [0.1, 0.1, 0.1] (neutral mid-grey, brighter
             overall). speed 0.3 → 0.2 (calmer flow). amplitude /
             frequencyX / frequencyY / interactive unchanged. */
          baseColor={[0.1, 0.1, 0.1]}
          speed={0.2}
          amplitude={0.3}
          frequencyX={3}
          frequencyY={3}
          interactive
        />
      </div>

      {/* warm ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 left-1/2 -z-10 h-[120vh] w-[120vh] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(45,101,224,0.18), rgba(26,78,186,0.06) 40%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-1/4 -right-1/4 -z-10 h-[80vh] w-[80vh] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(45,101,224,0.10), transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Shared TopNav — HOME · WORKS · ABOUT plus the EN / 中 lang
          toggle, all inside the same glass capsule on the top-right.
          Amber asked for the lang switch to live inside the pill
          rather than float below it, so the local <header> that used
          to render a standalone EN/中 row was removed. The pt-20
          spacing below now starts directly from the hero column. */}
      <TopNav />

      {/* hero */}
      <main className="relative z-10 flex flex-1 flex-col justify-center px-6 sm:px-12">
        <div className="mx-auto w-full max-w-5xl">
          <motion.p
            key={`eyebrow-${lang}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            /* Eyebrow font swapped from font-mono → Times per user.
               Keeps uppercase + 0.3em tracking + muted colour, just the
               typeface is now serif (matches subtitle + top nav). */
            className="mb-8 text-xs uppercase tracking-[0.3em] text-muted"
            style={{ fontFamily: 'Times, "Times New Roman", serif' }}
          >
            {t.eyebrow}
          </motion.p>

          <div className="relative flex items-center justify-center">
            {/* (Amber etching + hover-reveal real-photo lens removed per user.
                Signature wordmark below now stands alone in the hero.) */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: "min(70%, 560px)",
                height: "min(70%, 560px)",
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse 60% 70% at 55% 50%, rgba(45,101,224,0.18), transparent 72%)",
                filter: "blur(36px)",
                zIndex: 0,
              }}
            />

            {/* Signature wordmark removed per user — only the typed
                AMBER XU block remains as the hero name treatment. */}
            <h1 className="sr-only">Amber Xu</h1>

            {/* Block-letter "Amber Xu" variant — same MetallicPaint shader,
                applied to a typed sans-serif SVG instead of the handwritten
                signature. Lets the user compare which name treatment they
                prefer side-by-side. Sits directly under the signature in
                the same hero column. */}
            <motion.div
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.2, delay: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative mx-auto"
              style={{
                width: "min(75%, 720px)",
                aspectRatio: "1400 / 1100",  /* matches SVG viewBox (1.27:1) — taller block, XU pulled down 50px so AMBER/XU don't feel squashed together */
              }}
            >
              {/* Layer 1 (back): DotField — React Bits dot-grid with
                  cursor-driven bulge + radial glow. Replaced the
                  previous LetterGlitch character matrix per Amber:
                  she wanted a calmer, more lavender field as the
                  back layer so the metallic AMBER XU wordmark on top
                  reads as the focal point rather than competing with
                  scrolling characters.
                  Props are the exact trio she pasted from the docs:
                    bulgeStrength 67, glowRadius 160, cursorRadius
                    500, dotRadius 2.5, dotSpacing 14, bulgeOnly,
                    gradientFrom #9055f7 (violet) → gradientTo
                    #a997cf (dusty lavender), glowColor #120F17
                    (near-black for a dim "shadow" follow). The
                    LetterGlitch.tsx file is kept around in case we
                    want to switch back later.
                  v3 per Amber ("点阵向两侧各多铺 100px"): horizontal
                  extension bumped 30 → 100 on each side (so the dot
                  field is 200px wider than the wordmark slot, 100 to
                  the left and 100 to the right). MetallicPaint stays
                  inset:0 (front layer) so the AMBER XU letters keep
                  their original width — only the dot field grows.
                  v4 per Amber ("上下高度各减少150px，左右增加150px"):
                  top/bottom now inset 150px (dot field is shorter
                  than the wordmark slot — leaves bare LiquidChrome
                  above and below the dots), left/right extension
                  bumped -100 → -250 (each side adds another 150px,
                  so the field stretches +250px past the wordmark
                  on each side, total 500px wider).
                  v5 per Amber ("左右各减少40px"): horizontal extension
                  pulled in 40px each side, -250 → -210. Field still
                  bleeds 210px past the wordmark on each end but
                  doesn't quite kiss the viewport edges anymore.
                  v6 per Amber ("左右各减少25px"): pulled in another
                  25px each side, -210 → -185. */}
              <div
                className="absolute"
                style={{
                  top: "150px",
                  bottom: "150px",
                  /* v7: -185 → -165, pulled in another 20px each side. */
                  left: "-165px",
                  right: "-165px",
                }}
              >
                {/* v7 props per Amber: dotSpacing 11 → 10 (one
                    more notch tighter — densest version so far)
                    + glowColor #14101c → #312549 (was near-black,
                    cursor glow barely registered; now a clearly
                    visible deep purple so the radial follow reads).
                    Everything else from v6 holds. */}
                {/* v11 per Amber — four retunes on top of v10:
                    • dotRadius 4 → 4.5 (one more chunkier step).
                    • Gradient simplified: both stops now #010113 — a
                      single flat near-black with the slightest navy
                      undertone. The diagonal #03031c → #030321 fade
                      is gone; the field reads as one continuous
                      colour, so the dots become the only spatial cue.
                    • glowColor #232030 → #323237 — a touch brighter
                      and more neutral graphite, so the cursor halo is
                      legible again (the v10 #232030 was almost
                      invisible per Amber). */}
                <DotField
                  dotRadius={4.5}
                  dotSpacing={11}
                  bulgeStrength={53}
                  glowRadius={160}
                  sparkle={false}
                  waveAmplitude={0}
                  cursorRadius={600}
                  cursorForce={0.28}
                  bulgeOnly
                  gradientFrom="#010113"
                  gradientTo="#010113"
                  glowColor="#323237"
                />
              </div>

              {/* Layer 2 (front): MetallicPaint AMBER XU wordmark.
                  Painted after LetterGlitch in DOM order, so it stacks
                  on top automatically (both are absolute inset-0 inside
                  a relative motion.div — same z-index, later wins). */}
              <div className="absolute inset-0">
                <MetallicPaint
                  imageSrc="/amber-xu-block.svg"
                  seed={37.49}
                  scale={1.7}
                  patternSharpness={0.5}
                  noiseScale={2}
                  speed={0.36}
                  liquid={0.87}
                  mouseAnimation
                  brightness={1.95}
                  contrast={0.5}
                  refraction={0.048}
                  blur={0.016}
                  chromaticSpread={2.3}
                  fresnel={2}
                  angle={0}
                  waveAmplitude={1.3}
                  distortion={0.45}
                  contour={0.8}
                  lightColor="#cdc8e1"
                  darkColor="#031943"
                  tintColor="#a3ccf5"
                />
              </div>
            </motion.div>
          </div>

          <motion.div
            key={`body-${lang}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 max-w-xl space-y-4"
          >
            {/* Subtitle: Times Bold + ShinyText 扫光特效（之前被回退掉了，
                按最后一次认可的参数恢复）。Re-key on lang so the shine
                animation restarts cleanly on EN/中 toggle. */}
            <p
              className="text-lg tracking-wide sm:text-xl"
              style={{
                fontFamily: 'Times, "Times New Roman", serif',
                fontWeight: 700,
              }}
            >
              <ShinyText
                key={`subtitle-${lang}`}
                text={t.subtitle}
                speed={3.2}
                delay={1}                    /* v3 per user: was 1.4 */
                color="#202a46"              /* v2: +20% brightness per user (was #1b233a) */
                shineColor="#e2f3fc"
                spread={95}
                shineWidth={39}              /* v2: +30% coverage per user (was 30, the original 35%-65% band) */
                direction="left"
                yoyo
                pauseOnHover
              />
            </p>
            <p
              className="text-sm leading-relaxed text-muted sm:text-base"
              style={{ fontFamily: 'Times, "Times New Roman", serif' }}
            >
              {t.body}
            </p>
          </motion.div>

          {/* divider line, slowly drawing */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.4, delay: 0.6, ease: "easeOut" }}
            className="mt-16 h-px w-32 origin-left bg-amber/40"
          />

          <motion.div
            key={`cta-${lang}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-8 flex items-center gap-6 font-mono text-xs uppercase tracking-[0.2em] text-muted"
          >
            <span className="flex items-center">
              <span className="mr-3 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber" />
              {t.soon}
            </span>
            <a
              href="/work"
              className="text-amber transition-colors hover:text-foreground"
            >
              Enter Universe →
            </a>
          </motion.div>
        </div>
      </main>

      {/* footer */}
      <footer className="relative z-10 flex flex-col items-start justify-between gap-3 px-6 py-6 sm:flex-row sm:items-center sm:px-12 sm:py-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          {t.footer}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          {t.cta}
        </span>
      </footer>

      {/* Scroll-darkening overlay — sits ABOVE all home content
          (z-50) and gradually blocks the LiquidChrome / hero as the
          user scrolls.  At 95% opacity the wheel handler routes to
          /work which continues the fade-out from full black. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 bg-black"
        style={{ opacity: progress, transition: "opacity 80ms linear" }}
      />
    </div>
  );
}
