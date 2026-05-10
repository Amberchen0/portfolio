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
  const [reveal, setReveal] = useState({ x: 0, y: 0, active: false });
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
            {/* Hover-reveal hotspot — cursor inside the gem area summons a small
                translucent crystal-clear amber lens, transforming the etching into
                real material under the cursor. */}
            <div
              className="absolute left-1/2 top-1/2"
              style={{
                width: "min(80%, 640px)",
                aspectRatio: "1 / 1",
                marginLeft: "calc(min(80%, 640px) / -2)",
                marginTop: "calc(min(80%, 640px) / -2)",
                zIndex: 2,
                pointerEvents: "auto",
              }}
              onPointerMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setReveal({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  active: true,
                });
              }}
              onPointerLeave={() => setReveal((r) => ({ ...r, active: false }))}
            >
              {/* Reveal layer: masked to a small circle around the cursor.
                  Inside the circle, the realistic amber photo shows; its black
                  background uses screen-blend so anything outside the gem shape
                  naturally stays unchanged (no fake square in the corners). */}
              <div
                className="absolute inset-0"
                style={{
                  WebkitMaskImage: `radial-gradient(circle 130px at ${reveal.x}px ${reveal.y}px, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 36%, rgba(0,0,0,0) 100%)`,
                  maskImage: `radial-gradient(circle 130px at ${reveal.x}px ${reveal.y}px, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 36%, rgba(0,0,0,0) 100%)`,
                  opacity: reveal.active ? 1 : 0,
                  transition: "opacity 0.45s ease",
                }}
              >
                <Image
                  src="/amber-real.png"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 80vw, 640px"
                  style={{ objectFit: "contain" }}
                />
              </div>
            </div>

            {/* Amber resin specimen — half size now, sits behind the signature */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2"
              style={{
                width: "min(80%, 640px)",
                aspectRatio: "1 / 1",
                marginLeft: "calc(min(80%, 640px) / -2)",
                marginTop: "calc(min(80%, 640px) / -2)",
                zIndex: 0,
              }}
              initial={{ opacity: 0, scale: 0.96, rotate: -1 }}
              animate={{
                opacity: [0, 0.82, 0.74, 0.82],
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
                sizes="(max-width: 768px) 80vw, 640px"
                style={{
                  objectFit: "contain",
                  // alpha PNG already strips background; subtle warm tint to fit palette
                  filter:
                    "sepia(0.18) hue-rotate(-8deg) saturate(1.05) brightness(1.05)",
                }}
              />
            </motion.div>

            {/* warm inner glow under the gem */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: "min(70%, 560px)",
                height: "min(70%, 560px)",
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse 60% 70% at 55% 50%, rgba(217,165,116,0.18), transparent 72%)",
                filter: "blur(36px)",
                zIndex: 0,
              }}
            />

            {/* Signature wordmark — replaces typed Amber Xu, sits on top so it's
                always readable even through the hover lens */}
            <h1
              className="relative"
              style={{ zIndex: 3, pointerEvents: "none" }}
            >
              <span className="sr-only">Amber Xu</span>
              <motion.div
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1.2, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                className="relative mx-auto"
                style={{
                  width: "min(100%, 880px)",
                  aspectRatio: "1536 / 1024",
                }}
              >
                <Image
                  src="/signature.png"
                  alt="Amber Xu"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 880px"
                  style={{ objectFit: "contain" }}
                />
              </motion.div>
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
