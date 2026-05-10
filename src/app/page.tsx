"use client";

import Image from "next/image";
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
            {/* Amber resin specimen — etched-line illustration, layered behind title.
                Black background of source image is killed by mix-blend-mode: screen,
                leaving only the white linework. A soft warm tint keeps it within the
                "cinematic dark + handcraft warmth" palette. */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                top: "-55%",
                left: "-25%",
                width: "min(160%, 1300px)",
                aspectRatio: "1 / 1",
                zIndex: 0,
              }}
              initial={{ opacity: 0, scale: 0.96, rotate: -1 }}
              animate={{
                opacity: [0, 0.85, 0.78, 0.85],
                scale: [0.96, 1, 1.015, 1],
                rotate: [-1, 0.6, -0.4, 0.6],
              }}
              transition={{
                opacity: {
                  duration: 9,
                  delay: 0.3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                },
                scale: {
                  duration: 11,
                  delay: 0.3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                },
                rotate: {
                  duration: 22,
                  delay: 0.3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                },
              }}
            >
              <Image
                src="/amber-hero.png"
                alt=""
                fill
                priority
                sizes="(max-width: 768px) 160vw, 1300px"
                style={{
                  objectFit: "contain",
                  mixBlendMode: "screen",
                  // gentle warm tint so the white linework reads as warm ivory instead of cold white
                  filter:
                    "sepia(0.22) hue-rotate(-8deg) saturate(1.1) brightness(1.02) contrast(1.04)",
                }}
              />
            </motion.div>

            {/* warm inner glow under the gem so it feels lit from within */}
            <div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                top: "0%",
                left: "10%",
                width: "70%",
                height: "100%",
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse 60% 70% at 55% 50%, rgba(217,165,116,0.18), transparent 72%)",
                filter: "blur(40px)",
                mixBlendMode: "screen",
                zIndex: 0,
              }}
            />

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
