"use client";

/**
 * /about — body block (essay + disciplines + footer).
 *
 * Kept as a Client Component so the EN/中 toggle can hold state.
 * The parent (src/app/about/page.tsx) stays a Server Component so its
 * `metadata` export still runs at build time for SEO.
 *
 * Text policy: the Chinese version is the source of truth — Amber
 * wrote those six paragraphs and asked they be used verbatim. The
 * English version is a faithful translation, not an independent
 * rewrite. Default lang is "zh" so on first open her own words load
 * (the page previously defaulted to EN, which hid her text behind a
 * toggle she didn't notice).
 *
 * Visual system intentionally matches the previous /about/page.tsx
 * that she liked — cream Times serif over the cosmic dark background,
 * `text-amber` (the desaturated blue defined in globals.css) for
 * accents, three-discipline grid at the bottom, contact + CV in the
 * footer rule.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import MetallicPaint from "@/components/MetallicPaint";

type Lang = "en" | "zh";

const copy = {
  zh: {
    eyebrow: "关于",
    name: "Amber Xu",
    // Six paragraphs the user provided. Paragraph 1 merges her opener
    // line "绘画是我理解世界的方式。" with the second sentence so it
    // doesn't get pulled out as a standalone display headline (per her
    // earlier feedback: don't shout the opener).
    paragraphs: [
      "绘画是我理解世界的方式。十余年的艺术学习与创作经历，让我习惯用图像去观察、记录那些难以被语言准确描述的东西——情绪、记忆、人与人之间微妙的联系，以及那些容易被忽略却足以打动人心的瞬间。",
      "如果说绘画是我的语言，那么本科教会我如何表达，硕士拓宽了我理解世界的维度，而社会则让我学会如何让这些表达真正产生价值。",
      "长期的学习、实践与现实磨砺，让我逐渐能够将天赋、审美、认知与表达能力整合起来，并运用于不同领域的创作与合作之中。从视觉设计到内容创作，从品牌传播到跨学科项目，我始终关注同一件事：如何将复杂的想法转化为清晰而有感染力的表达。",
      "我相信，技术可以通过练习获得，而认知决定创作能够抵达的高度。社会让我从一个有天赋的人，成长为一个懂得如何使用天赋的人。",
    ],
    // Closing pull quote (line 6 of her text)
    closing:
      "我依然是那个热爱创作的人，只是看待世界的坐标系变得更加丰富与复杂。",
    disciplines: [
      {
        label: "视觉艺术家",
        body: "绘画、色彩、跨媒介——以传统手作为根基。",
      },
      {
        label: "内容创作者",
        body: "图像、影像、编辑式叙事——让作品在 feed、画面与情绪中流动。",
      },
      {
        label: "概念设计师",
        body: "世界观、角色与视觉系统——面向影视、游戏与思辨项目。",
      },
    ],
    footerLeft: "悉尼 · 接受精选合作",
    contactLabel: "联系",
    cvLabel: "下载简历",
  },
  en: {
    eyebrow: "About",
    name: "Amber Xu",
    paragraphs: [
      "Drawing is my way of understanding the world. More than a decade of artistic study and practice have made images my natural way of observing and recording the things language can't quite hold — emotions, memories, the subtle bonds between people, and those easily overlooked moments that nonetheless move us.",
      "If drawing is my language, my bachelor's taught me how to express it; my master's broadened the dimensions through which I understand the world; and the years in the working world taught me how to make that expression land — how to give it real value.",
      "Long-running study, practice, and the friction of real-world work have gradually let me integrate talent, taste, cognition, and expression into a single working instrument — one I can bring to creation and collaboration across very different fields. From visual design to content creation, from brand communication to cross-disciplinary projects, I keep returning to the same question: how do you translate a complex idea into something clear, and something that moves a person.",
      "I believe craft can be earned through practice — but cognition decides how high a piece of work can reach. The working world took someone with raw ability and slowly turned her into someone who knows how to use it.",
    ],
    closing:
      "I am still the person who loves to create. Only the coordinate system through which I see the world has grown richer, more layered.",
    disciplines: [
      {
        label: "Visual Artist",
        body: "Drawing, painting, mixed-media — built on a foundation of traditional craft.",
      },
      {
        label: "Content Creator",
        body: "Photo, video, editorial narrative — work that lives in feed, frame, and feeling.",
      },
      {
        label: "Concept Designer",
        body: "Worlds, characters, and visual systems for film, game, and speculative projects.",
      },
    ],
    footerLeft: "Sydney · Available for select collaborations",
    contactLabel: "Get in touch",
    cvLabel: "Download CV",
  },
} as const;

export default function AboutBody() {
  const [lang, setLang] = useState<Lang>("zh");
  const t = copy[lang];

  return (
    <section className="mx-auto w-full max-w-3xl px-6 pb-24 pt-4 sm:px-12">
      {/* Eyebrow row: small caps label on the left, language toggle on
          the right. Same typographic rhythm as the home page nav. */}
      <div className="mb-3 flex items-center justify-between">
        <div
          className="font-mono text-xs uppercase tracking-[0.3em]"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          {t.eyebrow}
        </div>
        <nav
          aria-label="Language"
          className="font-mono text-xs uppercase tracking-[0.2em]"
        >
          <button
            onClick={() => setLang("en")}
            className={`transition-colors ${
              lang === "en"
                ? "text-amber"
                : "hover:text-white"
            }`}
            style={lang === "en" ? undefined : { color: "rgba(255,255,255,0.55)" }}
          >
            EN
          </button>
          <span className="mx-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            /
          </span>
          <button
            onClick={() => setLang("zh")}
            className={`transition-colors ${
              lang === "zh"
                ? "text-amber"
                : "hover:text-white"
            }`}
            style={lang === "zh" ? undefined : { color: "rgba(255,255,255,0.55)" }}
          >
            中
          </button>
        </nav>
      </div>

      {/* Page name treatment — same MetallicPaint "AMBER XU" block-
          letter wordmark used on the home page. Replaced the previous
          Times-serif h2 per Amber's note that she really liked the
          mixed-size capital logo and wanted it kept across the site.
          Visible h2 is sr-only so screen readers + crawlers still get
          a heading; the wordmark itself is a shader-rendered SVG so
          it has no live text. Shader params are intentionally
          identical to the home version so the identity reads the
          same. */}
      <h2 className="sr-only">{t.name}</h2>
      <motion.div
        initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.0, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative mx-auto mb-10"
        style={{
          width: "100%",
          maxWidth: "720px",
          /* About variant of the wordmark is single-row, so its SVG
             viewBox is 1400×500 — much wider than the home page's
             1400×1100. aspectRatio updated to match so the
             MetallicPaint surface frames the new shape. maxWidth
             bumped to 720 so the banner still feels substantial in
             the column. */
          aspectRatio: "1400 / 500",
        }}
      >
        <div className="absolute inset-0">
          {/* About-page variant of the wordmark — A and X are big, the
              trailing M B E R · U are uniformly smaller (drop-initial
              treatment). The home page still uses the original
              /amber-xu-block.svg with both rows at uniform size, so
              the two pages now have visually distinct masthead
              compositions. */}
          <MetallicPaint
            imageSrc="/amber-xu-block-initials.svg"
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

      {/* Body essay — paragraphs flow as one block. Chinese sets a
          slightly looser leading so 16/17 px CJK characters breathe. */}
      <div
        className="space-y-6 text-base leading-relaxed sm:text-lg"
        style={{
          color: "rgba(245,241,234,0.88)",
          lineHeight: lang === "zh" ? 1.95 : 1.7,
        }}
      >
        {t.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {/* Closing pull quote — italic serif, separated by a thin rule.
          Carries her closing line about the coordinate system. */}
      <div
        className="mt-12 pt-8"
        style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
      >
        <blockquote
          className="text-lg leading-relaxed sm:text-xl"
          style={{
            fontFamily: 'Times, "Times New Roman", serif',
            fontStyle: "italic",
            color: "#f5f1ea",
          }}
        >
          {t.closing}
        </blockquote>
      </div>

      {/* Three disciplines — kept from the previous design she liked.
          Labels use the muted-blue `text-amber` token from globals.css. */}
      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {t.disciplines.map((d) => (
          <div key={d.label}>
            <div className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-amber">
              {d.label}
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              {d.body}
            </p>
          </div>
        ))}
      </div>

      {/* Footer — Sydney line + CV download + contact link */}
      <div
        className="mt-16 flex flex-col gap-3 pt-6 font-mono text-xs uppercase tracking-[0.2em] sm:flex-row sm:items-center sm:justify-between"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.55)",
        }}
      >
        <span>{t.footerLeft}</span>
        <div className="flex items-center gap-6">
          <a
            href="/Amber-Xu-CV.pdf"
            target="_blank"
            rel="noopener"
            className="transition-colors hover:text-white"
          >
            {t.cvLabel} ↓
          </a>
          <a
            href="mailto:877793893@qq.com"
            className="text-amber transition-colors hover:text-white"
          >
            {t.contactLabel} →
          </a>
        </div>
      </div>
    </section>
  );
}
