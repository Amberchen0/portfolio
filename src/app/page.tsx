"use client";

import { motion } from "framer-motion";
import { useState } from "react";

type Lang = "en" | "zh";

const copy = {
  en: {
    eyebrow: "Portfolio · 2026",
    title: ["Amber", "Xu"],
    subtitle: "Multidisciplinary Visual Designer",
    body: "Crafting visual systems, motion, and interactive worlds — from stop-motion miniatures to cinematic interfaces.",
    soon: "The full archive is being assembled.",
    cta: "Selected works arriving soon.",
    footer: "Sydney · Available for select collaborations",
  },
  zh: {
    eyebrow: "作品集 · 2026",
    title: ["Amber", "Xu"],
    subtitle: "多领域视觉设计师",
    body: "构建视觉体系、动态影像与交互世界 —— 从手作微缩模型到电影感界面。",
    soon: "完整作品归档正在装配中。",
    cta: "精选作品即将上线。",
    footer: "悉尼 · 接受精选合作",
  },
} as const;

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const t = copy[lang];

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* warm ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 left-1/2 -z-10 h-[120vh] w-[120vh] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(217,165,116,0.18), rgba(184,132,63,0.06) 40%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-1/4 -right-1/4 -z-10 h-[80vh] w-[80vh] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(217,165,116,0.10), transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* top bar */}
      <header className="flex items-center justify-between px-6 py-6 sm:px-12 sm:py-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          AX · {new Date().getFullYear()}
        </span>
        <nav className="font-mono text-xs uppercase tracking-[0.2em]">
          <button
            onClick={() => setLang("en")}
            className={`transition-colors ${
              lang === "en" ? "text-amber" : "text-muted hover:text-foreground"
            }`}
          >
            EN
          </button>
          <span className="mx-2 text-muted/50">/</span>
          <button
            onClick={() => setLang("zh")}
            className={`transition-colors ${
              lang === "zh" ? "text-amber" : "text-muted hover:text-foreground"
            }`}
          >
            中
          </button>
        </nav>
      </header>

      {/* hero */}
      <main className="flex flex-1 flex-col justify-center px-6 sm:px-12">
        <div className="mx-auto w-full max-w-5xl">
          <motion.p
            key={`eyebrow-${lang}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8 font-mono text-xs uppercase tracking-[0.3em] text-muted"
          >
            {t.eyebrow}
          </motion.p>

          <div className="relative">
            {/* Amber gem — irregular organic blob, tilted top-left → bottom-right,
                spanning behind both "Amber" and "Xu" */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                // cover both lines of the h1
                top: "-12%",
                left: "-8%",
                width: "min(115%, 1000px)",
                height: "130%",
                transform: "rotate(18deg)",
                zIndex: 0,
              }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{
                opacity: [0, 0.92, 0.82, 0.92],
                scale: [0.92, 1, 1.012, 1],
              }}
              transition={{
                opacity: {
                  duration: 9,
                  delay: 0.2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                },
                scale: {
                  duration: 10,
                  delay: 0.2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                },
              }}
            >
              {/* Outer halo — soft warm bloom */}
              <div
                className="absolute inset-0"
                style={{
                  borderRadius: "58% 42% 48% 52% / 52% 60% 40% 48%",
                  background:
                    "radial-gradient(ellipse 80% 75% at 50% 50%, rgba(217,165,116,0.22), transparent 75%)",
                  filter: "blur(28px)",
                  mixBlendMode: "screen",
                }}
              />

              {/* Main body — organic blob, asymmetric radius */}
              <div
                className="absolute"
                style={{
                  inset: "10% 8% 10% 8%",
                  borderRadius: "62% 38% 55% 45% / 48% 58% 42% 52%",
                  background: [
                    // deep core shadow on lower-right (since we rotated 18deg, this anchors weight)
                    "radial-gradient(ellipse 55% 60% at 65% 70%, rgba(90,45,15,0.55), transparent 65%)",
                    // mid warm body
                    "radial-gradient(ellipse 75% 80% at 45% 45%, rgba(217,165,116,0.75), rgba(184,132,63,0.42) 50%, transparent 78%)",
                    // upper-left inner glow (light entering from above)
                    "radial-gradient(ellipse 35% 30% at 32% 28%, rgba(255,225,170,0.7), transparent 65%)",
                  ].join(", "),
                  filter: "blur(2px)",
                  mixBlendMode: "screen",
                }}
              />

              {/* Internal cloudy streak 1 — diagonal, faint */}
              <div
                className="absolute"
                style={{
                  top: "32%",
                  left: "20%",
                  width: "55%",
                  height: "12%",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(ellipse, rgba(255,220,170,0.18), transparent 70%)",
                  filter: "blur(8px)",
                  transform: "rotate(-8deg)",
                  mixBlendMode: "screen",
                }}
              />

              {/* Internal cloudy streak 2 — opposite diagonal */}
              <div
                className="absolute"
                style={{
                  top: "55%",
                  left: "30%",
                  width: "45%",
                  height: "8%",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(ellipse, rgba(140,75,30,0.35), transparent 70%)",
                  filter: "blur(10px)",
                  transform: "rotate(6deg)",
                  mixBlendMode: "multiply",
                }}
              />

              {/* Specular highlight 1 — large soft glow upper-left */}
              <div
                className="absolute"
                style={{
                  top: "18%",
                  left: "28%",
                  width: "18%",
                  height: "14%",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(255,245,215,0.85), rgba(255,235,190,0) 70%)",
                  filter: "blur(4px)",
                  mixBlendMode: "screen",
                }}
              />

              {/* Specular sparkle 2 — small sharp dot near upper-left edge */}
              <motion.div
                className="absolute"
                style={{
                  top: "22%",
                  left: "34%",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(255,250,235,1), rgba(255,240,200,0) 70%)",
                  boxShadow: "0 0 18px 4px rgba(255,235,190,0.6)",
                }}
                animate={{ opacity: [0.4, 1, 0.5] }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Specular sparkle 3 — tiny secondary near right side */}
              <motion.div
                className="absolute"
                style={{
                  top: "48%",
                  left: "72%",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "rgba(255,245,220,0.9)",
                  boxShadow: "0 0 10px 2px rgba(255,225,180,0.5)",
                }}
                animate={{ opacity: [0.3, 0.85, 0.3] }}
                transition={{
                  duration: 6,
                  delay: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            <h1
              className="relative font-serif text-[clamp(3.5rem,12vw,11rem)] leading-[0.9] tracking-tight"
              style={{
                fontFamily: "'Cormorant Garamond', 'Times New Roman', serif",
                zIndex: 1,
              }}
            >
              <motion.span
                key={`l1-${lang}`}
                initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                className="block italic"
              >
                {t.title[0]}
              </motion.span>
              <motion.span
                key={`l2-${lang}`}
                initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.9, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
                className="block text-amber"
                style={{
                  // subtle warm shadow so text reads cleanly against the gem
                  textShadow:
                    "0 2px 30px rgba(10,8,7,0.55), 0 0 1px rgba(10,8,7,0.6)",
                }}
              >
                {t.title[1]}
              </motion.span>
            </h1>
          </div>

          <motion.div
            key={`body-${lang}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 max-w-xl space-y-4"
          >
            <p className="text-lg font-light tracking-wide text-foreground/90 sm:text-xl">
              {t.subtitle}
            </p>
            <p className="text-sm leading-relaxed text-muted sm:text-base">
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
            className="mt-8 font-mono text-xs uppercase tracking-[0.2em] text-muted"
          >
            <span className="mr-3 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber" />
            {t.soon}
          </motion.div>
        </div>
      </main>

      {/* footer */}
      <footer className="flex flex-col items-start justify-between gap-3 px-6 py-6 sm:flex-row sm:items-center sm:px-12 sm:py-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          {t.footer}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          {t.cta}
        </span>
      </footer>
    </div>
  );
}
