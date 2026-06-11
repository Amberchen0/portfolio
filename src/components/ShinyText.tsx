"use client";

/**
 * ShinyText — animated gradient sweep that highlights text with a
 * moving "shine" band, ported from React Bits (@react-bits/ShinyText-JS-CSS)
 * to TS and using the project's existing `framer-motion` (the React Bits
 * docs import from `motion/react`, which is the new package name — both
 * expose the same API, so the import was retargeted).
 *
 * Two cycle modes:
 *   - Default: shine sweeps 0→100% then jumps back. `delay` holds the
 *     end position before restarting.
 *   - `yoyo`: shine sweeps 0→100→0→100… with `delay` holding at each end.
 *
 * Visual mechanism: text uses a 5-stop linear-gradient where the middle
 * stop is the bright `shineColor` and the outer stops are the muted
 * `color`. The background-position animates 150%→-50% so the shine band
 * crosses the text.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useAnimationFrame,
  useTransform,
} from "framer-motion";

import "./ShinyText.css";

export interface ShinyTextProps {
  text: string;
  /** Suppresses animation entirely (text still renders). */
  disabled?: boolean;
  /** Seconds per single sweep (one direction). Default 2. */
  speed?: number;
  className?: string;
  /** Base / outer text color of the gradient. Default #b5b5b5. */
  color?: string;
  /** Middle "shine" color that travels across. Default #ffffff. */
  shineColor?: string;
  /** Gradient angle in degrees. 90 = vertical, 120 = diagonal etc. Default 120. */
  spread?: number;
  /** Width of the bright shine band as % of the gradient (0..100).
   *  Default 30 = the original 35%→65% band. Increase to widen the
   *  highlight zone; e.g. 39 = 30% wider coverage. */
  shineWidth?: number;
  /** When true, sweep alternates direction each cycle instead of looping. */
  yoyo?: boolean;
  /** Pause sweep while cursor hovers the text. */
  pauseOnHover?: boolean;
  /** Sweep direction. Default "left" (shine moves left→right visually). */
  direction?: "left" | "right";
  /** Hold duration at end of sweep before restarting (seconds). Default 0. */
  delay?: number;
}

const ShinyText = ({
  text,
  disabled = false,
  speed = 2,
  className = "",
  color = "#b5b5b5",
  shineColor = "#ffffff",
  spread = 120,
  shineWidth = 30,
  yoyo = false,
  pauseOnHover = false,
  direction = "left",
  delay = 0,
}: ShinyTextProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const directionRef = useRef(direction === "left" ? 1 : -1);

  const animationDuration = speed * 1000;
  const delayDuration = delay * 1000;

  useAnimationFrame((time) => {
    if (disabled || isPaused) {
      lastTimeRef.current = null;
      return;
    }

    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      return;
    }

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    elapsedRef.current += deltaTime;

    if (yoyo) {
      const cycleDuration = animationDuration + delayDuration;
      const fullCycle = cycleDuration * 2;
      const cycleTime = elapsedRef.current % fullCycle;

      if (cycleTime < animationDuration) {
        // Forward animation: 0 -> 100
        const p = (cycleTime / animationDuration) * 100;
        progress.set(directionRef.current === 1 ? p : 100 - p);
      } else if (cycleTime < cycleDuration) {
        // Delay at end
        progress.set(directionRef.current === 1 ? 100 : 0);
      } else if (cycleTime < cycleDuration + animationDuration) {
        // Reverse animation: 100 -> 0
        const reverseTime = cycleTime - cycleDuration;
        const p = 100 - (reverseTime / animationDuration) * 100;
        progress.set(directionRef.current === 1 ? p : 100 - p);
      } else {
        // Delay at start
        progress.set(directionRef.current === 1 ? 0 : 100);
      }
    } else {
      const cycleDuration = animationDuration + delayDuration;
      const cycleTime = elapsedRef.current % cycleDuration;

      if (cycleTime < animationDuration) {
        // Animation phase: 0 -> 100
        const p = (cycleTime / animationDuration) * 100;
        progress.set(directionRef.current === 1 ? p : 100 - p);
      } else {
        // Delay phase - hold at end (shine off-screen)
        progress.set(directionRef.current === 1 ? 100 : 0);
      }
    }
  });

  useEffect(() => {
    directionRef.current = direction === "left" ? 1 : -1;
    elapsedRef.current = 0;
    progress.set(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction]);

  // Transform: p=0 -> 150% (shine off right), p=100 -> -50% (shine off left)
  const backgroundPosition = useTransform(
    progress,
    (p) => `${150 - p * 2}% center`
  );

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) setIsPaused(true);
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) setIsPaused(false);
  }, [pauseOnHover]);

  // Compute shine band edges from shineWidth (centered at 50%).
  // shineWidth=30 reproduces the original 35%→65% band.
  const shineLeft = 50 - shineWidth / 2;
  const shineRight = 50 + shineWidth / 2;
  const gradientStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} ${shineLeft}%, ${shineColor} 50%, ${color} ${shineRight}%, ${color} 100%)`,
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
  };

  return (
    <motion.span
      className={`shiny-text ${className}`}
      style={{ ...gradientStyle, backgroundPosition }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text}
    </motion.span>
  );
};

export default ShinyText;
