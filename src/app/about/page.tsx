import type { Metadata } from "next";
import Link from "next/link";

const ABOUT_DESC =
  "Amber Xu — multidisciplinary visual designer. Animation, brand, AI-augmented production. UTS Animation Production + UMelb Global Media Communication. Based in Sydney / Melbourne.";

export const metadata: Metadata = {
  title: "About",
  description: ABOUT_DESC,
  openGraph: {
    title: "About — Amber Xu",
    description: ABOUT_DESC,
    url: "/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "About — Amber Xu",
    description: ABOUT_DESC,
  },
};

/** Compact section divider used between each block. The label sits in
 *  the middle of a thin line — gives the page a chapter-like cadence
 *  without using heavy h2/h3 typography. */
function SectionRule({ label }: { label?: string }) {
  return (
    <div className="my-16 flex items-center gap-6 text-amber/70">
      <span className="h-px flex-1 bg-amber/20" />
      {label ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.4em]">
          {label}
        </span>
      ) : null}
      <span className="h-px flex-1 bg-amber/20" />
    </div>
  );
}

function SkillColumn({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-amber">
        {title}
      </h3>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Experience({
  date,
  role,
  company,
  note,
}: {
  date: string;
  role: string;
  company: string;
  note: string;
}) {
  return (
    <div className="border-l border-amber/20 pl-5">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-lg text-foreground">{role}</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {date}
        </span>
      </div>
      <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-amber/80">
        {company}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{note}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Ambient gradient — same palette discipline as the rest of the site:
          cool violet/blue washes + one amber bloom at the bottom centre
          (the sun, repeated as a tonal echo on this page). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 20% 10%, rgba(167, 139, 250, 0.08), transparent 60%),
            radial-gradient(ellipse 60% 40% at 85% 30%, rgba(96, 165, 250, 0.06), transparent 60%),
            radial-gradient(ellipse 80% 50% at 50% 105%, rgba(217, 165, 116, 0.08), transparent 60%)
          `,
        }}
      />

      {/* Back to Universe — same white pill the project HTMLs use, kept
          consistent so the nav grammar is identical everywhere. */}
      <Link
        href="/work"
        className="fixed left-5 top-5 z-50 inline-flex items-center rounded-full border border-white/25 bg-black/40 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/75 backdrop-blur transition hover:border-white/60 hover:text-white focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        ← Universe
      </Link>

      <article className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
        {/* ──────── HERO: photo + identity ──────── */}
        <header className="flex flex-col items-center text-center">
          {/* og-default.jpg doubles as the About portrait. Cool-tone filter
              + tight amber ring tucks the cap+gown photo into the site
              palette instead of letting it sit as a foreign element. */}
          <div className="relative mb-10 h-44 w-44 overflow-hidden rounded-full ring-1 ring-amber/40 sm:h-52 sm:w-52">
            <div
              className="h-full w-full bg-cover bg-center"
              style={{
                backgroundImage: "url(/og-default.jpg)",
                filter: "saturate(0.85) hue-rotate(-8deg)",
              }}
            />
            {/* Cool wash on top so the photo reads with the cosmic palette */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(96,165,250,0.10), rgba(167,139,250,0.10))",
              }}
            />
          </div>

          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            About
          </p>
          <h1 className="font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
            Amber Xu&nbsp;&nbsp;
            <span className="text-3xl text-amber sm:text-4xl">徐&nbsp;晨</span>
          </h1>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.32em] text-amber">
            Multidisciplinary Visual Designer
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Brand · Animation · AI&nbsp;&nbsp;·&nbsp;&nbsp;Sydney / Melbourne
          </p>
        </header>

        {/* ──────── NARRATIVE ──────── */}
        <SectionRule label="Ten Years" />

        <section className="space-y-7 text-[15px] leading-[1.85] text-foreground/90">
          <p>
            Ten years of drawing, ten years of looking, ten years of figuring
            out what makes something stay with someone — and then trying again.
          </p>
          <p>
            Animation Production at UTS taught me{" "}
            <em className="not-italic text-amber">how to make</em> — the craft
            of figure, mood, light, the patience of frame-by-frame. Global
            Media Communication at Melbourne taught me{" "}
            <em className="not-italic text-amber">how work travels</em> —
            across audiences, platforms, languages, contexts. The practice
            through and since both degrees — brand visual, soft furnishing,
            AI-augmented production, art department, independent projects —
            has taught me{" "}
            <em className="not-italic text-amber">
              how an idea actually becomes real
            </em>
            : through strategy, delivery, and the willingness to learn the next
            tool.
          </p>
          <p>
            What pulls me across every medium is the same instinct:{" "}
            <strong className="font-semibold text-foreground">
              to keep beating my last attempt.
            </strong>{" "}
            To refine until the work breathes. To outrun who I was last year,
            and again the year after. Chinese traditional motifs anchor
            everything I make; the rest is play.
          </p>
        </section>

        <section className="mt-10 space-y-5 border-l-2 border-amber/40 pl-6 font-serif text-[15px] leading-[1.95] text-muted-foreground">
          <p>
            十年画画，十年看世界，十年在琢磨"什么样的东西会留在人心里"——
            然后再试一遍。
          </p>
          <p>
            悉尼科技大学的动画专业教我
            <span className="text-amber">如何制作</span>
            —— 素描的形、动画的情绪、光与节奏、一帧一帧的耐心。墨尔本大学全球媒体传播硕士教我
            <span className="text-amber">作品如何抵达</span> ——
            穿越人群、平台、语言、语境。两段学业期间和毕业以来的实践
            —— 品牌视觉、软装设计、AI 生产、影视美术、独立项目 —— 教我
            <span className="text-amber">一个想法如何真正落地</span>
            ：靠策略、靠交付、靠愿意去学下一个工具。
          </p>
          <p>
            真正贯穿这一切的是同一种本能：
            <strong className="font-semibold text-foreground">
              不断超越自己上一次的水准
            </strong>
            。打磨到作品自己在呼吸。要跑赢去年的自己，再跑赢一年后的自己。中国传统是图像的锚，其余是玩法。
          </p>
        </section>

        {/* ──────── HOW I WORK · three principles ──────── */}
        <SectionRule label="How I Work" />

        <ul className="space-y-4 text-center font-serif text-2xl leading-tight tracking-tight text-foreground/90 sm:text-3xl">
          <li>Atmosphere over event.</li>
          <li>Beauty next to threat.</li>
          <li>Slow attention to detail.</li>
        </ul>
        <p className="mt-6 text-center text-sm italic text-muted-foreground">
          氛围先于事件 · 美与威胁并置 · 对细节的慢注视
        </p>

        {/* ──────── WHAT I MAKE · 4-column skill grid ──────── */}
        <SectionRule label="What I Make" />

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <SkillColumn
            title="Image 影像"
            items={[
              "Photography 摄影",
              "Illustration 插画",
              "Drawing 素描",
              "Watercolour · Oil",
              "Digital Painting",
            ]}
          />
          <SkillColumn
            title="Story 叙事"
            items={[
              "Character & World Design",
              "2D / 3D Animation",
              "Stop-motion",
              "Storyboard",
              "Set Design",
            ]}
          />
          <SkillColumn
            title="Brand 品牌"
            items={[
              "Visual Identity",
              "Campaign",
              "Content Strategy",
              "Cross-platform Comm",
            ]}
          />
          <SkillColumn
            title="Tech 技术"
            items={[
              "AI Workflows (LoRA, prompt)",
              "Three.js / R3F",
              "After Effects · DaVinci · Premiere",
              "Maya · Zbrush · Harmony",
            ]}
          />
        </div>

        {/* ──────── SELECTED EXPERIENCE · 4 highlights ──────── */}
        <SectionRule label="Selected Experience" />

        <div className="space-y-7">
          <Experience
            date="2025 · 07 — 09"
            role="Creative Designer"
            company="OperEase Intelligent AI · Hangzhou"
            note="Led core UI for an AI-business platform; introduced AI tools into the production pipeline, sharpened visual expression at pace. Project recognised as an Outstanding AI Project by Yuhang District, Hangzhou."
          />
          <Experience
            date="2026 · 03 — 05"
            role="Pre-sale Soft Furnishing Designer"
            company="Australia · Property Staging"
            note="Spatial planning, colour, atmosphere for pre-sale homes; AI-assisted visualisation to compress concept-to-client sign-off cycles. Sourcing and on-site execution from brief to install."
          />
          <Experience
            date="2024 · 1 mo"
            role="Art Department Assistant"
            company="Australian Short-Drama Production"
            note="On-set set construction & dressing under the art director's direction; props logistics across shoot days with visual continuity across cuts."
          />
          <Experience
            date="6 mo"
            role="Account Manager"
            company="EC Markets / Vatee Capital"
            note="Cross-platform client acquisition (~90 new clients/month, USD 10k monthly funded target). Designed CFD-competition visual campaign — strategy + posters end-to-end."
          />
        </div>

        {/* ──────── EDUCATION ──────── */}
        <SectionRule label="Education" />

        <div className="space-y-7">
          <div>
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-serif text-lg text-foreground">
                Master of Global Media Communication
              </h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                2023 — 2024
              </span>
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber/80">
              The University of Melbourne
            </div>
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-serif text-lg text-foreground">
                Bachelor of Animation Production
              </h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                2018 — 2022
              </span>
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber/80">
              University of Technology Sydney · WAM 78
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Distinctions across 2D &amp; 3D Animation · Animation Studio ·
              Life Drawing · Introduction to Photography.
            </p>
          </div>
        </div>

        {/* ──────── ANCHOR · the corner line, echoing her old CV's voice ──────── */}
        <SectionRule />

        <blockquote className="my-4 text-center font-serif italic text-foreground/80">
          <p className="text-xl sm:text-2xl">
            &ldquo;Surprises live in the corners.&rdquo;
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            惊奇藏在角落的细微之处
          </p>
        </blockquote>

        {/* ──────── CONTACT ──────── */}
        <SectionRule label="Contact" />

        <div className="space-y-3 text-center">
          <a
            href="mailto:877793893@qq.com"
            className="block font-mono text-sm tracking-wide text-amber transition hover:text-foreground focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
          >
            877793893@qq.com
          </a>
          <a
            href="https://amberxu.vercel.app"
            className="block font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground transition hover:text-foreground"
          >
            amberxu.vercel.app
          </a>
        </div>

        {/* Footer breathing room */}
        <div className="h-16" />
      </article>
    </main>
  );
}
