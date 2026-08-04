"use client";

/**
 * CvBody — the unfurled-parchment frame around Amber's HTML résumé.
 *
 * Loads the right HTML file via iframe based on the shared useLang
 * store: /cv/zh.html for "zh", /cv/en.html for "en". On first paint
 * we look at sessionStorage["cv-arrived-via"] — if it's "scroll", the
 * visitor just clicked ResumeScroll on /about, so we play a brief
 * "continuation-of-unroll" entry animation (scaleY up + opacity in)
 * that feels like the rolled scroll unfurling onto this page. Any
 * other entry (direct URL hit, back-button, hard-reload) gets the
 * plain fade-in.
 *
 * Frame visual: a centred parchment-coloured panel with rounded
 * corners and a soft drop shadow, mimicking a freshly-unrolled sheet
 * of paper resting on the cosmic backdrop.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/useLang";

export default function CvBody() {
  const [lang] = useLang();
  const router = useRouter();
  const [arrivedViaScroll, setArrivedViaScroll] = useState(false);

  /* Action labels — bilingual to match the EN/中 toggle. The download
     anchor uses the `download` attribute pointing at the PDF (HTML
     pages can't be triggered to download nicely; the PDF in
     /public/Amber-Xu-CV.pdf is the canonical artefact). Close routes
     back to /about, which is where this page is reached from. */
  const closeLabel = lang === "zh" ? "关闭" : "Close";
  const downloadLabel = lang === "zh" ? "下载 PDF" : "Download PDF";

  useEffect(() => {
    try {
      const flag = window.sessionStorage.getItem("cv-arrived-via");
      if (flag === "scroll") {
        setArrivedViaScroll(true);
        // Consume the flag so a later hard-reload doesn't re-play
        // the unroll continuation.
        window.sessionStorage.removeItem("cv-arrived-via");
      }
    } catch {
      // sessionStorage may be unavailable — fall back to plain fade.
    }
  }, []);

  /* v2 per Amber (2026-08-01 resume 2.0 update): switched from two
     separate files (zh.html / en.html) to a single bilingual file
     resume.html that flips language via a ?lang= URL param — Amber's
     new résumé authors both languages in one document with `.t-zh` /
     `.t-en` toggle classes, so maintaining two forks of it doesn't
     make sense. The iframe still reloads on lang change (because src
     changes), so the résumé re-runs its init and reads the new param. */
  const cvHref = lang === "zh" ? "/cv/resume.html" : "/cv/resume.html?lang=en";

  /* Entry animation: pure CSS @keyframes auto-plays on mount, no
     React state involved. The earlier framer-motion path was stuck
     at opacity:0 in Next 16 + React 19, and the useState + CSS-
     transition fallback never re-rendered with `mounted=true` either
     (Strict-Mode double-invocation lost the setTimeout/rAF). A pure
     keyframe animation runs as soon as the browser paints the
     element — no JS state needed, can't be lost.
     Two animations defined inline below via <style jsx>-style block:
       cv-fade-in  (direct visit — slide up + fade)
       cv-unfurl-in (scroll arrival — scaleY unfurl + fade)
     The arrivedViaScroll flag picks which one to apply via className. */
  const animationClass = arrivedViaScroll ? "cv-anim-unfurl" : "cv-anim-fade";

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background px-4 pb-16 pt-28 sm:px-8 sm:pt-32">
      <style>{`
        @keyframes cv-fade-in {
          from {
            opacity: 0;
            transform: translateY(18px);
            filter: blur(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        @keyframes cv-unfurl-in {
          from {
            opacity: 0;
            transform: scaleY(0.06);
            filter: blur(6px);
          }
          to {
            opacity: 1;
            transform: scaleY(1);
            filter: blur(0);
          }
        }
        .cv-anim-fade {
          animation: cv-fade-in 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s both;
        }
        .cv-anim-unfurl {
          animation: cv-unfurl-in 0.85s cubic-bezier(0.2, 0.8, 0.2, 1) 0.05s both;
        }
      `}</style>
      <div
        className={`relative mx-auto w-full max-w-4xl ${animationClass}`}
        style={{ transformOrigin: "center center" }}
      >
        {/* Action chips floating above the parchment's top-right corner
            per Amber: Close (routes back to /about) + Download PDF
            (the canonical résumé artefact in /public/Amber-Xu-CV.pdf).
            Positioned absolutely so they sit on top of the panel's
            top-right edge without taking space inside the iframe. The
            chip style — translucent dark glass + Times mono caps —
            matches the TopNav vocabulary used elsewhere on the site. */}
        <div className="pointer-events-none absolute right-3 top-3 z-10 flex gap-2 sm:right-4 sm:top-4">
          <a
            href="/Amber-Xu-CV.pdf"
            download="Amber-Xu-CV.pdf"
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/85 backdrop-blur-sm transition-colors hover:bg-black/75 hover:text-white sm:text-xs"
            style={{ fontFamily: 'Times, "Times New Roman", serif' }}
            aria-label={downloadLabel}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{downloadLabel}</span>
          </a>
          <button
            type="button"
            onClick={() => router.push("/about")}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/85 backdrop-blur-sm transition-colors hover:bg-black/75 hover:text-white sm:text-xs"
            style={{ fontFamily: 'Times, "Times New Roman", serif' }}
            aria-label={closeLabel}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>{closeLabel}</span>
          </button>
        </div>

        {/* The "unfurled parchment" panel — warm cream background,
            rounded corners, deep shadow. Houses the iframe. Height
            is generous (the HTML CVs are tall documents and we'd
            rather let the iframe scroll internally than truncate). */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            backgroundColor: "#f4e6c9",
            boxShadow:
              "0 30px 80px rgba(0,0,0,0.55), 0 8px 20px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.18)",
            // Min height so the panel feels substantial even before
            // the iframe content paints. ~viewport height feels right
            // — the visitor sees one full sheet, scrolls for the rest.
            minHeight: "calc(100vh - 8rem)",
          }}
        >
          <iframe
            src={cvHref}
            title={lang === "zh" ? "Amber Xu 简历" : "Amber Xu Résumé"}
            className="block h-full w-full border-0"
            style={{
              // Match the panel's min-height so the iframe gets a real
              // height to lay out into; the panel's overflow:hidden
              // means anything taller scrolls inside the iframe.
              minHeight: "calc(100vh - 8rem)",
              backgroundColor: "transparent",
            }}
            /* Same-origin iframe so the parent can size it; no need
               for sandbox here since the HTML is our own content. */
          />
        </div>
      </div>
    </main>
  );
}
