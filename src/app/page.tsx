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
            {/* Amber gem — translucent, tilted, sitting behind "Xu" */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                // anchor near the second line ("Xu")
                top: "55%",
                left: "-4%",
                width: "min(82%, 780px)",
                aspectRatio: "1.55 / 1",
                transform: "rotate(-22deg)",
                borderRadius: "50%",
                // layered radial gradients = depth + specular + warm core + soft halo
                background: [
                  // sharp highlight (top-right inner)
                  "radial-gradient(ellipse 28% 22% at 72% 28%, rgba(255,238,200,0.95), rgba(255,220,160,0.4) 40%, transparent 70%)",
                  // mid warm body
                  "radial-gradient(ellipse 70% 80% at 55% 45%, rgba(217,165,116,0.78), rgba(184,132,63,0.45) 50%, transparent 78%)",
                  // deep amber core shadow (bottom-left)
                  "radial-gradient(ellipse 55% 60% at 35% 70%, rgba(120,62,22,0.55), transparent 70%)",
                  // outer soft bloom
                  "radial-gradient(ellipse 100% 100% at 50% 50%, rgba(217,165,116,0.18), transparent 75%)",
                ].join(", "),
                filter: "blur(1.5px)",
                mixBlendMode: "screen",
                zIndex: 0,
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: [0, 0.95, 0.85, 0.95],
                scale: [0.9, 1, 1.015, 1],
              }}
              transition={{
                opacity: {
                  duration: 8,
                  delay: 0.2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                },
                scale: {
                  duration: 9,
                  delay: 0.2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                },
              }}
            />
            {/* tiny specular sparkle on top edge of gem */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                top: "52%",
                left: "48%",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(255,250,230,0.95), rgba(255,240,200,0) 70%)",
                boxShadow: "0 0 16px 4px rgba(255,235,190,0.55)",
                zIndex: 0,
              }}
              animate={{ opacity: [0.5, 1, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
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
