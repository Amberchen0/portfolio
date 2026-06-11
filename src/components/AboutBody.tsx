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

import { motion } from "framer-motion";
import MetallicPaint from "@/components/MetallicPaint";
import ResumeScroll from "@/components/ResumeScroll";
import { useLang } from "@/lib/useLang";

type Lang = "en" | "zh";

const copy = {
  zh: {
    eyebrow: "关于",
    name: "Amber Xu",
    // Five paragraphs. The final paragraph (was 4) now absorbs the
    // closing line that previously lived as a separate italic pull
    // quote — per Amber's note, the two sentences read as one
    // continuous thought and should not be visually split.
    paragraphs: [
      "绘画是我理解世界的方式。十余年的艺术学习与创作经历，让我习惯用图像去观察、记录那些难以被语言准确描述的东西——情绪、记忆、人与人之间微妙的联系，以及那些容易被忽略却足以打动人心的瞬间。",
      "如果说绘画是我的语言，那么本科教会我如何表达，硕士拓宽了我理解世界的维度，而社会则让我学会如何让这些表达真正产生价值。",
      "长期的学习、实践与现实磨砺，让我逐渐能够将天赋、审美、认知与表达能力整合起来，并运用于不同领域的创作与合作之中。从视觉设计到内容创作，从品牌传播到跨学科项目，我始终关注同一件事：如何将复杂的想法转化为清晰而有感染力的表达。",
      "我相信，技术可以通过练习获得，而认知决定创作能够抵达的高度。社会让我从一个有天赋的人，成长为一个懂得如何使用天赋的人。我依然是那个热爱创作的人，只是看待世界的坐标系变得更加丰富与复杂。",
    ],
    disciplines: [
      {
        label: "视觉艺术家",
        body: "绘画、色彩、跨媒介——以传统手作为根基。",
      },
      {
        label: "内容创作者",
        body: "图像、影像、编辑式叙事——让作品在信息流、画面与情绪中流动。",
      },
      {
        label: "概念设计师",
        body: "世界观、角色与视觉系统——面向影视、游戏与思辨项目。",
      },
    ],
    footerLeft: "悉尼 · 接受精选合作",
    contactLabel: "联系",
    cvLabel: "下载简历",
    ctaCaption: "了解更多请查看简历",   /* v14 per user: 替代原本的 [下载简历↓][联系→] 双按钮 */
  },
  en: {
    eyebrow: "About",
    name: "Amber Xu",
    paragraphs: [
      "Drawing is my way of understanding the world. More than a decade of artistic study and practice have made images my natural way of observing and recording the things language can't quite hold — emotions, memories, the subtle bonds between people, and those easily overlooked moments that nonetheless move us.",
      "If drawing is my language, my bachelor's taught me how to express it; my master's broadened the dimensions through which I understand the world; and the years in the working world taught me how to make that expression land — how to give it real value.",
      "Long-running study, practice, and the friction of real-world work have gradually let me integrate talent, taste, cognition, and expression into a single working instrument — one I can bring to creation and collaboration across very different fields. From visual design to content creation, from brand communication to cross-disciplinary projects, I keep returning to the same question: how do you translate a complex idea into something clear, and something that moves a person.",
      "I believe craft can be earned through practice — but cognition decides how high a piece of work can reach. The working world took someone with raw ability and slowly turned her into someone who knows how to use it. I am still the person who loves to create — only the coordinate system through which I see the world has grown richer, more layered.",
    ],
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
    ctaCaption: "For more, see the CV",   /* v14 EN counterpart */
  },
} as const;

export default function AboutBody() {
  // Language reads from the shared store — the EN/中 toggle now lives
  // inside the TopNav glass capsule, so this body component is a pure
  // subscriber (no setLang call here). The previous in-page eyebrow
  // row (the "About" small-caps label on the left + EN/中 nav on the
  // right) was removed per Amber, since the wordmark below already
  // carries the page identity and TopNav already carries the lang
  // switch — both controls were duplicated chrome.
  const [lang] = useLang();
  const t = copy[lang];

  return (
    <section className="mx-auto w-full max-w-4xl px-6 pb-24 pt-4 sm:px-12">{/* v13 per Amber: ResumeScroll moved INSIDE this section (in-flow under the footer) instead of `fixed` floating at the viewport bottom, so the giant pb-[450px] safety-clearance is no longer needed — back to pb-24. The `contents` wrapper that used to host the two siblings (section + ResumeScroll) is gone too. */}
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
          /* v4: single-row AMBER XU but with generous viewBox padding
             (2:1, was 3.56:1) so the rendering doesn't read as a flat
             banner. The padding adds vertical breathing room without
             distorting letters. */
          maxWidth: "800px",                /* v11 per user: 650→800px (+23%, ~两档字号), 父 section 同步放宽到 max-w-4xl 才能容纳 */
          aspectRatio: "2000 / 720",        /* v13 per user "只增加高度，其他变量不动": aspectRatio 分母 560→720 (+28.6%) → canvas 物理高度 800 × 720/2000 = 288px (was 224px). preserveAspectRatio="xMidYMid meet" 保持，SVG 仍按宽度铺满 (800×224 不变)，多出来的 64px 作为上下 vertical margin。maxWidth/viewBox/transform/scaleX/scaleY/font-size 全部不动。 */
        }}
      >
        <div className="absolute inset-0">
          {/* v2 per Amber — full prop set replaced with the React Bits
              "Paper Liquid Metal" demo config Amber pasted. Big
              differences vs v1 (canonical chrome-blue):
                • Colours: lightColor #cdc8e1 → #f1f9ff (almost-white
                  cyan highlights); darkColor #031943 → #3e1bbf
                  (vibrant violet/purple core); tintColor #a3ccf5 →
                  #5d91c4 (mid steel-blue tint).
                • angle 0 → 149° — the metallic flow direction
                  rotates almost 90° (now bottom-left → top-right).
                • mouseAnimation off — wordmark no longer responds
                  to cursor; static animated flow only.
                • Much slower drift: speed 0.36 → 0.12.
                • Smoother surface: noiseScale 2 → 0.5,
                  waveAmplitude 1.3 → 0.3, refraction 0.048 → 0.017,
                  blur 0.016 → 0.017.
                • More liquid distortion: distortion 0.45 → 0.9.
              Home page (src/app/page.tsx) MetallicPaint is NOT
              touched — these prop changes are scoped to /about only. */}
          <MetallicPaint
            imageSrc="/amber-xu-block-row.svg"
            seed={27.07}
            scale={2}
            patternSharpness={0.4}
            noiseScale={0.5}
            speed={0.12}
            liquid={0.86}
            mouseAnimation={false}
            brightness={2}
            contrast={0.5}
            refraction={0.017}
            blur={0.017}
            chromaticSpread={2.1}
            fresnel={1.9}
            angle={149}
            waveAmplitude={0.3}
            distortion={0.9}
            contour={0.8}
            lightColor="#f1f9ff"
            darkColor="#3e1bbf"
            tintColor="#5d91c4"
          />
        </div>
      </motion.div>

      {/* Contact strip — email + phone (and Instagram once Amber
          provides the handle), set above the self-portrait essay per
          her note. Mono small-caps with vertical pipe separators,
          centred in the column; visually quiet so it doesn't compete
          with the wordmark above or the essay below. */}
      <div
        className="mb-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm"
        style={{
          color: "rgba(255,255,255,0.55)",
          fontFamily: 'Times, "Times New Roman", serif',
        }}
      >
        <a
          href="mailto:877793893@qq.com"
          className="transition-colors hover:text-white"
        >
          877793893@qq.com
        </a>
        <span style={{ color: "rgba(255,255,255,0.25)" }}>|</span>
        <a
          href="tel:+61424943415"
          className="transition-colors hover:text-white"
        >
          +61 4249 43415
        </a>
        {/* Instagram slot — uncomment + fill the handle once Amber
            confirms the @username. Keeping the markup parked here so
            the pipe-separator pattern is obvious to extend.

            <span style={{ color: "rgba(255,255,255,0.25)" }}>|</span>
            <a
              href="https://instagram.com/<handle>"
              target="_blank"
              rel="noopener"
              className="transition-colors hover:text-white"
            >
              @<handle>
            </a>
        */}
      </div>

      {/* Body essay — paragraphs flow as one block. The closing line
          ("我依然是那个热爱创作的人……" / "I am still the person who
          loves to create…") used to live as a separate italic pull
          quote below a rule; per Amber it now lives as the tail of
          paragraph 4 so the thought reads continuous. Chinese sets a
          slightly looser leading so 16/17 px CJK characters breathe. */}
      <div
        className="space-y-6 text-base leading-relaxed sm:text-lg"
        style={{
          color: "rgba(245,241,234,0.88)",
          lineHeight: lang === "zh" ? 1.95 : 1.7,
          fontFamily: 'Times, "Times New Roman", serif',   /* v12 per user: 正文也用 Times，统一全页字体 */
        }}
      >
        {t.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {/* Three disciplines — kept from the previous design she liked.
          Labels use the muted-blue `text-amber` token from globals.css. */}
      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {t.disciplines.map((d) => (
          <div key={d.label}>
            <div
              className="mb-2 text-xs uppercase tracking-[0.2em] text-amber"
              style={{ fontFamily: 'Times, "Times New Roman", serif' }}
            >
              {d.label}
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{
                color: "rgba(255,255,255,0.7)",
                fontFamily: 'Times, "Times New Roman", serif',   /* v12 per user: discipline 描述也 Times */
              }}
            >
              {d.body}
            </p>
          </div>
        ))}
      </div>

      {/* v16 per Amber: removed the line-art "offer document + 了解更多请
          查看简历" CTA that used to live here. The CV entry is now the
          floating wax-sealed parchment scroll rendered below (the
          ResumeScroll component), which acts as the single CV access
          point and routes to the new /cv React page on click. */}

      {/* Footer rule — Sydney availability line, sits under the horizontal
          divider (the buttons that used to live up here moved into the CTA
          block above). */}
      <div
        className="mt-10 pt-6 text-xs uppercase tracking-[0.2em]"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.55)",
          fontFamily: 'Times, "Times New Roman", serif',
        }}
      >
        <span>{t.footerLeft}</span>
      </div>

      {/* Rolled-parchment-with-wax-seal CTA. v13 per Amber: moved
          INTO the section, in normal document flow, directly after
          the Sydney footer line. Its own component supplies the
          top/bottom margins, hover bob, click-to-unroll animation,
          and /cv route push. */}
      <ResumeScroll />
    </section>
  );
}
