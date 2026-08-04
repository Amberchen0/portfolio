"use client";

/**
 * DotField — React Bits canonical component, ported to TSX.
 *
 * Renders a regular grid of small dots on a 2D canvas, filled with a
 * top-left → bottom-right linear gradient. Tracks the page-level
 * mouse: when the cursor enters the container and moves with enough
 * speed, nearby dots get pushed outward (bulge mode) and a soft
 * radial SVG glow follows the cursor. Default colour palette is
 * purple lavender + dark glow — the demo Amber sent.
 *
 * Sized 100% × 100% of its parent — wrap it in a positioned
 * container (the `<div className="absolute inset-0">` inside the
 * hero motion.div already does this).
 *
 * Behaviour preserved verbatim from the React Bits JS reference:
 * - DPR clamping at 2× to keep mobile GPU happy
 * - 100ms resize debounce
 * - 20ms mouse-speed sampling interval
 * - same engagement + glow-opacity easing constants (0.06, 0.08)
 * - same dot easing (0.15 bulge, 0.10 settle)
 * - same sparkle 3% hit rate (when sparkle=true)
 * The only changes from the JS source are TypeScript types.
 */

import { useEffect, useRef, memo, useId, type CSSProperties, type ComponentPropsWithoutRef } from "react";
import "./DotField.css";

const TWO_PI = Math.PI * 2;

interface Dot {
  ax: number; // anchor x
  ay: number; // anchor y
  sx: number; // smoothed x
  sy: number; // smoothed y
  vx: number; // velocity x
  vy: number; // velocity y
  x: number;  // target x (non-bulge mode)
  y: number;  // target y
}

interface MouseState {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  speed: number;
}

interface SizeState {
  w: number;
  h: number;
  offsetX: number;
  offsetY: number;
}

export interface DotFieldProps extends Omit<ComponentPropsWithoutRef<"div">, "ref"> {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
  /**
   * Marker geometry for each grid point.
   * - "circle" (default) keeps the original ctx.arc() rendering.
   * - "square" swaps to ctx.rect() with the same "radius" reinterpreted
   *   as half-side; a square with rad=6 is a 12×12 px marker occupying
   *   roughly the same visual footprint as a rad=6 circle.
   * Grid layout, bulge, wave, and cursor interaction stay identical
   * between shapes — this only changes what each marker looks like.
   */
  shape?: "circle" | "square";
}

const DotField = memo(({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 500,
  cursorForce = 0.1,
  bulgeOnly = true,
  bulgeStrength = 67,
  glowRadius = 160,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = "rgba(168, 85, 247, 0.35)",
  gradientTo = "rgba(180, 151, 207, 0.25)",
  glowColor = "#120F17",
  shape = "circle",
  ...rest
}: DotFieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const glowRef = useRef<SVGCircleElement | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef<MouseState>({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 });
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef<SizeState>({ w: 0, h: 0, offsetX: 0, offsetY: 0 });
  const glowOpacity = useRef<number>(0);
  const engagement = useRef<number>(0);
  const propsRef = useRef<{
    dotRadius: number;
    dotSpacing: number;
    cursorRadius: number;
    cursorForce: number;
    bulgeOnly: boolean;
    bulgeStrength: number;
    sparkle: boolean;
    waveAmplitude: number;
    gradientFrom: string;
    gradientTo: string;
    shape: "circle" | "square";
  }>({
    dotRadius, dotSpacing, cursorRadius, cursorForce, bulgeOnly, bulgeStrength, sparkle, waveAmplitude, gradientFrom, gradientTo, shape,
  });
  propsRef.current = {
    dotRadius, dotSpacing, cursorRadius, cursorForce, bulgeOnly, bulgeStrength, sparkle, waveAmplitude, gradientFrom, gradientTo, shape,
  };
  const rebuildRef = useRef<(() => void) | null>(null);
  /* useId() guarantees a deterministic, SSR-safe unique ID per
     component instance. React Bits' JS reference seeded it with
     Math.random() which breaks hydration on Next.js — server-rendered
     HTML carries one random ID, client hydration generates another,
     React flags a mismatch. useId() resolves to the same string on
     both sides. We still namespace it so multiple DotFields on the
     same page don't collide and the SVG <radialGradient> reference
     stays a valid CSS selector (useId can include `:` which is
     fine for `id` attrs but ugly to debug — prefix keeps it readable). */
  const reactId = useId();
  const glowIdRef = useRef<string>(`dot-field-glow-${reactId.replace(/[:]/g, "")}`);

  useEffect(() => {
    const canvas = canvasRef.current;
    const glowEl = glowRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let resizeTimer: ReturnType<typeof setTimeout>;

    function resize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(doResize, 100);
    }

    function doResize() {
      if (!canvas || !canvas.parentElement || !ctx) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      sizeRef.current = {
        w,
        h,
        offsetX: rect.left + window.scrollX,
        offsetY: rect.top + window.scrollY,
      };

      buildDots(w, h);
    }

    function buildDots(w: number, h: number) {
      const p = propsRef.current;
      const step = p.dotRadius + p.dotSpacing;
      const cols = Math.floor(w / step);
      const rows = Math.floor(h / step);
      const padX = (w % step) / 2;
      const padY = (h % step) / 2;
      const dots: Dot[] = new Array(rows * cols);
      let idx = 0;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ax = padX + col * step + step / 2;
          const ay = padY + row * step + step / 2;
          dots[idx++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
        }
      }
      dotsRef.current = dots;
    }

    function onMouseMove(e: MouseEvent) {
      const s = sizeRef.current;
      mouseRef.current.x = e.pageX - s.offsetX;
      mouseRef.current.y = e.pageY - s.offsetY;
    }

    function updateMouseSpeed() {
      const m = mouseRef.current;
      const dx = m.prevX - m.x;
      const dy = m.prevY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      m.speed += (dist - m.speed) * 0.5;
      if (m.speed < 0.001) m.speed = 0;
      m.prevX = m.x;
      m.prevY = m.y;
    }

    const speedInterval = setInterval(updateMouseSpeed, 20);

    let frameCount = 0;

    function tick() {
      frameCount++;
      const dots = dotsRef.current;
      const m = mouseRef.current;
      const { w, h } = sizeRef.current;
      const p = propsRef.current;
      const len = dots.length;
      const t = frameCount * 0.02;

      const targetEngagement = Math.min(m.speed / 5, 1);
      engagement.current += (targetEngagement - engagement.current) * 0.06;
      if (engagement.current < 0.001) engagement.current = 0;
      const eng = engagement.current;

      glowOpacity.current += (eng - glowOpacity.current) * 0.08;

      if (glowEl) {
        glowEl.setAttribute("cx", String(m.x));
        glowEl.setAttribute("cy", String(m.y));
        glowEl.style.opacity = String(glowOpacity.current);
      }

      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, p.gradientFrom);
      grad.addColorStop(1, p.gradientTo);
      ctx.fillStyle = grad;

      const cr = p.cursorRadius;
      const crSq = cr * cr;
      const rad = p.dotRadius / 2;
      const isBulge = p.bulgeOnly;

      ctx.beginPath();

      for (let i = 0; i < len; i++) {
        const d = dots[i];
        const dx = m.x - d.ax;
        const dy = m.y - d.ay;
        const distSq = dx * dx + dy * dy;

        if (distSq < crSq && eng > 0.01) {
          const dist = Math.sqrt(distSq);
          if (isBulge) {
            const k = 1 - dist / cr;
            const push = k * k * p.bulgeStrength * eng;
            const angle = Math.atan2(dy, dx);
            d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
            d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
          } else {
            const angle = Math.atan2(dy, dx);
            const move = (500 / dist) * (m.speed * p.cursorForce);
            d.vx += Math.cos(angle) * -move;
            d.vy += Math.sin(angle) * -move;
          }
        } else if (isBulge) {
          d.sx += (d.ax - d.sx) * 0.1;
          d.sy += (d.ay - d.sy) * 0.1;
        }

        if (!isBulge) {
          d.vx *= 0.9;
          d.vy *= 0.9;
          d.x = d.ax + d.vx;
          d.y = d.ay + d.vy;
          d.sx += (d.x - d.sx) * 0.1;
          d.sy += (d.y - d.sy) * 0.1;
        }

        let drawX = d.sx;
        let drawY = d.sy;
        if (p.waveAmplitude > 0) {
          drawY += Math.sin(d.ax * 0.03 + t) * p.waveAmplitude;
          drawX += Math.cos(d.ay * 0.03 + t * 0.7) * p.waveAmplitude * 0.5;
        }

        /* Shape branch: circle uses ctx.arc(), square uses ctx.rect().
           `rad` is reused verbatim as "half-side" for square so a rad=6
           square ends up 12×12 px — same footprint as a rad=6 circle. */
        const isSquare = p.shape === "square";
        if (p.sparkle) {
          const hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0;
          const r = (hash % 100) < 3 ? rad * 1.8 : rad;
          if (isSquare) {
            ctx.rect(drawX - r, drawY - r, r * 2, r * 2);
          } else {
            ctx.moveTo(drawX + r, drawY);
            ctx.arc(drawX, drawY, r, 0, TWO_PI);
          }
        } else if (isSquare) {
          ctx.rect(drawX - rad, drawY - rad, rad * 2, rad * 2);
        } else {
          ctx.moveTo(drawX + rad, drawY);
          ctx.arc(drawX, drawY, rad, 0, TWO_PI);
        }
      }

      ctx.fill();

      rafRef.current = requestAnimationFrame(tick);
    }

    doResize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(tick);

    rebuildRef.current = () => {
      const { w, h } = sizeRef.current;
      if (w > 0 && h > 0) buildDots(w, h);
    };

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      clearInterval(speedInterval);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    rebuildRef.current?.();
  }, [dotRadius, dotSpacing]);

  const canvasStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  };

  const svgStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  };

  return (
    <div className="dot-field-container" {...rest}>
      <canvas ref={canvasRef} style={canvasStyle} />
      <svg ref={svgRef} style={svgStyle}>
        <defs>
          <radialGradient id={glowIdRef.current}>
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle
          ref={glowRef}
          cx="-9999"
          cy="-9999"
          r={glowRadius}
          fill={`url(#${glowIdRef.current})`}
          style={{ opacity: 0, willChange: "opacity" }}
        />
      </svg>
    </div>
  );
});

DotField.displayName = "DotField";

export default DotField;
