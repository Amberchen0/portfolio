"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Float,
  Text,
  Billboard,
  useTexture,
  MeshTransmissionMaterial,
  Sparkles,
  Lightformer,
} from "@react-three/drei";
import { EffectComposer, HueSaturation, Bloom } from "@react-three/postprocessing";
import { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import GlassSurface from "./GlassSurface";
import TopNav from "./TopNav";
import { useLang } from "@/lib/useLang";

/** 9 distinct glass / metal / pearl recipes — one per planet so the user
 *  can compare them side by side and pick a favourite. Each maps to a
 *  branch in <PlanetMaterial>. Treat this as the menu of looks. */
type PlanetMaterialVariant =
  | "crystal" // clear high-IOR glass, subtle iridescent edge
  | "frosted" // milky/foggy glass with high roughness
  | "dispersion" // MeshTransmissionMaterial + chromaticAberration rainbow
  | "pearl" // sheen + heavy clearcoat — soft pearlescent
  | "sss" // MeshPhysicalMaterial + mattdesl SSS injection (inner glow)
  | "mercury" // metallic mirror (chrome bead)
  | "iridescent" // dichroic oil-slick / soap bubble
  | "anisotropic" // streaked brushed-glass directional sheen
  | "ice" // translucent crystalline ice — texture-first, low transmission/iridescence/envmap, designed for pale silvery moon textures (HYSTON)
  | "amber"; // warm tight attenuation (deep amber bead)

/** A moon orbits a parent planet (not the sun). */
/** Bilingual UI label. The 3D scene's chromatic PlanetLabel always
 *  reads `.en` so floating planet text stays in latin script
 *  regardless of which language the visitor reads in (per Amber).
 *  The INDEX dropdown directory + the PlanetModal title both pick
 *  whichever side matches the current `lang`. */
type LocalisedLabel = {
  zh: string;
  en: string;
};

type Moon = {
  slug: string;
  /** Display name shown in the INDEX directory + PlanetModal (follows
   *  language toggle). The 3D PlanetLabel above the moon reads `.en`
   *  unconditionally — see PlanetLabel call sites. */
  name: LocalisedLabel;
  /** Short medium / discipline tag shown after the name in the INDEX
   *  dropdown. Same toggle behaviour as `name`. */
  category?: LocalisedLabel;
  color: string;
  iridescenceColor: string;
  material: PlanetMaterialVariant;
  /** optional path to an equirectangular texture map under /public — same
   *  semantics as Planet.texturePath: paints the surface and drives
   *  emissiveMap so bright pixels self-illuminate. */
  texturePath?: string;
  /** SSS-only: trough value of the breath pulse factor. Default 0.5
   *  (50% swing 0.5..1.0). Lower = darker low point + more dramatic
   *  breathing. Only consumed when material is "sss". */
  breathTrough?: number;
  /** ice-only: multiplier applied to emissive + envMap + SSS scale +
   *  SSS ambient. Default 1.0. <1.0 dims the inner glow without
   *  affecting other ice-material instances (e.g. HYSTON 0.75 to sit
   *  quieter while L'Heure keeps its full breathing glow). */
  glowScale?: number;
  size: number;
  /** distance from parent planet's center */
  orbitRadius: number;
  /** how fast it orbits parent, radians/second */
  orbitSpeed: number;
  /** starting angle on its local orbit */
  initialAngle: number;
  /** moon's own orbital plane tilt relative to parent's local frame */
  orbitTilt: [number, number];
};

/** Each work-planet's identity. */
type Planet = {
  /** Bilingual display name. INDEX directory + PlanetModal follow the
   *  language toggle; the 3D PlanetLabel reads `.en` only (planet
   *  surface labels stay English per Amber). */
  name: LocalisedLabel;
  /** Bilingual short medium / discipline tag shown after the name in
   *  the INDEX dropdown. */
  category?: LocalisedLabel;
  slug: string;
  color: string;
  iridescenceColor: string;
  material: PlanetMaterialVariant;
  /** optional path to an equirectangular texture map under /public.
   *  When set, the planet's material wears it as its skin; the same
   *  image also drives emissiveMap so bright spots glow naturally. */
  texturePath?: string;
  /** SSS-only: trough value of the breath pulse factor. Default 0.5
   *  (50% swing 0.5..1.0). Lower = darker low point + more dramatic
   *  breathing. Only consumed when material is "sss". */
  breathTrough?: number;
  /** when true, an outer wispy procedural cloud layer wraps the
   *  planet at 1.03× scale, counter-rotating slowly for atmosphere. */
  cloudShell?: boolean;
  /** opacity override for the cloud shell. Default 0.7 (set in
   *  CloudShell). Crank higher (e.g. 0.95) for planets whose surface
   *  texture is so bright/contrasty the default cream cloud gets
   *  visually drowned. */
  cloudOpacity?: number;
  /** optional tint applied to the cloud shell's RGB. Default white
   *  (no tint). Set to e.g. "#f0c060" for a golden mist (drawing). */
  cloudColor?: string;
  /** when true, animate the surface texture's UV sampling so the
   *  image appears to flow like water across the sphere (no displaced
   *  geometry — purely a shader UV distortion). Currently only the
   *  textured crystal branch implements this. */
  waterFlow?: boolean;
  /** when true, animate the material's emissive + SSS + envMap with
   *  the same factor curve as Mask (0.5..1.0 over ~3.1s, sin-locked
   *  to the global clock so multiple pulsing planets stay in phase).
   *  Currently honoured only by the ice variant. */
  pulse?: boolean;
  size: number;
  orbitRadius: number;
  /** starting angle on its orbit, in radians */
  angle: number;
  /** how fast it revolves around the sun, radians/second — always on, mouse-independent */
  orbitSpeed: number;
  orbitTilt: [number, number];
  moons?: Moon[];
};

// Per-planet orbital tilts pushed to 10–18° so the orbital planes are CLEARLY
// stacked at different angles (vs the 3–5° earlier which read as "flat").
// X-axis tilt makes the orbit dip front-to-back; Z-axis tilt makes it dip left-right.
// All 8 planets share the same angular speed: one full revolution per 60s
// (2π / 60 ≈ 0.1047 rad/s). HYSTON moon keeps its own much-faster speed.
const ORBIT_SPEED = Math.PI / 30;
const PLANETS: Planet[] = [
  // ── real works ──
  // material assignments deliberately spread the menu so every variant
  // appears once and the user can pick a favourite from the orbiting set.
  // L'HEURE VIOLETTE = "the violet hour". Original config used warm amber
  // tones (legacy from when this slot was placeholder); now wears a purple
  // electric-plasma panorama that aligns with the work's actual name.
  // Colours shifted from amber-orange to violet so the amber material's
  // attenuation tinting doesn't bleed warm hues into the cool texture.
  { slug: "model",     name: { zh: "紫罗兰时分", en: "L'HEURE VIOLETTE" }, category: { zh: "建筑概念", en: "Architecture" }, color: "#4a2880", iridescenceColor: "#9870e8", material: "ice", texturePath: "/L-pano-2.png", pulse: true, breathTrough: 0.25, cloudShell: true, cloudOpacity: 0.95, cloudColor: "#6a40a0",
    size: 1.00, orbitRadius: 4.6, angle: Math.PI / 2,                          orbitSpeed: ORBIT_SPEED, orbitTilt: [0.22, -0.10] },
  { slug: "nemo",      name: { zh: "尼莫", en: "Nemo" }, category: { zh: "角色与世界", en: "Character & World" }, color: "#1a6b8e", iridescenceColor: "#3dd5b0", material: "crystal", texturePath: "/nemo-pano-2.JPG", waterFlow: true,
    size: 1.00, orbitRadius: 3.6, angle: Math.PI / 2 + (2 * Math.PI) / 8,     orbitSpeed: ORBIT_SPEED, orbitTilt: [-0.30, 0.12] },
  { slug: "concept",   name: { zh: "寰外", en: "Beyond" }, category: { zh: "概念插画", en: "Concept Illustration" }, color: "#1d5b58", iridescenceColor: "#7ad5e8", material: "dispersion", texturePath: "/concept-pano-1.png",
    size: 1.00, orbitRadius: 6.0, angle: Math.PI / 2 + (4 * Math.PI) / 8,     orbitSpeed: ORBIT_SPEED, orbitTilt: [0.15, 0.26] },
  { slug: "moonlight", name: { zh: "月光", en: "Moonlight" }, category: { zh: "视觉叙事", en: "Visual Narrative" }, color: "#2a1f3d", iridescenceColor: "#c08af0", material: "pearl", texturePath: "/moonlight-pano-3.JPG",
    size: 0.85, orbitRadius: 7.2, angle: Math.PI / 2 + (6 * Math.PI) / 8,     orbitSpeed: ORBIT_SPEED, orbitTilt: [-0.24, -0.18] },
  { slug: "mask",      name: { zh: "面具之下", en: "Under the Mask" }, category: { zh: "插画 / 叙事", en: "Illustration / Story" }, color: "#e60012", iridescenceColor: "#ff621f", material: "sss", texturePath: "/mask-pano-4.png", breathTrough: 0.25,
    size: 0.85, orbitRadius: 5.3, angle: Math.PI / 2 + Math.PI,                orbitSpeed: ORBIT_SPEED, orbitTilt: [0.30, 0.05] },
  // game — mirrors mask's SSS material recipe (internal-light pulsing,
  // same red iridescence) but wears its own dedicated panorama
  // (game-pano-1.png — pure red nebula with starfield). Mask now wears
  // the red/cyan fire-vs-ice variant; together the two SSS planets pulse
  // in red on opposite sides of the sun, forming a "twin heartbeat" pair.
  { slug: "game",      name: { zh: "玩家", en: "Gamer" }, category: { zh: "短篇动画", en: "Short Animation" }, color: "#e60012", iridescenceColor: "#d40010", material: "sss", texturePath: "/game-pano-1.png",
    size: 0.55, orbitRadius: 8.2, angle: Math.PI / 2 + (10 * Math.PI) / 8,    orbitSpeed: ORBIT_SPEED, orbitTilt: [-0.14, 0.28] },

  // Drawing — placeholder (ink-toned)
  { slug: "drawing",      name: { zh: "速写", en: "Drawing" }, category: { zh: "绘画", en: "Drawing" }, color: "#2a2a32", iridescenceColor: "#b0a8b8", material: "crystal", texturePath: "/draw-pano-4.JPG", cloudShell: true, cloudOpacity: 0.65, cloudColor: "#f0c060",
    size: 0.55, orbitRadius: 7.6, angle: Math.PI / 2 + (12 * Math.PI) / 8,    orbitSpeed: ORBIT_SPEED, orbitTilt: [0.28, 0.10] },

  // Photography — placeholder + HYSTON moon-system parent (sized up to be believable parent)
  { slug: "photography",  name: { zh: "影像", en: "Photography" }, category: { zh: "摄影", en: "Photography" }, color: "#3a4a58", iridescenceColor: "#a8c0d8", material: "anisotropic", texturePath: "/phy-pano-2.JPG",
    size: 0.95, orbitRadius: 6.7, angle: Math.PI / 2 + (14 * Math.PI) / 8,    orbitSpeed: ORBIT_SPEED, orbitTilt: [-0.20, 0.30],
    moons: [
      {
        slug: "hyston",
        name: { zh: "HYSTON", en: "HYSTON" },
        category: { zh: "个人纪录片", en: "Documentary" },
        // 2026-05: switched from warm amber tones (#7a4520 / #e8b070,
        // legacy default) to cold steel + ice blue to match the cool
        // silvery water-caustic texture and to align with the
        // "only the central sun is warm" palette discipline. The
        // attenuationColor in the crystal material reads from
        // iridescenceColor, so this also stops the warm amber tint from
        // bleeding through the textured glass.
        color: "#3a5878",
        iridescenceColor: "#a8c8e0",
        material: "ice",
        texturePath: "/hyston-pano-2.JPG",
        // glow dialed back per user "光稍微弱一点" — 25% reduction across
        // emissive + envMap + SSS scale + SSS ambient. L'Heure (the other
        // ice-material consumer) stays at default 1.0 since this is a
        // per-instance prop.
        glowScale: 0.75,
        size: 0.38,
        orbitRadius: 1.55,
        orbitSpeed: Math.PI / 4, // ~8s per revolution
        initialAngle: 0,
        orbitTilt: [0.35, 0.15],
      },
    ],
  },
];

/** Faint orbital ring drawn on the XZ plane at the planet's distance from sun.
 *  Used to visualize the orbit, like in the reference solar-system diagram. */
function OrbitRing({
  radius,
  // default opacity lowered further per user — rings should be very
  // faint, almost ghosted, not the prominent gold lines the previous
  // setting produced.
  // 2026-05 update: pushed to the edge of perception per user — rings
  // should be subliminal traces, "you-feel-it-more-than-you-see-it" level.
  opacity = 0.012,
  segments = 196,
}: {
  radius: number;
  opacity?: number;
  segments?: number;
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
      <ringGeometry args={[radius - 0.014, radius + 0.014, segments]} />
      <meshBasicMaterial
        // 2026-05: switched from amber (#d9a574, the sun's tone) to a
        // pale starlight blue so orbital traces sit inside the cold-only
        // palette discipline. At opacity ~0.01 this reads as a quiet
        // atmospheric trace rather than a tinted line.
        color="#a8c0d8"
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        // depthTest off + renderOrder=-1 makes the ring render first with
        // no depth contribution. Any opaque planet that draws after will
        // overwrite the ring at every pixel it covers, so rings always
        // read as "behind" all planets even when their tilted ellipse
        // would geometrically cross in front of a sphere. Visual rule:
        // orbital traces belong in the background plane, planets in
        // the foreground.
        depthTest={false}
      />
    </mesh>
  );
}

/** SSS sub-variant — MeshPhysicalMaterial with mattdesl-style internal-light
 *  subsurface scattering injected via onBeforeCompile. The SSS colour is
 *  driven by the planet's iridescenceColor so each red/purple/etc. planet
 *  glows from within in its own tone. Light is treated as virtual / at
 *  sphere centre (L = -N), so the math collapses to pow(N·V, power) — no
 *  real scene light required. */
function PlanetSSSMaterial({
  color,
  iridescenceColor,
  map,
  breathTrough = 0.5,
}: {
  color: string;
  iridescenceColor: string;
  /** optional pre-loaded surface texture — when provided it overrides
   *  the flat colour and also drives emissiveMap so bright pixels read
   *  as self-lit veins. The SSS halo still adds on top. */
  map?: THREE.Texture;
  /** trough of breath factor (peak is always 1.0). Default 0.5 = 50%
   *  swing (factor 0.5..1.0, original spec). Mask currently passes 0.25
   *  for a more dramatic breath. */
  breathTrough?: number;
}) {
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null!);
  const sssUniforms = useMemo(
    () => ({
      uThicknessPower: { value: 3.0 },
      uThicknessScale: { value: 1.26 }, // ceiling (×0.7 from 1.80); pulse animates in useFrame
      uThicknessAmbient: { value: 0.161 }, // ceiling (×0.7 from 0.23); pulse animates in useFrame
      uSSSColor: { value: new THREE.Color(iridescenceColor) },
    }),
    [iridescenceColor]
  );
  // Pulse spec — hardcoded here because Under the Mask is currently
  // the only SSS-variant planet. A single `factor` 0.5..1.0 drives
  // emissive, SSS centre glow, SSS ambient warmth AND env reflection
  // IN SYNC, so the whole planet breathes coherently. envMapIntensity
  // is in the pulse because the upper-left Lightformer adds a strong
  // static directional reflection — if we left envMapIntensity at its
  // ceiling, that lit hemisphere would never dim and the breath would
  // be invisible there.
  // Period ~3.1s matches the sun. Promote min/max/period to props if a
  // second SSS planet wants a different breath.
  useFrame((state) => {
    if (matRef.current && map) {
      const t = state.clock.elapsedTime;
      // factor = midpoint + sin·amplitude, where:
      //   peak = 1.0 (always), trough = breathTrough
      //   midpoint = (1 + trough)/2, amplitude = (1 - trough)/2
      // Default breathTrough=0.5 → factor 0.5..1.0 (original spec).
      // mask passes 0.25 → factor 0.25..1.0 (deeper, more obvious breath).
      const mid = (1 + breathTrough) / 2;
      const amp = (1 - breathTrough) / 2;
      const factor = mid + Math.sin(t * 2.0) * amp;
      matRef.current.emissiveIntensity = 0.43 * factor;
      matRef.current.envMapIntensity = 7.6 * factor;
      sssUniforms.uThicknessScale.value = 1.26 * factor;
      sssUniforms.uThicknessAmbient.value = 0.161 * factor;
    }
  });

  const onBeforeCompile = (
    shader: THREE.WebGLProgramParametersWithUniforms
  ) => {
    shader.uniforms.uThicknessPower = sssUniforms.uThicknessPower;
    shader.uniforms.uThicknessScale = sssUniforms.uThicknessScale;
    shader.uniforms.uThicknessAmbient = sssUniforms.uThicknessAmbient;
    shader.uniforms.uSSSColor = sssUniforms.uSSSColor;

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
        uniform float uThicknessPower;
        uniform float uThicknessScale;
        uniform float uThicknessAmbient;
        uniform vec3 uSSSColor;`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <lights_fragment_end>",
      `{
          vec3 vSSS = normalize(vViewPosition);
          vec3 nSSS = normal;
          float ndvSSS = clamp(dot(vSSS, nSSS), 0.0, 1.0);
          vec3 sssGlow = pow(ndvSSS, uThicknessPower) * uThicknessScale * uSSSColor;
          reflectedLight.directDiffuse += sssGlow + uThicknessAmbient * uSSSColor;
        }
        #include <lights_fragment_end>`
    );
  };

  return (
    <meshPhysicalMaterial
      ref={matRef}
      map={map}
      emissiveMap={map}
      color={map ? "#ffffff" : color}
      emissive={map ? "#ffffff" : iridescenceColor}
      emissiveIntensity={map ? 0.43 : 0} // ceiling; pulse animates in useFrame
      roughness={0.25}
      metalness={0.05}
      transmission={0.10} // +10 pts back — restores subtle glass-like see-through
      thickness={1.5}
      ior={1.55}
      iridescence={0.15} // was 0.4 — less rainbow tint desaturating the rim
      iridescenceIOR={1.3}
      iridescenceThicknessRange={[200, 700]}
      clearcoat={0.4} // was 1.0 — keeps gem-like sheen, kills rim white-fog
      clearcoatRoughness={0.4} // was 0.18 — blurs the Fresnel reflection
      attenuationColor={iridescenceColor}
      attenuationDistance={2.0}
      envMapIntensity={7.6} // -5%
      transparent
      opacity={1.0} // was 0.95 — picks up the 5 pts transmission can't (already at floor)
      onBeforeCompile={onBeforeCompile}
    />
  );
}

/** Translucent crystalline ice — designed as a "texture first" glass
 *  shell for pale icy moon panoramas (HYSTON). Compared to the crystal
 *  variant: lower transmission (0.4 not 0.7), lower iridescence,
 *  thinner clearcoat refractive index (1.31, real ice IOR), all so
 *  silvery/pale textures don't wash to white through heavy glass
 *  effects.
 *
 *  Carries a mattdesl-style SSS shader injection (same trick as
 *  PlanetSSSMaterial and AmberCoreSun) so the moon glows from within
 *  in its iridescence tint — for HYSTON's cool blue iridescence this
 *  reads as "ice catching internal sunlight", similar in spirit to the
 *  amber sun but on the cold side of the palette.
 *
 *  Static glow only — no pulse (the user explicitly contrasted this
 *  with the pulsing Mask/Game pair; HYSTON stays calm). */
function IceCrystalMaterial({
  map,
  color,
  iridescenceColor,
  pulse = false,
  breathTrough = 0.5,
  glowScale = 1.0,
}: {
  map?: THREE.Texture;
  color: string;
  iridescenceColor: string;
  /** opt-in pulse — when true, emissive + envMap + SSS uniforms breathe
   *  in sync with PlanetSSSMaterial (shared global clock). Defaults off
   *  so HYSTON stays static. L'Heure Violette opts in. */
  pulse?: boolean;
  /** trough of the breath, 0..1. 0.5 = factor 0.5..1.0 (default).
   *  Set to 0.25 to match Mask's deeper breath. Ignored when pulse=false. */
  breathTrough?: number;
  /** scales all four glow channels (emissive, envMap, SSS scale, SSS ambient).
   *  Default 1.0 = original brightness. HYSTON passes 0.75 to sit ~25% dimmer
   *  than L'Heure while sharing this material. */
  glowScale?: number;
}) {
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null!);
  const sssUniforms = useMemo(
    () => ({
      uThicknessPower: { value: 3.5 },
      uThicknessScale: { value: 1.2 * glowScale }, // ceiling — animated when pulse=true
      uThicknessAmbient: { value: 0.18 * glowScale }, // ceiling — animated when pulse=true
      uSSSColor: { value: new THREE.Color(iridescenceColor) },
    }),
    [iridescenceColor, glowScale]
  );
  // Pulse: same sin(t*2.0) curve and same global clock as
  // PlanetSSSMaterial so a pulsing ice planet stays phase-locked with
  // Mask/Game. Animates four ceilings: emissive, envMap, SSS scale,
  // SSS ambient (mirrors the "all five sources in sync" fix we did for
  // Mask). Gated by `pulse` prop so HYSTON stays static.
  useFrame((state) => {
    if (!pulse || !matRef.current) return;
    const t = state.clock.elapsedTime;
    const mid = (1 + breathTrough) / 2;
    const amp = (1 - breathTrough) / 2;
    const factor = mid + Math.sin(t * 2.0) * amp; // breathTrough..1.0
    matRef.current.emissiveIntensity = 0.5 * factor * glowScale;
    matRef.current.envMapIntensity = 3.5 * factor * glowScale;
    sssUniforms.uThicknessScale.value = 1.2 * factor * glowScale;
    sssUniforms.uThicknessAmbient.value = 0.18 * factor * glowScale;
  });
  const onBeforeCompile = (
    shader: THREE.WebGLProgramParametersWithUniforms
  ) => {
    shader.uniforms.uThicknessPower = sssUniforms.uThicknessPower;
    shader.uniforms.uThicknessScale = sssUniforms.uThicknessScale;
    shader.uniforms.uThicknessAmbient = sssUniforms.uThicknessAmbient;
    shader.uniforms.uSSSColor = sssUniforms.uSSSColor;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
        uniform float uThicknessPower;
        uniform float uThicknessScale;
        uniform float uThicknessAmbient;
        uniform vec3 uSSSColor;`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <lights_fragment_end>",
      `{
          vec3 vSSS = normalize(vViewPosition);
          vec3 nSSS = normal;
          float ndvSSS = clamp(dot(vSSS, nSSS), 0.0, 1.0);
          vec3 sssGlow = pow(ndvSSS, uThicknessPower) * uThicknessScale * uSSSColor;
          reflectedLight.directDiffuse += sssGlow + uThicknessAmbient * uSSSColor;
        }
        #include <lights_fragment_end>`
    );
  };
  return (
    <meshPhysicalMaterial
      ref={matRef}
      map={map}
      emissiveMap={map}
      color={map ? "#ffffff" : color}
      emissive={map ? "#ffffff" : "#000000"}
      emissiveIntensity={(map ? 0.5 : 0) * glowScale}
      roughness={0.08}
      metalness={0}
      transmission={0.4}
      thickness={1.0}
      ior={1.31}
      iridescence={0.05}
      iridescenceIOR={1.2}
      iridescenceThicknessRange={[100, 250]}
      clearcoat={0.9}
      clearcoatRoughness={0.05}
      attenuationColor={iridescenceColor}
      attenuationDistance={6.0}
      envMapIntensity={3.5 * glowScale}
      onBeforeCompile={onBeforeCompile}
    />
  );
}

/** Dispersion-with-texture variant — extracted into its own component
 *  so it can carry its own matRef + useFrame for the breathing pulse.
 *  Mirrors PlanetSSSMaterial's pulse spec (factor 0.5..1.0 over ~3.1s)
 *  but drives only emissive + envMapIntensity (no SSS shader on this
 *  variant). Used by Concept Design — and any future textured planet
 *  on the dispersion path that wants the same breath. */
function DispersionTexturedMaterial({ map }: { map: THREE.Texture }) {
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null!);
  // Same factor curve as PlanetSSSMaterial — period ~3.1s, trough at 50%
  // of ceiling. Without an SSS shader to also dim, both emissive AND
  // envMapIntensity are pulsed so the directional Lightformer reflection
  // breathes too (otherwise the lit hemisphere would stay constant).
  useFrame((state) => {
    if (matRef.current) {
      const t = state.clock.elapsedTime;
      const factor = 0.75 + Math.sin(t * 2.0) * 0.25; // 0.5..1.0
      matRef.current.emissiveIntensity = 0.7 * factor; // 0.35..0.7 (was 0.15..0.3)
      matRef.current.envMapIntensity = 3.5 * factor; // 1.75..3.5 (was 0.9..1.8)
    }
  });
  return (
    <meshPhysicalMaterial
      ref={matRef}
      map={map}
      emissiveMap={map}
      color="#ffffff"
      emissive="#ffffff"
      emissiveIntensity={0.7} // ceiling raised so swing clears ambient baseline
      roughness={0.35}
      metalness={0}
      clearcoat={0.6}
      clearcoatRoughness={0.2}
      envMapIntensity={3.5} // ceiling raised — pulse amplitude needs to beat ambient
    />
  );
}

/** Anisotropic + textured + sun-style noise displacement. Extracted as
 *  its own component because useNoiseDisplacementMap is a hook and can't
 *  be called inside the switch in PlanetMaterial. The displacement gives
 *  the gem panorama a jagged/lumpy silhouette so the planet reads as a
 *  rough crystal cluster instead of a perfect ball — mirroring the visual
 *  vocabulary of the amber sun (same noise displacement family, slightly
 *  smaller scale so a smaller planet doesn't read deformed). */
function AnisotropicTexturedMaterial({ map }: { map: THREE.Texture }) {
  // noise frequency halved (10 → 5) so each displacement bump covers
  // roughly twice the surface area — gives a chunkier, more "block-face"
  // silhouette instead of finely scattered ripples.
  const displacement = useNoiseDisplacementMap(512, 5, 2);
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null!);
  // Dramatic breath pulse mirroring PlanetSSSMaterial (game/mask):
  //   factor = 0.75 + sin(t * 2.0) * 0.25 → swings 0.5..1.0 (50% swing)
  //   period 2π/2.0 ≈ 3.1s
  // Previous sun-style pulse only swung 16% — too subtle to read as
  // breathing. Game's factor swings 50% and modulates BOTH emissive +
  // envMap together so the whole planet visibly inflates/deflates with
  // every breath. Same trick applied here. The values set on the
  // material below are the *ceiling* — the factor pulls them down to
  // 50% at the trough, then back to ceiling at the peak.
  useFrame((state) => {
    if (matRef.current) {
      const t = state.clock.elapsedTime;
      // breath made more obvious per user — bigger swing + higher peak:
      //   factor swing 50% → 70% (trough pulled lower so contrast reads)
      //   emissive ceiling 1.6 → 2.4 (+50%)
      //   envMap   ceiling 11.2 → 16 (+43%)
      const factor = 0.65 + Math.sin(t * 2.0) * 0.35; // 0.3..1.0
      matRef.current.emissiveIntensity = 2.4 * factor; // 0.72..2.4
      matRef.current.envMapIntensity = 16.0 * factor; // 4.8..16
    }
  });
  return (
    <meshPhysicalMaterial
      ref={matRef}
      map={map}
      emissiveMap={map}
      // emissive tint progression:
      //   #1ed12e (pure green) — read yellow against turquoise texture
      //   #10d8b0 (mint teal)  — clean green-cyan, but still leans green
      //   #10add3 (aqua blue)  — too blue
      //   #10c7b3 (mint-teal,  — pulled back 15% toward green from the
      //            slight blue   aqua-blue stop. Sits between mint and
      //            cast)         aqua: clearly cool, leans green.
      emissive="#10bdbc"
      emissiveIntensity={2.4}
      displacementMap={displacement}
      displacementScale={0.10}
      displacementBias={-0.05}
      color="#ffffff"
      // reflection package bumped per user — surface should read as
      // wet polished gem, not matte plastic:
      //   roughness 0.22 → 0.12   (smoother, tighter mirror highlight)
      //   clearcoat 0.85 → 1.0    (full lacquer)
      //   clearcoatRoughness 0.12 → 0.08 (lacquer reflection sharper)
      //   envMapIntensity 2.2 → 5.0  (env light reflection dominates)
      roughness={0.12}
      metalness={0}
      clearcoat={1.0}
      clearcoatRoughness={0.08}
      iridescence={0.18}
      iridescenceIOR={1.3}
      iridescenceThicknessRange={[300, 700]}
      envMapIntensity={16.0}
      // flatShading reveals the underlying tessellation as faceted
      // planes — combined with the displaced surface, this makes each
      // bump read as a discrete crystal facet rather than a smooth lump.
      flatShading
    />
  );
}

/** Crystal + textured + subtle breath pulse + sky-blue emissive tint.
 *  Mirrors the textured crystal branch of PlanetMaterial verbatim
 *  (so Nemo still reads as crystal — same transmission, iridescence,
 *  attenuation, etc.) but pulled out so a useFrame hook can drive a
 *  gentle pulse. Per user: breath should be very subtle (no dramatic
 *  bright/dark contrast), and emissive should lean sky-blue (#dcecff
 *  instead of neutral white) so the inner glow reads as cool light
 *  threading through the blue-green texture, not white wash. */
function CrystalTexturedMaterial({
  map,
  iridescenceColor,
}: {
  map: THREE.Texture;
  iridescenceColor: string;
}) {
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null!);
  useFrame((state) => {
    if (matRef.current) {
      const t = state.clock.elapsedTime;
      // factor 0.76..1.0 → 24% swing, period 2π/1.2 ≈ 5.2s. Mild enough
      // that you sense the breath rather than see it loud.
      const factor = 0.88 + Math.sin(t * 1.2) * 0.12;
      matRef.current.emissiveIntensity = 0.63 * factor; // 0.48..0.63
    }
  });
  return (
    <meshPhysicalMaterial
      ref={matRef}
      map={map}
      emissiveMap={map}
      color="#ffffff"
      emissive="#dcecff"
      emissiveIntensity={0.63}
      roughness={0.08}
      metalness={0.05}
      transmission={0.7}
      thickness={1.4}
      ior={1.6}
      iridescence={0.6}
      iridescenceIOR={1.3}
      iridescenceThicknessRange={[200, 700]}
      clearcoat={1.0}
      clearcoatRoughness={0.1}
      attenuationColor={iridescenceColor}
      attenuationDistance={3.0}
      envMapIntensity={9.2}
      transparent
      opacity={1.0}
    />
  );
}

/** Iridescent + textured + gentle breath pulse. Same extraction pattern
 *  as AnisotropicTexturedMaterial — pulled out of the switch so the
 *  useFrame hook can run. The breath here is deliberately subtle: small
 *  swing (30%), slow period (~5s), and only emissive is animated (not
 *  envMap), so the planet feels "alive" without competing for attention
 *  with the more dramatic SSS / anisotropic breaths elsewhere. */
function IridescentTexturedMaterial({
  map,
  iridescenceColor,
}: {
  map: THREE.Texture;
  iridescenceColor: string;
}) {
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null!);
  useFrame((state) => {
    if (matRef.current) {
      const t = state.clock.elapsedTime;
      // factor 0.7..1.0 → 30% swing, period 2π/1.3 ≈ 4.8s (slower than
      // the SSS planets' 3.1s so the eye reads it as a separate, calmer
      // rhythm).
      const factor = 0.85 + Math.sin(t * 1.3) * 0.15;
      matRef.current.emissiveIntensity = 0.55 * factor; // 0.385..0.55
    }
  });
  return (
    <meshPhysicalMaterial
      ref={matRef}
      map={map}
      emissiveMap={map}
      color="#ffffff"
      emissive={iridescenceColor}
      emissiveIntensity={0.55}
      roughness={0.2}
      metalness={0.05}
      clearcoat={0.9}
      clearcoatRoughness={0.1}
      iridescence={0.3}
      iridescenceIOR={1.4}
      iridescenceThicknessRange={[300, 800]}
      envMapIntensity={3.0}
    />
  );
}

/** Material dispatcher — given a variant + colour pair, returns the JSX
 *  for that material. Centralised here so every recipe is in one file
 *  block and easy to tune side-by-side. */
function PlanetMaterial({
  variant,
  color,
  iridescenceColor,
  map,
  breathTrough,
  pulse,
  glowScale,
}: {
  variant: PlanetMaterialVariant;
  color: string;
  iridescenceColor: string;
  /** optional pre-loaded texture; when provided it overrides the flat
   *  colour and drives emissiveMap so bright pixels self-illuminate */
  map?: THREE.Texture;
  /** SSS-only breath trough override; forwarded to PlanetSSSMaterial.
   *  Other variants ignore this prop. */
  breathTrough?: number;
  /** opt-in pulse for variants that default to static glow (currently
   *  only the `ice` variant honours this). Synced to the same global
   *  clock as PlanetSSSMaterial so multiple pulsing planets stay in
   *  phase. */
  pulse?: boolean;
  /** ice-only: glow multiplier (1.0 default, <1.0 dims). */
  glowScale?: number;
}) {
  switch (variant) {
    case "crystal":
      // Two-mode branch:
      //   - With `map`: route to CrystalTexturedMaterial which adds a
      //     subtle breath pulse + sky-blue emissive tint on top of the
      //     same crystal recipe (kept identical otherwise so Nemo's glass
      //     character doesn't drift).
      //   - Without `map`: original baseline clear glass with iridescent
      //     edge — emissive in iridescenceColor against the dark sky.
      if (map) {
        return (
          <CrystalTexturedMaterial map={map} iridescenceColor={iridescenceColor} />
        );
      }
      return (
        <meshPhysicalMaterial
          color={color}
          emissive={iridescenceColor}
          emissiveIntensity={0.35}
          roughness={0.08}
          metalness={0.05}
          transmission={0.7}
          thickness={1.4}
          ior={1.6}
          iridescence={0.6}
          iridescenceIOR={1.3}
          iridescenceThicknessRange={[200, 700]}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          attenuationColor={iridescenceColor}
          attenuationDistance={3.0}
          envMapIntensity={9.2}
          transparent
          opacity={1.0}
        />
      );
    case "ice":
      return (
        <IceCrystalMaterial
          map={map}
          color={color}
          iridescenceColor={iridescenceColor}
          pulse={pulse}
          breathTrough={breathTrough}
          glowScale={glowScale}
        />
      );
    case "frosted":
      // milk-glass — diffuse milky glow tied to iridescenceColor.
      return (
        <meshPhysicalMaterial
          color={color}
          roughness={0.65}
          metalness={0}
          transmission={0.55}
          thickness={2.2}
          ior={1.45}
          iridescence={0.25}
          clearcoat={0.6}
          clearcoatRoughness={0.55}
          attenuationColor={iridescenceColor}
          attenuationDistance={1.4}
          envMapIntensity={6.0}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.95}
        />
      );
    case "dispersion":
      // Two-mode branch:
      //   - With `map`: fall back to a plain opaque physical material so
      //     the panorama renders at full saturation. MeshTransmissionMaterial
      //     is a dedicated refraction shader — even at transmission=0 it
      //     still runs FBO sampling, backside compositing and volume
      //     attenuation, all of which desaturate / wash the texture toward
      //     grey. Swapping the material wholesale is the only clean fix.
      //   - Without `map`: original FBO refraction with R/G/B channel
      //     offset. `background` makes MTM use a solid colour as the
      //     refraction backdrop so the planet doesn't render as near-black
      //     when there's nothing colourful behind it.
      if (map) {
        return <DispersionTexturedMaterial map={map} />;
      }
      return (
        <MeshTransmissionMaterial
          color={color}
          background={new THREE.Color(iridescenceColor)}
          roughness={0.05}
          transmission={0.95}
          thickness={1.2}
          ior={1.55}
          chromaticAberration={0.5}
          anisotropy={0.3}
          distortion={0.15}
          temporalDistortion={0.05}
          backside
          backsideThickness={1.5}
          samples={4}
          resolution={512}
          attenuationColor={iridescenceColor}
          attenuationDistance={2.5}
        />
      );
    case "pearl":
      // Two-mode branch (same pattern as dispersion/anisotropic/amber):
      //   - With `map`: opaque PBR with texture as base + emissiveMap
      //     so bright pixels self-illuminate. iridescence/envMap dialed
      //     down compared to the unmapped pearl so the texture isn't
      //     washed by rainbow oil + super-bright env reflections. Sheen
      //     and emissive stay tinted by iridescenceColor so the
      //     pearlescent character (soft halo + violet inner glow) is
      //     preserved.
      //   - Without `map`: original sheen-heavy clearcoat pearl recipe.
      if (map) {
        return (
          <meshPhysicalMaterial
            map={map}
            emissiveMap={map}
            color="#ffffff"
            emissive={iridescenceColor}
            emissiveIntensity={0.35}
            roughness={0.3}
            metalness={0}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
            sheen={0.7}
            sheenColor={new THREE.Color(iridescenceColor)}
            sheenRoughness={0.4}
            iridescence={0.3}
            iridescenceIOR={1.3}
            iridescenceThicknessRange={[300, 700]}
            envMapIntensity={2.5}
          />
        );
      }
      return (
        <meshPhysicalMaterial
          color={color}
          roughness={0.3}
          metalness={0}
          transmission={0.0}
          ior={1.45}
          iridescence={1.0}
          iridescenceIOR={1.4}
          iridescenceThicknessRange={[400, 1000]}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          sheen={1.0}
          sheenColor={new THREE.Color(iridescenceColor)}
          sheenRoughness={0.4}
          envMapIntensity={8.0}
          emissive={iridescenceColor}
          emissiveIntensity={0.4}
        />
      );
    case "sss":
      return (
        <PlanetSSSMaterial
          color={color}
          iridescenceColor={iridescenceColor}
          map={map}
          breathTrough={breathTrough}
        />
      );
    case "mercury":
      // chrome — full metal mirror. Pure white base + huge envMap so it
      // shows as a bright silver bead even on the mostly-dark background.
      return (
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.06}
          metalness={1.0}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          envMapIntensity={15.0}
          emissive="#e8e8f0"
          emissiveIntensity={0.4}
        />
      );
    case "iridescent":
      // Two-mode branch (same pattern as dispersion/anisotropic/amber/pearl):
      //   - With `map`: opaque PBR + texture base + emissiveMap so bright
      //     pixels self-illuminate, iridescence/envMap dialed down so the
      //     texture isn't drowned in rainbow oil. A touch of iridescence
      //     stays to preserve the "soap-bubble" character at grazing
      //     angles.
      //   - Without `map`: original heavy oil-slick iridescent recipe.
      if (map) {
        return (
          <IridescentTexturedMaterial
            map={map}
            iridescenceColor={iridescenceColor}
          />
        );
      }
      return (
        <meshPhysicalMaterial
          color={color}
          roughness={0.15}
          metalness={0.1}
          transmission={0.0}
          iridescence={1.0}
          iridescenceIOR={1.5}
          iridescenceThicknessRange={[100, 1400]}
          clearcoat={1.0}
          clearcoatRoughness={0.08}
          envMapIntensity={12.0}
          emissive={iridescenceColor}
          emissiveIntensity={0.5}
        />
      );
    case "anisotropic":
      // Two-mode branch (same pattern as dispersion):
      //   - With `map`: fall back to opaque physical material so the
      //     panorama renders at full saturation. MeshTransmissionMaterial
      //     is a refraction shader; even at low transmission it desaturates
      //     textures through FBO compositing + backside passes. For the
      //     gem/crystal panorama we want clean opaque PBR with a sharp
      //     clearcoat for "polished gem facet" reads.
      //   - Without `map`: original anisotropic FBO glass with brushed
      //     streaks. background colour keeps the bead visible against the
      //     dark scene.
      if (map) {
        return <AnisotropicTexturedMaterial map={map} />;
      }
      return (
        <MeshTransmissionMaterial
          color={color}
          background={new THREE.Color(iridescenceColor)}
          roughness={0.18}
          transmission={0.55}
          thickness={1.0}
          ior={1.5}
          chromaticAberration={0.1}
          anisotropy={0.9}
          anisotropicBlur={1.0}
          distortion={0.05}
          backside
          samples={4}
          resolution={512}
          attenuationColor={iridescenceColor}
          attenuationDistance={2.5}
        />
      );
    case "amber":
      // Two-mode branch (same pattern as dispersion/anisotropic):
      //   - With `map`: clean opaque PBR with the texture as base + a
      //     mild emissive tint pulled from iridescenceColor so the
      //     surface still has a "glowing-from-within" feel. Heavy amber
      //     transmission/attenuation is dropped because it desaturates
      //     the texture (same washing-out we fought with concept).
      //   - Without `map`: original fossilised-resin amber recipe.
      if (map) {
        return (
          <meshPhysicalMaterial
            map={map}
            emissiveMap={map}
            color="#ffffff"
            emissive={iridescenceColor}
            emissiveIntensity={0.45}
            roughness={0.2}
            metalness={0}
            clearcoat={0.9}
            clearcoatRoughness={0.12}
            iridescence={0.25}
            iridescenceIOR={1.3}
            iridescenceThicknessRange={[300, 700]}
            envMapIntensity={2.5}
          />
        );
      }
      return (
        <meshPhysicalMaterial
          color={color}
          roughness={0.2}
          metalness={0.05}
          transmission={0.4}
          thickness={2.5}
          ior={1.55}
          iridescence={0.3}
          clearcoat={1.0}
          clearcoatRoughness={0.15}
          attenuationColor={color}
          attenuationDistance={0.8}
          emissive={iridescenceColor}
          emissiveIntensity={0.6}
          envMapIntensity={8.0}
          transparent
          opacity={0.9}
        />
      );
  }
}

/** Conditionally wraps PlanetMaterial with a useTexture hook so the
 *  Rules of Hooks aren't broken — useTexture is called unconditionally
 *  inside the inner component, and the parent only mounts that
 *  component when a texturePath actually exists. */
function MaybeTexturedMaterial(props: {
  variant: PlanetMaterialVariant;
  color: string;
  iridescenceColor: string;
  texturePath?: string;
  waterFlow?: boolean;
  breathTrough?: number;
  pulse?: boolean;
  glowScale?: number;
}) {
  if (props.texturePath) {
    return <TexturedMaterial {...props} texturePath={props.texturePath} />;
  }
  return (
    <PlanetMaterial
      variant={props.variant}
      color={props.color}
      iridescenceColor={props.iridescenceColor}
      breathTrough={props.breathTrough}
      pulse={props.pulse}
      glowScale={props.glowScale}
    />
  );
}

function TexturedMaterial({
  variant,
  color,
  iridescenceColor,
  texturePath,
  waterFlow,
  breathTrough,
  pulse,
  glowScale,
}: {
  variant: PlanetMaterialVariant;
  color: string;
  iridescenceColor: string;
  texturePath: string;
  waterFlow?: boolean;
  breathTrough?: number;
  pulse?: boolean;
  glowScale?: number;
}) {
  const map = useTexture(texturePath);
  // Water-flow path: a custom crystal material that animates the UVs
  // used to sample `map` so the texture appears to drift like a fluid
  // across the sphere. Only kicks in for the textured crystal branch,
  // which is the only variant Nemo currently uses.
  if (waterFlow && variant === "crystal") {
    return (
      <CrystalWaterFlowMaterial
        map={map}
        iridescenceColor={iridescenceColor}
      />
    );
  }
  return (
    <PlanetMaterial
      variant={variant}
      color={color}
      iridescenceColor={iridescenceColor}
      map={map}
      breathTrough={breathTrough}
      pulse={pulse}
      glowScale={glowScale}
    />
  );
}

/** Crystal+texture material with shader-injected animated UV
 *  distortion — the surface texture appears to flow like a slow
 *  ocean current. Mirrors the static crystal+map recipe from
 *  PlanetMaterial but replaces `<map_fragment>` and
 *  `<emissivemap_fragment>` with versions that sample at
 *  `vMapUv + flow(uTime)`. The same flow function is used for both
 *  so the diffuse and emissive layers stay in lock-step (otherwise
 *  the emissive highlights would appear to swim independently of the
 *  base colour). */
function CrystalWaterFlowMaterial({
  map,
  iridescenceColor,
}: {
  map: THREE.Texture;
  iridescenceColor: string;
}) {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });
  const onBeforeCompile = (
    shader: THREE.WebGLProgramParametersWithUniforms
  ) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uTime;
        // Two-octave sin/cos sum on each axis — slow large drift plus a
        // faster small jitter. Result: the surface texture appears to
        // breathe and flow rather than scroll linearly. Keep amplitudes
        // tiny so the image stays recognisable.
        vec2 waterFlowUV(vec2 uv) {
          float t = uTime;
          vec2 drift = vec2(
            sin(uv.y * 6.0 + t * 0.45) * 0.012 +
              sin(uv.y * 13.0 - t * 0.30) * 0.004,
            cos(uv.x * 5.0 + t * 0.38) * 0.012 +
              cos(uv.x * 12.0 - t * 0.25) * 0.004
          );
          return uv + drift;
        }`
      )
      .replace(
        "#include <map_fragment>",
        `#ifdef USE_MAP
          {
            vec2 flowUV = waterFlowUV(vMapUv);
            vec4 sampledDiffuseColor = texture2D(map, flowUV);
            #ifdef DECODE_VIDEO_TEXTURE
              sampledDiffuseColor = sRGBToLinear(sampledDiffuseColor);
            #endif
            diffuseColor *= sampledDiffuseColor;
          }
        #endif`
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#ifdef USE_EMISSIVEMAP
          {
            vec2 flowUV = waterFlowUV(vEmissiveMapUv);
            vec4 emissiveColor = texture2D(emissiveMap, flowUV);
            totalEmissiveRadiance *= emissiveColor.rgb;
          }
        #endif`
      );
  };
  return (
    <meshPhysicalMaterial
      map={map}
      emissiveMap={map}
      color="#ffffff"
      emissive="#ffffff"
      emissiveIntensity={0.55}
      roughness={0.08}
      metalness={0.05}
      transmission={0.7}
      thickness={1.4}
      ior={1.6}
      iridescence={0.6}
      iridescenceIOR={1.3}
      iridescenceThicknessRange={[200, 700]}
      clearcoat={1.0}
      clearcoatRoughness={0.1}
      attenuationColor={iridescenceColor}
      attenuationDistance={3.0}
      envMapIntensity={8.0}
      transparent
      opacity={1.0}
      onBeforeCompile={onBeforeCompile}
    />
  );
}

/** Single chromatic-glass name label that always faces the camera.
 *  One Text wrapped in <Billboard> so it stays readable regardless of
 *  orbital position or self-rotation. Three RGB-shifted layers (magenta /
 *  cyan / warm-cream) give the chromatic "off-axis print" look. */
function PlanetLabel({
  name,
  planetRadius,
  hovered,
  sizeMultiplier = 1,
}: {
  name: string;
  planetRadius: number;
  hovered: boolean;
  /** Multiplies fontSize only — the chromatic three-layer styling stays
   *  identical for every label. Defaults to 1 so existing planet/moon
   *  callsites render unchanged. The sun callsite passes a value > 1
   *  because its 1.2 radius dwarfs every other body and the default
   *  label is too small to read against the emissive surface. */
  sizeMultiplier?: number;
}) {
  const shift = hovered ? 0.018 : 0.008;
  const fontSize = (hovered ? 0.16 : 0.13) * sizeMultiplier;
  const fillOpacity = hovered ? 0.95 : 0.8;
  // sit just outside hover-scaled (1.1x) sphere, on the camera-facing side
  const distance = planetRadius * 1.1 + 0.06;
  return (
    <Billboard>
      {/* Tinos Bold restored. The /public/fonts/Tinos-Bold.ttf file
          was previously a GitHub 404 HTML page mis-saved with the
          wrong extension, which blew up Troika's font parser at
          canvas init and silently emptied the entire R3F scene.
          Replaced with a clean download from google/fonts (ofl/tinos)
          — `file Tinos-Bold.ttf` now reports "TrueType Font data".
          All three chromatic layers share the same TTF so the
          per-channel offset registration stays pixel-perfect. */}
      {/* magenta-red ghost */}
      <Text
        position={[shift, 0, distance]}
        font="/fonts/Tinos-Bold.ttf"
        color="#ff2860"
        fontSize={fontSize}
        letterSpacing={0.22}
        anchorX="center"
        anchorY="middle"
        fillOpacity={fillOpacity * 0.7}
        raycast={() => null}
      >
        {name.toUpperCase()}
      </Text>
      {/* cyan ghost */}
      <Text
        position={[-shift, 0, distance]}
        font="/fonts/Tinos-Bold.ttf"
        color="#00e0ff"
        fontSize={fontSize}
        letterSpacing={0.22}
        anchorX="center"
        anchorY="middle"
        fillOpacity={fillOpacity * 0.7}
        raycast={() => null}
      >
        {name.toUpperCase()}
      </Text>
      {/* warm-cream main fill, drawn last on top */}
      <Text
        position={[0, 0, distance + 0.002]}
        font="/fonts/Tinos-Bold.ttf"
        color={hovered ? "#f0e0c5" : "#c8bca0"}
        fontSize={fontSize}
        letterSpacing={0.22}
        anchorX="center"
        anchorY="middle"
        fillOpacity={fillOpacity}
        raycast={() => null}
      >
        {name.toUpperCase()}
      </Text>
    </Billboard>
  );
}

/** A moon revolving around its parent planet on its own tilted local orbit. */
function MoonSystem({
  moon,
  onClick,
}: {
  moon: Moon;
  onClick: (slug: string) => void;
}) {
  const orbitRef = useRef<THREE.Group>(null!);
  const moonRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  // seed initial orbital angle once via ref (avoid JSX `rotation` prop being
  // re-applied on hover re-renders, which would reset accumulated rotation).
  useEffect(() => {
    if (orbitRef.current) orbitRef.current.rotation.y = moon.initialAngle;
  }, [moon.initialAngle]);

  useFrame((_, delta) => {
    if (orbitRef.current) orbitRef.current.rotation.y += moon.orbitSpeed * delta;
    if (moonRef.current) moonRef.current.rotation.y += delta * 0.3;
  });

  return (
    <group rotation={[moon.orbitTilt[0], 0, moon.orbitTilt[1]]}>
      <OrbitRing radius={moon.orbitRadius} opacity={0.01} segments={96} />
      <group ref={orbitRef}>
        <group position={[moon.orbitRadius, 0, 0]}>
          <mesh
            ref={moonRef}
            scale={hovered ? 1.15 : 1}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(true);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              setHovered(false);
              document.body.style.cursor = "default";
            }}
            onClick={(e) => {
              e.stopPropagation();
              onClick(moon.slug);
            }}
          >
            <sphereGeometry args={[moon.size, 48, 48]} />
            <MaybeTexturedMaterial
              variant={moon.material}
              color={moon.color}
              iridescenceColor={moon.iridescenceColor}
              texturePath={moon.texturePath}
              breathTrough={moon.breathTrough}
              glowScale={moon.glowScale}
            />
          </mesh>
          <PlanetLabel
            name={moon.name.en}
            planetRadius={moon.size}
            hovered={hovered}
          />
        </group>
      </group>
    </group>
  );
}

/** Single glass-bead planet — dichroic / iridescent physical material.
 *  Structure: tilted-plane (parent) → orbitRef (revolves around sun) →
 *  radial offset → Float (bob) → bodyRef (self-rotates) + label + moons.
 *  The orbit rotation runs every frame independent of mouse, so the planet
 *  always glides along its ring. Mouse-driven system rotation in PlanetSystem
 *  layers on top. */
function Planet({
  planet,
  onClick,
}: {
  planet: Planet;
  onClick: (slug: string) => void;
}) {
  const orbitRef = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  // seed initial orbital angle once via ref (avoid JSX `rotation` prop being
  // re-applied on hover re-renders, which would reset accumulated rotation).
  useEffect(() => {
    if (orbitRef.current) orbitRef.current.rotation.y = planet.angle;
  }, [planet.angle]);

  useFrame((_, delta) => {
    if (orbitRef.current) orbitRef.current.rotation.y += planet.orbitSpeed * delta;
    if (bodyRef.current) bodyRef.current.rotation.y += delta * 0.15;
  });

  return (
    <group ref={orbitRef}>
      <group position={[planet.orbitRadius, 0, 0]}>
        <Float speed={0.8} rotationIntensity={0.15} floatIntensity={0.12}>
          {/* planet body — self-rotates */}
          <group
            ref={bodyRef}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(true);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              setHovered(false);
              document.body.style.cursor = "default";
            }}
            onClick={(e) => {
              e.stopPropagation();
              onClick(planet.slug);
            }}
          >
            <mesh scale={hovered ? 1.1 : 1}>
              <sphereGeometry args={[planet.size, 64, 64]} />
              <MaybeTexturedMaterial
                variant={planet.material}
                color={planet.color}
                iridescenceColor={planet.iridescenceColor}
                texturePath={planet.texturePath}
                waterFlow={planet.waterFlow}
                breathTrough={planet.breathTrough}
                pulse={planet.pulse}
              />
            </mesh>
            {planet.cloudShell && (
              <CloudShell
                size={planet.size * (hovered ? 1.1 : 1)}
                opacity={planet.cloudOpacity}
                tintColor={planet.cloudColor}
              />
            )}
          </group>

          {/* curved 3D chromatic label wrapping the planet's equator — sibling
              of body so it doesn't spin with body's self-rotation.
              Always reads `name.en` so the floating spatial label
              stays in latin script regardless of the EN/中 toggle —
              that's a deliberate split from the INDEX dropdown +
              modal, which both swap language. */}
          <PlanetLabel
            name={planet.name.en}
            planetRadius={planet.size}
            hovered={hovered}
          />

          {/* moons — orbit the planet's center independently */}
          {planet.moons?.map((m) => (
            <MoonSystem key={m.slug} moon={m} onClick={onClick} />
          ))}
        </Float>
      </group>
    </group>
  );
}

/** Procedural grayscale value-noise texture, used as a displacement
 *  map. Sums multiple octaves of hash-noise on a canvas, normalises
 *  to 0..255, returns a CanvasTexture. Cached via useMemo so it
 *  builds once per mount. */
function useNoiseDisplacementMap(
  size = 512,
  frequency = 6,
  octaves = 4
): THREE.CanvasTexture | null {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const img = ctx.createImageData(size, size);

    // Tiny seeded hash for repeatable noise across reloads.
    const hash = (x: number, y: number) => {
      const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return n - Math.floor(n);
    };
    const smooth = (t: number) => t * t * (3 - 2 * t);
    const valueNoise = (x: number, y: number) => {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const xf = x - xi;
      const yf = y - yi;
      const u = smooth(xf);
      const v = smooth(yf);
      const a = hash(xi, yi);
      const b = hash(xi + 1, yi);
      const c = hash(xi, yi + 1);
      const d = hash(xi + 1, yi + 1);
      return (
        a * (1 - u) * (1 - v) +
        b * u * (1 - v) +
        c * (1 - u) * v +
        d * u * v
      );
    };

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = (x / size) * frequency;
        const v = (y / size) * frequency;
        let amp = 0.5;
        let freq = 1;
        let total = 0;
        for (let o = 0; o < octaves; o++) {
          total += valueNoise(u * freq, v * freq) * amp;
          freq *= 2;
          amp *= 0.5;
        }
        const g = Math.max(0, Math.min(255, Math.floor(total * 255)));
        const idx = (y * size + x) * 4;
        img.data[idx] = g;
        img.data[idx + 1] = g;
        img.data[idx + 2] = g;
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }, [size, frequency, octaves]);
}

/** Procedural wispy cloud texture — same fbm value-noise as the
 *  displacement map, but emits RGBA with the noise pushed through
 *  a soft threshold to keep only the bright fbm peaks. Result: most
 *  of the sphere is fully transparent (alpha 0), with a few warm
 *  cream-coloured wisps that read as drifting atmosphere when wrapped
 *  on a slightly larger outer sphere.
 *
 *  - threshold: noise below this is fully transparent
 *  - softness: width of the transparent → opaque ramp
 *  - tint: RGB of the cloud body
 */
function useCloudTexture(
  size = 512,
  frequency = 7, // was 4 — finer wisps = more even sphere coverage, no "single hemisphere lump"
  octaves = 4,
  threshold = 0.48, // was 0.55 — more total coverage so patches stitch into bands
  softness = 0.42, // was 0.25 — wider 0→1 ramp kills the hard dividing line
  tint: [number, number, number] = [245, 224, 208]
): THREE.CanvasTexture | null {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const img = ctx.createImageData(size, size);

    // shared hash-based value noise (kept inline to avoid a refactor of
    // the displacement map's private helpers — both functions are short).
    const hash = (x: number, y: number) => {
      const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return n - Math.floor(n);
    };
    const smooth = (t: number) => t * t * (3 - 2 * t);
    const valueNoise = (x: number, y: number) => {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const xf = x - xi;
      const yf = y - yi;
      const u = smooth(xf);
      const v = smooth(yf);
      const a = hash(xi, yi);
      const b = hash(xi + 1, yi);
      const c = hash(xi, yi + 1);
      const d = hash(xi + 1, yi + 1);
      return (
        a * (1 - u) * (1 - v) +
        b * u * (1 - v) +
        c * (1 - u) * v +
        d * u * v
      );
    };

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = (x / size) * frequency;
        const v = (y / size) * frequency;
        let amp = 0.5;
        let freq = 1;
        let total = 0;
        for (let o = 0; o < octaves; o++) {
          total += valueNoise(u * freq, v * freq) * amp;
          freq *= 2;
          amp *= 0.5;
        }
        // map fbm value through soft threshold → alpha curve
        const a = Math.max(0, Math.min(1, (total - threshold) / softness));
        const idx = (y * size + x) * 4;
        img.data[idx] = tint[0];
        img.data[idx + 1] = tint[1];
        img.data[idx + 2] = tint[2];
        img.data[idx + 3] = Math.floor(a * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }, [size, frequency, octaves, threshold, softness, tint]);
}

/** Outer wispy cloud shell that wraps a planet at a slightly larger
 *  scale and counter-rotates slowly relative to the surface beneath it
 *  for a sense of drifting atmosphere.
 *
 *  Uses a tiny custom ShaderMaterial so we can multiply the cloud's
 *  alpha by a fresnel term (pow(N·V, p)). Without it the outer sphere's
 *  silhouette is visible as a "helmet" arc wherever the cloud texture
 *  happens to be opaque at the rim — fresnel pushes rim alpha to 0 so
 *  clouds only show on the camera-facing front of the shell and feather
 *  invisibly into the planet at the edge. */
function CloudShell({
  size,
  opacity = 0.7,
  tintColor,
}: {
  size: number;
  opacity?: number;
  /** optional colour multiplier on the cloud texture's RGB. Default
   *  white = no tint (preserves concept's neutral fog). Set to
   *  e.g. "#f0c060" for a golden mist. */
  tintColor?: string;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const tex = useCloudTexture();
  const tint = useMemo(
    () => new THREE.Color(tintColor ?? "#ffffff"),
    [tintColor]
  );
  const uniforms = useMemo(
    () => ({
      tCloud: { value: tex },
      uOpacity: { value: opacity },
      uFresnelPower: { value: 1.8 },
      uTint: { value: tint },
    }),
    [tex, opacity, tint]
  );
  useFrame((_, delta) => {
    // negative spin = counter-drift vs body's positive 0.15 rad/s self-rotation
    if (ref.current) ref.current.rotation.y -= delta * 0.08;
  });
  return (
    <mesh ref={ref} scale={size * 1.03}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          varying vec3 vNormalW;
          varying vec3 vViewW;
          void main() {
            vUv = uv;
            vNormalW = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vViewW = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          uniform sampler2D tCloud;
          uniform float uOpacity;
          uniform float uFresnelPower;
          uniform vec3 uTint;
          varying vec2 vUv;
          varying vec3 vNormalW;
          varying vec3 vViewW;
          void main() {
            vec4 c = texture2D(tCloud, vUv);
            float ndv = clamp(dot(normalize(vNormalW), normalize(vViewW)), 0.0, 1.0);
            float fresnel = pow(ndv, uFresnelPower);
            float a = c.a * fresnel * uOpacity;
            if (a < 0.01) discard;
            gl_FragColor = vec4(c.rgb * uTint, a);
          }
        `}
      />
    </mesh>
  );
}

/** Central sun — locked spec per user direction (DO NOT drift from this):
 *
 *  Identity:
 *    A micro-sun, but artistically interpreted as a softly glowing
 *    crystalline glass orb (the "lit gemstone"). NOT photoreal solar
 *    plasma. Brightness is gentle — you should still clearly see the
 *    bumpy surface; never blinding.
 *
 *  Center-glow:
 *    Solved at the TEXTURE layer (the panorama paints bright/dark
 *    facets to fake interior light). Do NOT add code-side inner
 *    spheres or fancy "core glow" shaders — the texture is doing it.
 *
 *  Displacement (LOCKED — do not edit without explicit user instruction):
 *    frequency 28, scale 0.10, bias -0.05, octaves 4. The bumpy
 *    silhouette is at the level the user signed off on; further
 *    tweaks are off-limits unless asked for.
 *
 *  Pulse:
 *    Emissive intensity breathes ~0.35 → 0.55 with a slow rhythm
 *    (period ~5s) so the orb feels alive.
 *
 *  Scene role:
 *    Visual-only emission. Does NOT cast light on the 9 planets
 *    (they're lit independently). The pointLight is therefore
 *    removed from this component.
 *
 *  Iridescence:
 *    Kept at 1.0 so future nebula light will naturally tint the
 *    rim with the cosmic colour palette. */
function AmberSun() {
  const tex = useTexture("/sun-pano-3.png");
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null!);
  // LOCKED — do not change these three numbers without explicit ask.
  const displacement = useNoiseDisplacementMap(512, 28, 4);

  useFrame((state, delta) => {
    if (meshRef.current) meshRef.current.rotation.y -= delta * 0.1;
    if (matRef.current) {
      // gentle breathing pulse: 0.6..0.8, ~5s period
      const t = state.clock.elapsedTime;
      matRef.current.emissiveIntensity = 0.7 + Math.sin(t * 1.2) * 0.1;
    }
  });

  return (
    <Float speed={0.6} rotationIntensity={0.08} floatIntensity={0.12}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.2, 256, 256]} />
        <meshPhysicalMaterial
          ref={matRef}
          map={tex}
          emissiveMap={tex}
          emissive="#ffffff"
          emissiveIntensity={0.7}
          displacementMap={displacement}
          displacementScale={0.1} /* LOCKED */
          displacementBias={-0.05} /* LOCKED */
          transmission={0.3}
          thickness={1.2}
          ior={1.5}
          roughness={0.12}
          metalness={0}
          iridescence={1.0}
          iridescenceIOR={1.3}
          iridescenceThicknessRange={[300, 800]}
          clearcoat={1.0}
          clearcoatRoughness={0.18}
          attenuationColor="#fff0d4"
          attenuationDistance={3.0}
        />
      </mesh>
      {/* Sun pointLight removed: per spec, the sun does not illuminate
          the 9 planets. Planet lighting is independent. */}
    </Float>
  );
}

/** Experimental dispersion variant of AmberSun.
 *
 *  Same identity / displacement / pulse spec as AmberSun (all LOCKED
 *  params copied verbatim), but the material is swapped from raw
 *  MeshPhysicalMaterial to drei's MeshTransmissionMaterial — which is
 *  the production-grade implementation of the FBO-based refraction +
 *  chromatic aberration technique Maxime Heckel's tutorial describes
 *  (multi-pass render, per-channel IOR offset, anisotropic blur).
 *
 *  What you get on top of AmberSun:
 *  - chromaticAberration → real R/G/B dispersion at the rim
 *  - anisotropy / anisotropicBlur → directional smear across the bumps
 *  - distortion + temporalDistortion → subtle living-glass shimmer
 *  - backside refraction → light bends twice through the sphere
 *
 *  Pano texture, emissive amber tone, breathing pulse and noise
 *  displacement are all preserved verbatim. */
function DispersionSun() {
  const tex = useTexture("/sun-pano-3.png");
  const meshRef = useRef<THREE.Mesh>(null!);
  // drei's MeshTransmissionMaterial uses its own ref type, so we relax via any.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matRef = useRef<any>(null!);
  const displacement = useNoiseDisplacementMap(512, 28, 4);

  useFrame((state, delta) => {
    if (meshRef.current) meshRef.current.rotation.y -= delta * 0.1;
    if (matRef.current) {
      const t = state.clock.elapsedTime;
      matRef.current.emissiveIntensity = 0.7 + Math.sin(t * 1.2) * 0.1;
    }
  });

  return (
    <Float speed={0.6} rotationIntensity={0.08} floatIntensity={0.12}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.2, 256, 256]} />
        <MeshTransmissionMaterial
          ref={matRef}
          map={tex}
          emissiveMap={tex}
          emissive="#ffffff"
          emissiveIntensity={0.7}
          displacementMap={displacement}
          displacementScale={0.1} /* LOCKED */
          displacementBias={-0.05} /* LOCKED */
          /* base glass */
          transmission={0.5}
          thickness={1.2}
          ior={1.5}
          roughness={0.12}
          /* the dispersion that AmberSun couldn't do */
          chromaticAberration={0.35}
          anisotropy={0.3}
          anisotropicBlur={0.6}
          distortion={0.15}
          distortionScale={0.4}
          temporalDistortion={0.1}
          /* light bends through both surfaces of the sphere */
          backside
          backsideThickness={1.5}
          /* FBO render quality (samples ↑ = smoother dispersion, slower) */
          samples={6}
          resolution={1024}
          /* iridescent rim kept identical to AmberSun spec */
          iridescence={1.0}
          iridescenceIOR={1.3}
          iridescenceThicknessRange={[300, 800]}
          clearcoat={1.0}
          clearcoatRoughness={0.18}
          attenuationColor="#fff0d4"
          attenuationDistance={3.0}
          transparent
          opacity={0.85}
        />
      </mesh>
    </Float>
  );
}

/** Third sun variant — focuses on internal glow, not dispersion.
 *
 *  Built on plain MeshPhysicalMaterial (like AmberSun) but with the
 *  translucency technique from mattdesl's "fast subsurface scattering"
 *  gist (ice.frag, USE_TRANSLUCENCY block) ported in via onBeforeCompile.
 *
 *  Original mattdesl version iterated over scene point lights. Since
 *  we don't have a sun pointLight (per spec — sun must not illuminate
 *  the 9 planets), we collapse the math for the case "light at sphere
 *  centre": L = -N, so the SSS contribution reduces to
 *      pow(saturate(dot(V, N)), power) * scale
 *  i.e. a Fresnel-inverse glow concentrated where the surface normal
 *  faces the viewer — like an amber bead lit by a flame in its core.
 *
 *  No dispersion. No screen-space refraction. Just warm light bleeding
 *  through the geometry.
 *
 *  LOCKED spec (per user direction): same pano texture, same
 *  displacement (28/0.10/-0.05/4), pulse 0.4..0.9 / ~3s (deeper +
 *  faster breath than the original 0.6..0.8 / 5s — explicit user
 *  override on both range and tempo),
 *  no sun-side light affecting planets. */
function AmberCoreSun() {
  const tex = useTexture("/sun-pano-3.png");
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null!);
  const displacement = useNoiseDisplacementMap(512, 28, 4);

  // SSS knobs — kept as live uniforms so you can hot-tune them
  // without recompiling the shader.
  const sssUniforms = useMemo(
    () => ({
      uThicknessPower: { value: 4.0 }, // 2 = wide soft glow, 12 = tight hot spot
      uThicknessScale: { value: 1.4 }, // overall SSS brightness
      uThicknessAmbient: { value: 0.22 }, // baseline warmth everywhere on the surface
      uSSSColor: { value: new THREE.Color("#e8a85f") }, // amber glow tone
    }),
    []
  );

  // onBeforeCompile: splice the SSS uniforms + math into MeshPhysicalMaterial's
  // fragment shader. We hook after the lights pass has set up `normal` and
  // `vViewPosition`, and before <lights_fragment_end> finalises composition.
  const onBeforeCompile = (
    shader: THREE.WebGLProgramParametersWithUniforms
  ) => {
    shader.uniforms.uThicknessPower = sssUniforms.uThicknessPower;
    shader.uniforms.uThicknessScale = sssUniforms.uThicknessScale;
    shader.uniforms.uThicknessAmbient = sssUniforms.uThicknessAmbient;
    shader.uniforms.uSSSColor = sssUniforms.uSSSColor;

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
        uniform float uThicknessPower;
        uniform float uThicknessScale;
        uniform float uThicknessAmbient;
        uniform vec3 uSSSColor;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <lights_fragment_end>",
      `{
          vec3 vSSS = normalize(vViewPosition);
          vec3 nSSS = normal;
          float ndvSSS = clamp(dot(vSSS, nSSS), 0.0, 1.0);
          vec3 sssGlow = pow(ndvSSS, uThicknessPower) * uThicknessScale * uSSSColor;
          reflectedLight.directDiffuse += sssGlow + uThicknessAmbient * uSSSColor;
        }
        #include <lights_fragment_end>`
    );
  };

  useFrame((state, delta) => {
    if (meshRef.current) meshRef.current.rotation.y -= delta * 0.1;
    if (matRef.current) {
      const t = state.clock.elapsedTime;
      // pulse 0.4..0.9 (centre 0.65, amplitude 0.25), period ~3.1s
      matRef.current.emissiveIntensity = 0.65 + Math.sin(t * 2.0) * 0.25;
    }
  });

  return (
    <Float speed={0.6} rotationIntensity={0.08} floatIntensity={0.12}>
      <mesh
        ref={meshRef}
        // Sun acts as the "About Me" portal. Hard navigation rather than
        // next/router because this is inside an R3F event chain and the
        // app router instance would otherwise need to be plumbed through
        // several layers of context. The destination is a real Next.js
        // page at /about, fully prefetched.
        onClick={(e) => {
          e.stopPropagation();
          window.location.href = "/about";
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[1.2, 256, 256]} />
        <meshPhysicalMaterial
          ref={matRef}
          map={tex}
          emissiveMap={tex}
          emissive="#ffffff"
          emissiveIntensity={0.7}
          displacementMap={displacement}
          displacementScale={0.1} /* LOCKED */
          displacementBias={-0.05} /* LOCKED */
          transmission={0.3}
          thickness={1.2}
          ior={1.5}
          roughness={0.12}
          metalness={0}
          iridescence={1.0}
          iridescenceIOR={1.3}
          iridescenceThicknessRange={[300, 800]}
          clearcoat={1.0}
          clearcoatRoughness={0.18}
          attenuationColor="#fff0d4"
          attenuationDistance={3.0}
          transparent
          opacity={0.85}
          onBeforeCompile={onBeforeCompile}
        />
      </mesh>
    </Float>
  );
}

/** Soft round particle sprite — a radial-gradient circle that fades
 *  to alpha 0 at the edge. Gives every particle a tiny soft glow shape
 *  rather than a hard polygon. Drawn once and cached. */
function useSoftCircleTexture(): THREE.Texture | null {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.clearRect(0, 0, 128, 128);

    // Flat circle base — lowered to ~82% brightness so the frosted
    // highlight has clear headroom.  Soft alpha rim keeps the
    // silhouette from reading as a hard pixel square.
    const flat = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
    flat.addColorStop(0.0, "rgba(210,210,210,1)");
    flat.addColorStop(0.82, "rgba(210,210,210,1)");
    flat.addColorStop(0.94, "rgba(210,210,210,0.55)");
    flat.addColorStop(1.0, "rgba(210,210,210,0)");
    ctx.fillStyle = flat;
    ctx.fillRect(0, 0, 128, 128);

    // Frosted upper-left highlight — bigger area, stronger alpha so
    // it's still legible at small render sizes (3-5 CSS px).  Pulls
    // that region from 82% → ~97% brightness; reads as a diffuse
    // matte highlight, not a 3D specular spot.
    const hi = ctx.createRadialGradient(48, 42, 0, 48, 42, 40);
    hi.addColorStop(0.0, "rgba(255,255,255,0.85)");
    hi.addColorStop(0.4, "rgba(255,255,255,0.55)");
    hi.addColorStop(1.0, "rgba(255,255,255,0)");
    ctx.fillStyle = hi;
    ctx.fillRect(0, 0, 128, 128);

    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }, []);
}

/* ─── 3D value noise + fbm — drives NebulaField cloud shape.
   Particle density and per-particle brightness both follow fbm(pos),
   so the cloud has organic bright cores and dark voids rather than
   uniform random scatter. */
function hash3D(x: number, y: number, z: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
}
function smoothStep01(t: number): number {
  return t * t * (3 - 2 * t);
}
function valueNoise3D(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = x - xi;
  const yf = y - yi;
  const zf = z - zi;
  const u = smoothStep01(xf);
  const v = smoothStep01(yf);
  const w = smoothStep01(zf);
  const c000 = hash3D(xi, yi, zi);
  const c100 = hash3D(xi + 1, yi, zi);
  const c010 = hash3D(xi, yi + 1, zi);
  const c110 = hash3D(xi + 1, yi + 1, zi);
  const c001 = hash3D(xi, yi, zi + 1);
  const c101 = hash3D(xi + 1, yi, zi + 1);
  const c011 = hash3D(xi, yi + 1, zi + 1);
  const c111 = hash3D(xi + 1, yi + 1, zi + 1);
  const c00 = c000 * (1 - u) + c100 * u;
  const c10 = c010 * (1 - u) + c110 * u;
  const c01 = c001 * (1 - u) + c101 * u;
  const c11 = c011 * (1 - u) + c111 * u;
  const c0 = c00 * (1 - v) + c10 * v;
  const c1 = c01 * (1 - v) + c11 * v;
  return c0 * (1 - w) + c1 * w;
}
function fbm3D(x: number, y: number, z: number, octaves: number): number {
  let n = 0;
  let amp = 1;
  let freq = 1;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    n += valueNoise3D(x * freq, y * freq, z * freq) * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return n / max;
}

/** Procedural hex sprite — kept for the old NebulaPatches API; new
 *  rich nebulas use useSoftCircleTexture instead. */
function useHexTexture(): THREE.Texture | null {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.clearRect(0, 0, 64, 64);
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      const x = 32 + Math.cos(a) * 26;
      const y = 32 + Math.sin(a) * 26;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }, []);
}

/** One colour patch inside a nebula — a tight cluster of similarly
 *  coloured hex flakes generated from a 3D gaussian around the patch
 *  centre. Position offset is RELATIVE to the parent NebulaPatches
 *  group, so the caller can compose several patches into one cloud
 *  shape. */
type NebulaPatch = {
  /** offset from cloud centre (world units) */
  offset: [number, number, number];
  color: string;
  /** number of hex particles in this patch */
  count: number;
  /** ~standard deviation of the cluster (world units) */
  radius: number;
  /** sprite size (world units) — typical 0.6–2.0 */
  size: number;
  /** sprite alpha — 1.0 = opaque, lower lets background through */
  opacity?: number;
};

function PatchCluster({
  patch,
  hexTex,
}: {
  patch: NebulaPatch;
  hexTex: THREE.Texture | null;
}) {
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(patch.count * 3);
    const colors = new Float32Array(patch.count * 3);
    const base = new THREE.Color(patch.color);
    for (let i = 0; i < patch.count; i++) {
      // box-muller for gaussian distance, uniform spherical direction
      const u = Math.random();
      const v = Math.random();
      const r = patch.radius * Math.sqrt(-2 * Math.log(u + 1e-6)) * 0.5;
      const theta = 2 * Math.PI * v;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = patch.offset[0] + r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] =
        patch.offset[1] + r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = patch.offset[2] + r * Math.cos(phi);
      // small per-particle tone shift so the patch isn't dead-flat
      const variance = (Math.random() - 0.5) * 0.2;
      colors[i * 3] = Math.max(0, Math.min(1, base.r + variance));
      colors[i * 3 + 1] = Math.max(0, Math.min(1, base.g + variance));
      colors[i * 3 + 2] = Math.max(0, Math.min(1, base.b + variance));
    }
    return { positions, colors };
  }, [patch]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={hexTex}
        size={patch.size}
        vertexColors
        transparent
        opacity={patch.opacity ?? 1.0}
        alphaTest={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/** Patch-based nebula — a small group of distinct colour clusters at a
 *  single position. Each patch holds one dominant colour, so the cloud
 *  reads as "magenta patch + violet patch + cyan splash + gold flecks"
 *  rather than uniform glitter haze. Matte hex flakes (not glowing). */
function NebulaPatches({
  position,
  patches,
}: {
  position: [number, number, number];
  patches: NebulaPatch[];
}) {
  const hexTex = useHexTexture();
  return (
    <group position={position}>
      {patches.map((p, i) => (
        <PatchCluster key={i} patch={p} hexTex={hexTex} />
      ))}
    </group>
  );
}

/** Sub-cluster within a rich nebula. Each sub-cluster contributes
 *  particles around its centre, drawing colours from its own small
 *  palette. Multiple sub-clusters together build an organic
 *  branching cloud shape (vs a single round gaussian). */
type RichSub = {
  /** offset from the nebula centre (world units) */
  center: [number, number, number];
  /** standard-deviation-ish cluster radius (world units) */
  radius: number;
  /** how many particles to seed from this sub */
  count: number;
  /** colours sampled from for this sub — perturbed in HSL per particle
   *  so even one palette entry yields dozens of visible shades */
  palette: string[];
};

/** Rich, tiny-particle nebula — soft round colour-varied dots arranged
 *  in 3-4 sub-clusters that compose an organic branching cloud shape.
 *  Per-particle HSL perturbation gives a far wider colour range than
 *  the patch's discrete palette would suggest. Matte (no additive
 *  blending) — particles read as true coloured confetti, not glow.
 *
 *  Particle sprites use a radial-gradient soft-edge circle so each
 *  point has a tiny fuzzy halo rather than a hard polygon edge. */
function RichNebula({
  position,
  subs,
  particleSize = 0.22,
  hueJitter = 0.06,
  satJitter = 0.25,
  lightJitter = 0.3,
}: {
  position: [number, number, number];
  subs: RichSub[];
  /** world-space size of each particle */
  particleSize?: number;
  /** ±range of HSL hue perturbation per particle (0..1 hue space) */
  hueJitter?: number;
  satJitter?: number;
  lightJitter?: number;
}) {
  const tex = useSoftCircleTexture();

  const { positions, colors } = useMemo(() => {
    const total = subs.reduce((s, x) => s + x.count, 0);
    const positions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    const hsl = { h: 0, s: 0, l: 0 };
    let idx = 0;

    for (const sub of subs) {
      const baseColors = sub.palette.map((c) => new THREE.Color(c));
      for (let i = 0; i < sub.count; i++) {
        // box-muller for gaussian radial distance, uniform spherical dir
        const u = Math.random();
        const r =
          sub.radius * Math.sqrt(-2 * Math.log(u + 1e-6)) * 0.45;
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        positions[idx * 3] =
          sub.center[0] + r * Math.sin(phi) * Math.cos(theta);
        positions[idx * 3 + 1] =
          sub.center[1] + r * Math.sin(phi) * Math.sin(theta);
        positions[idx * 3 + 2] = sub.center[2] + r * Math.cos(phi);

        // pick a palette colour, perturb it in HSL space so even one
        // base swatch yields many visible shades.
        const base = baseColors[Math.floor(Math.random() * baseColors.length)];
        base.getHSL(hsl);
        const h = (hsl.h + (Math.random() - 0.5) * hueJitter + 1) % 1;
        const s = Math.max(
          0.05,
          Math.min(1, hsl.s + (Math.random() - 0.5) * satJitter)
        );
        const l = Math.max(
          0.1,
          Math.min(0.95, hsl.l + (Math.random() - 0.5) * lightJitter)
        );
        const out = new THREE.Color().setHSL(h, s, l);
        colors[idx * 3] = out.r;
        colors[idx * 3 + 1] = out.g;
        colors[idx * 3 + 2] = out.b;
        idx++;
      }
    }
    return { positions, colors };
  }, [subs, hueJitter, satJitter, lightJitter]);

  return (
    <points position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={tex}
        size={particleSize}
        vertexColors
        transparent
        sizeAttenuation
        depthWrite={false}
        alphaTest={0.3}
      />
    </points>
  );
}

/** Noise-driven nebula cloud.  Replaces RichNebula's discrete sub-cluster
 *  generation with rejection sampling against a 3D fbm noise field.
 *
 *  Particles are seeded uniformly in a bounding box, then kept only
 *  where fbm(pos) > densityThreshold.  Each kept particle's brightness
 *  scales with how far above the threshold it is, so the cloud has
 *  organic bright cores and dark voids — looks like real nebula
 *  photography rather than randomly scattered confetti.
 *
 *  A secondary, slower noise channel chooses which colour palette
 *  band the particle samples from, so different regions of the cloud
 *  lean different hues (deep purple core → blue mid → bright cyan rim,
 *  smoothly transitioning).  All within the deep blue-purple identity
 *  the user locked. */
function NebulaField({
  position,
  rotation,
  extents,
  count,
  particleSize,
  noiseFreq = 0.4,
  densityThreshold = 0.42,
  octaves = 4,
  palettes,
  hueJitter = 0.05,
  satJitter = 0.25,
  lightJitter = 0.25,
  hueZoneScale = 0.2,
  hueSkew = 1.6,
  layerAxis = "y",
  layerFreq = 2.5,
  layerPhase = 0.3,
  layerContrast = 0.6,
  centerBoost = 0,
  centerBoostFalloff = 2,
  shape = "box",
  gradientAxis,
  gradientColors,
  gradientMix = 0.45,
  archAmount = 0,
}: {
  position: [number, number, number];
  /** Optional Euler rotation (radians) applied to the whole points
   *  object.  Useful for tilting a long horizontal cloud — e.g.
   *  rotation=[0,0,0.1745] = +10° around Z (counter-clockwise as
   *  seen from the camera). */
  rotation?: [number, number, number];
  /** half-extents of the bounding box.  particles sampled in ±extents[i]. */
  extents: [number, number, number];
  /** target particle count (after rejection) */
  count: number;
  particleSize: number;
  /** higher = smaller noise features (more wispy detail) */
  noiseFreq?: number;
  /** lower → more particles kept; higher → tighter dense regions */
  densityThreshold?: number;
  octaves?: number;
  /** palette bands selected by a secondary hue-noise channel.
   *  Index 0 = darkest regions, index last = brightest core regions. */
  palettes: string[][];
  hueJitter?: number;
  satJitter?: number;
  lightJitter?: number;
  /** how big the colour zones are vs the density features.  Lower =
   *  larger contiguous regions of one colour band (less scattered). */
  hueZoneScale?: number;
  /** exponent that biases palette index.  >1 weights darker bands,
   *  <1 weights brighter bands.  1.6 ≈ 65% dark / 25% mid / 10% bright. */
  hueSkew?: number;
  /** which axis carries the sinusoidal layered brightness pattern. */
  layerAxis?: "x" | "y" | "z";
  /** angular frequency of the layered brightness sin wave.
   *  2π/freq ≈ layer thickness in world units. */
  layerFreq?: number;
  /** phase offset of the layer wave so layers don't align at the
   *  centre of the bounding box. */
  layerPhase?: number;
  /** how strongly the layer wave modulates brightness.
   *  0 = no layering, 1 = full alternation between dark and bright. */
  layerContrast?: number;
  /** extra "fill" applied to the noise value, peaking at cloud centre
   *  and falling off radially.  0 = no boost (centre may have voids),
   *  0.3-0.6 = centre stays densely packed regardless of noise. */
  centerBoost?: number;
  /** how fast the centre boost falls off with normalised distance.
   *  Higher = boost is tighter around the centre. */
  centerBoostFalloff?: number;
  /** outer silhouette to mask the sampling box.
   *   "box"  — full bounding box (default)
   *   "invertedTriangle" — downward-pointing pyramid: wide at top,
   *                        narrows to a point at the bottom centre.
   *   "ellipsoid" — rounded sphere/oval inscribed in the bounding box. */
  shape?: "box" | "invertedTriangle" | "ellipsoid" | "diamond" | "tearLeft";
  /** Optional positional colour gradient.  When set, every particle's
   *  final colour is lerped toward an axis-interpolated colour between
   *  gradientColors[0] (axis low end) and gradientColors[1] (high end).
   *  Use with a long ellipsoid + horizontal gradient to make a bridge
   *  cloud that fades from one hue family to another across its width. */
  gradientAxis?: "x" | "y" | "z";
  gradientColors?: [string, string];
  /** Blend strength toward the gradient colour (0 = palette unchanged,
   *  1 = particle takes the pure gradient colour). Default 0.45. */
  gradientMix?: number;
  /** Parabolic Y warp applied AFTER the shape mask: each particle's Y
   *  is shifted by archAmount × (1 - (x/extents[0])²).  Positive lifts
   *  the middle up → ∩ / inverted-U arch.  Negative drops the middle →
   *  U / smile.  In world units (so 0.3 lifts the centre by 0.3 world
   *  units relative to the ends). */
  archAmount?: number;
}) {
  const tex = useSoftCircleTexture();

  const { positions, colors, sizes, phases, speeds } = useMemo(() => {
    const posArr: number[] = [];
    const colArr: number[] = [];
    const sizeArr: number[] = [];
    const phaseArr: number[] = [];
    const speedArr: number[] = [];
    const hsl = { h: 0, s: 0, l: 0 };
    const maxAttempts = count * 14;
    let attempts = 0;
    let generated = 0;

    while (generated < count && attempts < maxAttempts) {
      attempts++;
      const x = (Math.random() - 0.5) * 2 * extents[0];
      const y = (Math.random() - 0.5) * 2 * extents[1];
      const z = (Math.random() - 0.5) * 2 * extents[2];

      // Silhouette mask — clip the box down to the chosen shape
      // before any noise/edge logic runs.
      if (shape === "invertedTriangle") {
        // Downward-pointing pyramid: full extent at y=+extents[1],
        // narrows linearly to a point at y=-extents[1].
        const yRatio = (y + extents[1]) / (2 * extents[1]); // 0 at bottom, 1 at top
        if (
          Math.abs(x) > extents[0] * yRatio ||
          Math.abs(z) > extents[2] * yRatio
        )
          continue;
      } else if (shape === "ellipsoid") {
        // Rounded sphere/oval inscribed in the bounding box: reject any
        // sample outside the unit ellipsoid in normalised coordinates.
        const dnSq =
          (x / extents[0]) ** 2 +
          (y / extents[1]) ** 2 +
          (z / extents[2]) ** 2;
        if (dnSq > 1) continue;
      } else if (shape === "diamond") {
        // 2D rhombus / diamond in the XY plane (Z keeps box thickness so
        // the silhouette reads as a flat diamond facing the camera).
        // Manhattan distance: |x/ex| + |y/ey| ≤ 1 → corners at (±ex,0)
        // and (0,±ey). Width:height ratio = (2·ex) : (2·ey) = ex : ey.
        const dn = Math.abs(x / extents[0]) + Math.abs(y / extents[1]);
        if (dn > 1) continue;
      } else if (shape === "tearLeft") {
        // Horizontal teardrop pointing LEFT.  At x = +extents[0] the
        // cross-section is a full ellipse (semi-axes extents[1],
        // extents[2]); at x = -extents[0] it tapers to a single point.
        // pow(xRatio, 0.65) softens the taper so the pointy tail isn't
        // razor-thin and keeps a few wisps trailing out the left end.
        const xRatio = (x + extents[0]) / (2 * extents[0]); // 0 left, 1 right
        const r = Math.pow(xRatio, 0.65);
        if (r <= 0) continue;
        const dnSq =
          (y / (extents[1] * r)) ** 2 +
          (z / (extents[2] * r)) ** 2;
        if (dnSq > 1) continue;
      }

      // Normalised distance from the cloud centre — used both for the
      // soft edge falloff and for the optional centre-boost fill.
      const distNorm = Math.sqrt(
        (x / extents[0]) ** 2 +
          (y / extents[1]) ** 2 +
          (z / extents[2]) ** 2
      );
      // Density at this position — controls whether the particle survives.
      // centerBoost fills the noise's natural voids near the cloud
      // centre, so the core stays densely packed even when noise dips.
      const boost = centerBoost * Math.exp(-distNorm * centerBoostFalloff);
      const n =
        fbm3D(x * noiseFreq, y * noiseFreq, z * noiseFreq, octaves) + boost;
      if (n < densityThreshold) continue;

      // Soft edge falloff so the box boundary doesn't crop a hard edge.
      const edge = Math.max(0, 1 - distNorm * distNorm);
      if (Math.random() > Math.min(1, edge * 1.3)) continue;

      // intensity in [0..1] = how far above the threshold this point sits.
      const intensity = (n - densityThreshold) / (1 - densityThreshold);

      // Secondary, slower noise picks the palette band — gives the
      // cloud broad colour zones rather than uniform mix everywhere.
      // hueZoneScale controls how big those zones are: lower = larger
      // contiguous colour regions (less scattered bright specks).
      const hueNoise = fbm3D(
        x * noiseFreq * hueZoneScale + 100,
        y * noiseFreq * hueZoneScale + 100,
        z * noiseFreq * hueZoneScale + 100,
        3
      );
      // hueSkew weights dark vs bright band distribution.
      const skewed = Math.pow(hueNoise, hueSkew);
      const paletteIdx = Math.min(
        palettes.length - 1,
        Math.floor(skewed * palettes.length)
      );
      const pal = palettes[paletteIdx];
      const baseHex = pal[Math.floor(Math.random() * pal.length)];
      const base = new THREE.Color(baseHex);
      base.getHSL(hsl);

      const h = (hsl.h + (Math.random() - 0.5) * hueJitter + 1) % 1;
      const s = Math.max(
        0.05,
        Math.min(1, hsl.s + (Math.random() - 0.5) * satJitter)
      );
      let l = Math.max(
        0.1,
        Math.min(0.95, hsl.l + (Math.random() - 0.5) * lightJitter)
      );
      // Layered-brightness modulation: a slow sin wave along the
      // chosen axis creates stacked bright/dark bands of similar
      // size, mimicking the layered structure in the user's reference.
      const axisVal = layerAxis === "x" ? x : layerAxis === "z" ? z : y;
      const layerValue = 0.5 + 0.5 * Math.sin(axisVal * layerFreq + layerPhase);
      const layerMul = 1 - layerContrast + layerContrast * layerValue;
      // brightness driven by both density (dense cores brighter) AND
      // the layer band, so bright pixels are coherent stripes.
      l = l * (0.4 + intensity * 0.5) * layerMul;
      const out = new THREE.Color().setHSL(h, s, l);

      // Optional positional gradient — biases the final colour toward
      // an axis-interpolated tint.  Particles on the low end of the
      // chosen axis lean toward gradientColors[0]; the high end toward
      // gradientColors[1].  Brightness from the palette/layer pipeline
      // is preserved by scaling the gradient colour by the particle's
      // current luminance before blending.
      if (gradientAxis && gradientColors) {
        const axisVal =
          gradientAxis === "x" ? x : gradientAxis === "z" ? z : y;
        const axisExt =
          gradientAxis === "x"
            ? extents[0]
            : gradientAxis === "z"
              ? extents[2]
              : extents[1];
        const t = Math.max(0, Math.min(1, (axisVal + axisExt) / (2 * axisExt)));
        const gradC = new THREE.Color().lerpColors(
          new THREE.Color(gradientColors[0]),
          new THREE.Color(gradientColors[1]),
          t
        );
        // Preserve the per-particle luminance — keep dim cores dim and
        // bright cores bright; only the hue gets the positional bias.
        const lum = 0.299 * out.r + 0.587 * out.g + 0.114 * out.b;
        gradC.multiplyScalar(lum / 0.5); // 0.5 ≈ avg luminance of the gradient endpoints
        out.lerp(gradC, gradientMix);
      }

      // Optional parabolic Y warp — bends the whole cloud into a ∩
      // (positive archAmount) or U (negative archAmount) curve.  The
      // shape mask is already applied, so the silhouette stretches
      // along with the warp instead of being clipped flat.
      let yOut = y;
      if (archAmount !== 0) {
        const xn = x / extents[0]; // -1..1
        yOut = y + archAmount * (1 - xn * xn);
      }

      posArr.push(x, yOut, z);
      colArr.push(out.r, out.g, out.b);
      // Per-particle size: random fraction (0.4–1.0) of the cloud's
      // particleSize.  Max never exceeds particleSize.
      sizeArr.push(particleSize * (0.65 + Math.random() * 0.35));
      // Per-particle rotation phase + speed so each bead spins
      // independently — highlights pivot across the surface, the cloud
      // feels alive, but no position moves (overall shape preserved).
      phaseArr.push(Math.random() * Math.PI * 2);
      speedArr.push((Math.random() - 0.5) * 0.6); // ±0.3 rad/s
      generated++;
    }

    return {
      positions: new Float32Array(posArr),
      colors: new Float32Array(colArr),
      sizes: new Float32Array(sizeArr),
      phases: new Float32Array(phaseArr),
      speeds: new Float32Array(speedArr),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    extents[0], extents[1], extents[2],
    count, noiseFreq, densityThreshold, octaves,
    hueJitter, satJitter, lightJitter,
    hueZoneScale, hueSkew,
    layerAxis, layerFreq, layerPhase, layerContrast,
    centerBoost, centerBoostFalloff,
    particleSize, shape,
    gradientAxis, gradientColors?.[0], gradientColors?.[1], gradientMix,
    archAmount,
  ]);

  // shaderMaterial uniforms — stable ref so we can update uTime and
  // uHeightScale every frame without triggering React renders.
  // uHeightScale = drawingBufferHeight / 2 — matches three's built-in
  // sizeAttenuation formula so particles render at the correct screen
  // size on any DPR (1x and 2x retina alike).
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const uniforms = useMemo(
    () => ({
      uMap: { value: tex },
      uTime: { value: 0 },
      uHeightScale: { value: 450 },
    }),
    [tex]
  );
  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uHeightScale.value =
        state.gl.domElement.height * 0.5;
    }
  });

  return (
    <points position={position} rotation={rotation}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSpeed" args={[speeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        vertexShader={NEBULA_VERT}
        fragmentShader={NEBULA_FRAG}
      />
    </points>
  );
}

/* Per-particle shaders for NebulaField.
   Vertex: standard sizeAttenuation, passes colour + rotation angle.
   Fragment: rotates gl_PointCoord around its centre so each particle's
   highlight/shadow pivots over time, then samples the shaded-bead
   sprite and multiplies by the per-particle colour. */
const NEBULA_VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  uniform float uTime;
  uniform float uHeightScale;
  varying vec3 vColor;
  varying float vAngle;
  void main() {
    vColor = aColor;
    vAngle = aPhase + uTime * aSpeed;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // uHeightScale = drawingBufferHeight * 0.5 — matches three's
    // sizeAttenuation formula so particles read correctly on any DPR.
    gl_PointSize = aSize * (uHeightScale / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const NEBULA_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap;
  varying vec3 vColor;
  varying float vAngle;
  void main() {
    float cs = cos(vAngle);
    float sn = sin(vAngle);
    vec2 p = gl_PointCoord - 0.5;
    vec2 uv = vec2(p.x * cs - p.y * sn, p.x * sn + p.y * cs) + 0.5;
    vec4 t = texture2D(uMap, uv);
    if (t.a < 0.3) discard;
    gl_FragColor = vec4(vColor * t.rgb, t.a);
  }
`;

/** Distant background stars */
function StarField({ count = 1500 }) {
  const points = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 45 + Math.random() * 35;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#d9a574"
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}

/** Mouse-velocity driven rotation of the entire planet system.
 *  Two deadzones both clamp targetVelocity → 0 (system smoothly rests):
 *  - cursor on sun (raycast against a sphere slightly larger than the sun)
 *  - cursor outside the page entirely (via onPointerLeave on outer div) */
function PlanetSystem({
  onPlanetClick,
  cursorInsideRef,
}: {
  onPlanetClick: (slug: string) => void;
  cursorInsideRef: React.MutableRefObject<boolean>;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const rotationVelocity = useRef(0);
  const currentRotation = useRef(0);
  const mouse = useThree((s) => s.mouse);
  const camera = useThree((s) => s.camera);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  // sun is at world origin, radius 1.2; expand to 1.5 for forgiving deadzone
  const sunDeadzone = useMemo(
    () => new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1.5),
    []
  );

  useFrame((_, delta) => {
    raycaster.setFromCamera(mouse, camera);
    const cursorOnSun = raycaster.ray.intersectsSphere(sunDeadzone);
    const cursorOffPage = !cursorInsideRef.current;

    // mouse.x in [-1, +1]. Spec: mouse-left → CW (negative Y), mouse-right → CCW (positive Y).
    // Treat sun-hover and off-page as "no input" — system rests, only planet
    // self-orbits and sun spin continue (they're outside this group).
    const targetVelocity = cursorOnSun || cursorOffPage ? 0 : mouse.x * 0.35;
    rotationVelocity.current +=
      (targetVelocity - rotationVelocity.current) * Math.min(1, delta * 4);
    currentRotation.current += rotationVelocity.current * delta;
    if (groupRef.current) {
      groupRef.current.rotation.y = currentRotation.current;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Each planet and its orbital ring share a tilted subgroup so they
          stay locked together. Tilts vary 3–8° to mimic real planetary
          orbital inclinations and add 3D depth to the scene. */}
      {PLANETS.map((p) => (
        <group key={p.slug} rotation={[p.orbitTilt[0], 0, p.orbitTilt[1]]}>
          <OrbitRing radius={p.orbitRadius} />
          <Planet planet={p} onClick={onPlanetClick} />
        </group>
      ))}
    </group>
  );
}

/** Detect mobile viewport (≤768px wide). Drives the scene's quality
 *  degradation: lower dpr, fewer stars, no Bloom. Listens to resize so a
 *  user rotating the device or resizing a window also updates. */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return isMobile;
}

/** Main scene composition */
function SceneContent({
  onPlanetClick,
  cursorInsideRef,
  lowQuality = false,
}: {
  onPlanetClick: (slug: string) => void;
  cursorInsideRef: React.MutableRefObject<boolean>;
  /** Mobile / weak-GPU mode: cuts StarField count and skips Bloom.
   *  dpr is handled at the Canvas level, not here. */
  lowQuality?: boolean;
}) {
  // Keep tone-mapping exposure in sync with viewport size — onCreated
  // only fires once, so a phone rotation (mobile↔landscape changing the
  // matchMedia result) wouldn't update the brightness without this.
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMappingExposure = lowQuality ? 1.0 : 1.4;
  }, [lowQuality, gl]);

  return (
    <>
      {/* Truly uniform neutral-white environment: a single inside-out
          white sphere centred at origin. The Environment's cubemap
          camera sees ONLY this uniform white inner surface in every
          direction — so reflections on the planets are a smooth
          continuous white instead of the multiple discrete hotspots
          the 6-Lightformer setup produced. iridescence still works
          because it depends on Fresnel angle, not env variation. */}
      <Environment
        background={false}
        frames={1}
        resolution={256} // was 64 — preserves Lightformer detail through PMREM
        environmentIntensity={0.3} // was 0.1 — more env contribution overall
      >
        {/* Backdrop dimmed from white(1.0) to mid-grey(~0.35) so the
            Lightformers stand out in the cubemap average. Pure white
            was drowning the directional light: when rough materials
            sample env over a wide cone, "tiny bright patch ×3 +
            surrounding white ×1" averages to ~1.1, basically invisible.
            With grey backdrop the contrast pops. */}
        <mesh scale={50}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#6a6a6a" side={THREE.BackSide} />
        </mesh>

        {/* Distant upper-left "starlight" — big soft Lightformer
            patches captured into the env cubemap so planets pick up
            brightness from that direction. Intensities bumped to
            15/10 so even rough materials (which average env over a
            wide cone) read a clear "lit hemisphere" bias instead of
            washing the highlight into the grey backdrop. Two stacked
            patches in slightly offset positions smear the highlight
            so no silhouette betrays a sharp circle. */}
        <Lightformer
          form="circle"
          intensity={15}
          color="#cfdcff"
          position={[-8, 5, -4]}
          scale={6}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="circle"
          intensity={10}
          color="#e0e8ff"
          position={[-6, 6, -2]}
          scale={4}
          target={[0, 0, 0]}
        />
      </Environment>

      {/* All directional lights removed. Their key-light specular hits
          on the iridescent glass planets also read as "plastic." With
          env + ambient only, every planet now picks up soft diffuse
          lighting from all sides instead of a single hard highlight. */}
      <ambientLight intensity={0.9} />

      <StarField count={lowQuality ? 600 : 1500} />

      {/* FOCUS — noise-driven nebula.  Particle DENSITY and BRIGHTNESS
          both follow a 3D fbm noise field, so the cloud has organic
          bright cores and dark voids (looks like a real nebula photo,
          not random confetti).  Spread is much wider than the previous
          RichNebula — extents ±5/4/4 fills the upper-right quadrant of
          the scene with Z-depth.  Three palette bands (deep / mid /
          bright) selected per particle by a secondary slow noise so
          colour zones transition smoothly rather than mixing uniformly. */}
      <NebulaField
        position={[8.010, 3.292, -8.0]}   /* v19: A down 30px @ z=-8 (scale 58.5): Y 3.805 → 3.292 */
        extents={[9.439, 6.07, 4.375]}   /* ×5/4 per user (was 7.551/4.856/3.5) → ~1163×748 px @ z=-7 */
        count={10058}                    /* count ×(5/4)³≈1.953 (was 5150) to preserve density */
        particleSize={0.14}
        noiseFreq={0.45}
        densityThreshold={0.36}          /* looser filter → more particles survive → denser */
        octaves={4}
        hueJitter={0.02}
        satJitter={0.08}
        lightJitter={0.12}
        hueZoneScale={0.22}              /* SLOWER hue noise → larger connected colour zones */
        hueSkew={1.55}                   /* gentler skew → more bright-band particles */
        layerAxis="y"                    /* layers stack vertically */
        layerFreq={2.2}                  /* ~3-unit thick layers */
        layerPhase={0.4}
        layerContrast={0.5}              /* softer dimming — dark layers still legible */
        shape="ellipsoid"                 /* A switched from box → ellipsoid per user */
        palettes={[
          /* === NEW (2026-05-25): tuned per docs/nebula-palette-reference.md.
             A CHARACTER: MAIN ANCHOR — deep purple + cool blue undercurrent,
             the reference image's core identity. Touch of warm cream in band 2. === */
          [
            "#7664e5", "#7664e5", "#130e3c", "#4478ce", "#7e5bcd",
            "#220e5c", "#654ac6", "#220e5c", "#181153", "#281464",
          ],
          [
            "#6654d5", "#7c339d", "#4b6ec1", "#7f60da", "#2a5fae",
            "#a25cbc", "#654ac6", "#8e6bd5", "#598eef", "#5642be",
          ],
          [
            "#c8a5ef", "#354ba5", "#a850b8", "#b79cec", "#924cac",
            "#f0d8b8", "#dcbdf7", "#af8ce4", "#a784dc", "#af8ce4",
          ],
          /* === OLD palette backup (to restore: comment-out the 3 arrays above and uncomment these 3) ===
          ["#1a1450","#2a1b60","#1d2860","#3a1d70","#202060","#1e2870","#2a3580","#2540a0","#3a2070","#3d2580"],
          ["#4a2890","#5a30a0","#3050b0","#3d4090","#3a4ab0","#404090","#4a6dc0","#5070d0","#5040a0","#3030a0"],
          ["#5a8de0","#80a8e0","#5cc8c8","#6acde8","#4ac0d0","#b090e0","#c0a0e0","#ffe8c0","#c060c0","#e090e0"],
          */
        ]}
      />

      {/* Sibling cloud filling the user-circled upper-LEFT region.
          Same palette + same per-particle params so it blends with the
          main right cloud into one continuous nebula band.  Count is
          higher per-volume than the main cloud → the circled region
          ends up at ~2× the perceived density (matches the user
          asking for "现在密度的两倍"). */}
      {/* CLOUD C — small focused cluster at z=-6.75 (was "B" in v7, "C" in v6) */}
      <NebulaField
        position={[3.324, 4.160, -6.9]} /* C up 25px again @ z=-6.9 (px/u≈61.6): Y 3.754→4.160 */
        extents={[4.031, 3.031, 2.344]}  /* C scaled another ×5/4 (was [3.225, 2.425, 1.875]) */
        count={1394}                     /* v18 density ×0.8 per user (was 1743) */
        particleSize={0.14}
        noiseFreq={0.45}
        densityThreshold={0.36}
        octaves={4}
        hueJitter={0.02}
        satJitter={0.08}
        lightJitter={0.12}
        hueZoneScale={0.22}
        hueSkew={1.55}
        layerAxis="y"
        layerFreq={2.2}
        layerPhase={0.37}                /* phase tuned to put a BRIGHT band through the cloud's Y centre (was 1.1 — bright band fell off-centre and created a hollow ∩/U arch) */
        layerContrast={0.25}             /* dark bands only dim to 75% (was 0.5 → 50%) — keeps banding texture without splitting the cloud */
        centerBoost={0.92}               /* pulls particles inward to fill any noise voids → no more hollow centre */
        centerBoostFalloff={1.1}
        palettes={[
          /* === NEW (2026-05-25): C CHARACTER: COOL-BLUE FOCUS —
             distinct cyan-leaning, anchors the left side coolness. === */
          [
            "#3a1228", "#4a1838", "#4a1838", "#6a2058", "#6a2058",
            "#7a2868", "#7a2868", "#8a3078", "#3a1228", "#4a1838",
          ],
          [
            "#8a3078", "#9a3888", "#9a3888", "#b04098", "#b04098",
            "#c050a8", "#c050a8", "#d060b8", "#8a3078", "#b04098",
          ],
          [
            "#d060b8", "#e078c0", "#ec88c8", "#f098cc", "#f8b0d8",
            "#e078c0", "#ec88c8", "#f098cc", "#f8b0d8", "#f0e0c8",
          ],
          /* === OLD palette backup ===
          ["#1d1658","#2e1e69","#202c6a","#40207b","#23236a","#212c7b","#2e3a8d","#2946b0","#40237b","#43298d"],
          ["#512c9e","#6335b0","#3558c2","#43469e","#4051c2","#46469e","#5178d3","#587be5","#5846b0","#3535b0"],
          ["#639bf6","#8db9f6","#65dcdc","#75e2ff","#51d3e5","#c29ef6","#d3b0f6","#ffffd3","#d36ad3","#f69ef6"],
          */
        ]}
      />

      {/* CLOUD D — z=-6.5 back layer (was "C" in v7, "D" in v6).  Diamond/rhombus silhouette
          (corners at top/bottom/left/right) with width:height = 4:3 per
          user.  Palette is the deep-blue → bright-blue family (deep
          cobalt + 10% green for a cool teal-blue cast). */}
      <NebulaField
        position={[7.131, 4.037, -6.75]} /* D up 25px again @ z=-6.75 (px/u≈62): Y 3.634→4.037 */
        extents={[5.953, 5.336, 5.273]}  /* ×5/4 again (was 4.7625/4.26875/4.21875) → ~595×534 px @ z=-6.5 */
        shape="diamond"                  /* 2D rhombus in XY plane — corners at (±3.81,0) and (0,±3.415) */
        count={2988}                     /* density ×0.75 per user (was 3984) */
        particleSize={0.14}
        noiseFreq={0.5}
        densityThreshold={0.35}
        octaves={4}
        hueJitter={0.04}
        satJitter={0.22}
        lightJitter={0.22}
        hueZoneScale={0.2}
        hueSkew={1.5}
        layerAxis="y"                    /* layers stack vertically again */
        layerFreq={2.4}
        layerPhase={1.5}
        layerContrast={0.5}
        centerBoost={0.3}
        centerBoostFalloff={2.2}
        palettes={[
          /* D RESTORED (post-debug): cobalt → teal-blue diamond per v2 ref, with L+10% S+10% lift retained */
          [
            "#1a2840", "#1f2c50", "#1f3858", "#244060", "#2a4868",
            "#2a3868", "#1a2840", "#244060", "#1f2c50", "#2a4868",
          ],
          [
            "#384080", "#4858a8", "#3a6890", "#487898", "#5068b8",
            "#5878a8", "#4858a8", "#5068b8", "#384080", "#5878a8",
          ],
          [
            "#6078c8", "#7088d0", "#80a0e0", "#a0b8e8", "#90c8d0",
            "#b0d8e0", "#7088d0", "#a0b8e8", "#80a0e0", "#f0e0c8",
          ],
/* === OLD palette backup (pure blue/white/pink saturated) ===
          ["#324dff","#3e5dff","#2a73ff","#3d72ff","#2984ff","#2764ff","#3e63ff","#2173ff","#3d83ff","#2a73ff"],
          ["#599bff","#62a8ff","#58b8ff","#61c5ff","#57c5ff","#58a9ff","#61c5ff","#61c5ff","#49b8ff","#57c5ff"],
          ["#b3ffff","#d0ffff","#ecffff","#ffffff","#dfffff","#ffb0d0","#ffa0c8","#ff90c0","#ffa8d0","#ecffff"],
          */
        ]}
      />

      {/* CLOUD E — interpolated cluster at z=-6.5 (was "D" in v7, "B" in v6).
          Position, extents, count, and palette are all the midpoint of
          A and C's current values.  Shape is ellipsoid as a rounded
          compromise between A's box and C's diamond. */}
      <NebulaField
        position={[7.123, 4.214, -6.75]} /* v19: E down 30px @ z=-6.75 (scale 62.4): Y 4.695 → 4.214 */
        extents={[4.925, 4.425, 4.3]}    /* ×5/4 (was 3.94/3.54/3.44) → ~620×556 px @ z=-6.5 */
        count={4072}                     /* v18 density ×0.8 per user (was 5090) */
        particleSize={0.14}
        noiseFreq={0.45}
        densityThreshold={0.36}
        octaves={4}
        hueJitter={0.02}
        satJitter={0.08}
        lightJitter={0.12}
        hueZoneScale={0.22}
        hueSkew={1.55}
        layerAxis="y"
        layerFreq={2.2}
        layerPhase={1.7}                 /* unique phase so I doesn't band-align with A or C */
        layerContrast={0.45}
        centerBoost={0.92}
        centerBoostFalloff={1.1}
        shape="ellipsoid"
        palettes={[
          /* === NEW (2026-05-25): B CHARACTER: SOFT HALO behind/above A —
             lavender + dusty pink, the gentlest of all nebulas. === */
          [
            "#3a1d5b", "#3a1d5b", "#4a256b", "#4a256b", "#5b2c7c",
            "#5b2c7c", "#6a3c94", "#3a1d5b", "#4a256b", "#5b2c7c",
          ],
          [
            "#6a3c94", "#6a3c94", "#7754ac", "#7754ac", "#8764c4",
            "#8764c4", "#9684d4", "#6a3c94", "#7754ac", "#8764c4",
          ],
          [
            "#9684d4", "#ae9de3", "#c7b6ea", "#d8c6f2", "#9684d4",
            "#ae9de3", "#c7b6ea", "#9684d4", "#ae9de3", "#f0e0c8",
          ],
          /* === OLD palette backup (A/C midpoint + pink boost) ===
          ["#4738b9","#5744c2","#4557c2","#5f50ca","#475bc2","#444fca","#5756d3","#4564e5","#5f5bca","#5755d3"],
          ["#776cdc","#8578e5","#6891ee","#748fdc","#6e95ee","#7181dc","#7ca8f6","#7fa9ff","#7288e5","#6886e5"],
          ["#b0daff","#d4e9ff","#cffbfb","#e0fdff","#bef6ff","#ffdcff","#ffe5ff","#fffff6","#ffc2f6","#ffdcff"],
          */
        ]}
      />

      {/* CLOUD K — z=-5 (was J in v8, I in v7).
          Pulled back from z=-3 → -4 per user (felt visually too close);
          still safely in front of the back layer. */}
      <NebulaField
        position={[3.037, 4.625, -5.0]}    /* J up 25px again @ z=-5 (px/u≈69.1): Y 4.263→4.625 */
        extents={[2.916, 2.614, 1.563]}  /* J scaled another ×5/4 (was [2.333, 2.091, 1.25]) */
        count={616}                       /* v18 density ×0.8 per user (was 770) */
        particleSize={0.14}
        noiseFreq={0.45}
        densityThreshold={0.36}
        octaves={4}
        hueJitter={0.04}
        satJitter={0.22}
        lightJitter={0.2}
        hueZoneScale={0.22}
        hueSkew={1.55}
        layerAxis="y"
        layerFreq={2.2}
        layerPhase={0.26}                /* tuned: bright band centered on Y=3.45 (was 2.7 → dark band split the ellipsoid into a ∩ arch) */
        layerContrast={0.25}             /* dark bands only -25% (was 0.5 / -50%) */
        centerBoost={0.7}                /* pulled up from 0.45 — flat ellipsoid needs more inward pull to fill */
        centerBoostFalloff={1.6}         /* wider reach (was 2.2) — boost extends through the thin Y axis */
        shape="ellipsoid"                /* G switched from box → ellipsoid per user */
        palettes={[
          /* === NEW (2026-05-25): H CHARACTER: FRONT LAVENDER —
             bright violet, prominent because closer to camera, leans pink. === */
          [
            "#7e5bcd", "#180f4b", "#654ac6", "#b79cec", "#130e3c",
            "#0a0632", "#b79cec", "#654ac6", "#8e6bd5", "#c09cec",
          ],
          [
            "#c8a5ef", "#b79cec", "#7f60da", "#d0b5f3", "#a25cbc",
            "#dcbdf7", "#7f60da", "#c8a5ef", "#7f60da", "#bc6cc8",
          ],
          [
            "#b79cec", "#924cac", "#c09cec", "#e8c098", "#c09cec",
            "#c09cec", "#dcbdf7", "#924cac", "#d0b5f3", "#e8c8a8",
          ],
          /* === OLD palette backup (pink+purple heavy, near-uniform high-sat) ===
          ["#664af3","#7157f3","#6169f3","#7169f3","#6178f3","#5e5df3","#715df3","#5a69f3","#7178f3","#6169f3"],
          ["#898cf3","#9298f3","#89a5f3","#92b0f3","#89b0f3","#8998f3","#92b0f3","#92b0f3","#7da5f3","#89b0f3"],
          ["#d9e6f3","#f1e6f3","#ffe6f3","#ffe6f3","#fee6f3","#ffe6f3","#ffe6f3","#ffe6f3","#fee6f3","#ffe6f3"],
          */
        ]}
      />

      {/* CLOUD J — z=-5.5 mid layer box (was I in v8, H in v7, E in v6; was C before that
          A→G depth order; D/E/F now all sit at z=-5).  Wears the C-family
          brighter blue palette (deep cobalt → bright azure).  Extents
          scaled 1.5× from B's profile so the front face reads as a
          larger, brighter mid-layer cluster. */}
      <NebulaField
        position={[7.069, 4.049, -5.5]}  /* I up 25px again @ z=-5.5 (px/u≈66.5): Y 3.673→4.049 */
        extents={[2.525, 2.766, 1.25]}   /* ×5/4 (was 2.02/2.213/1.0) → ~343×375 px @ z=-5 */
        count={1688}                     /* v18 density ×0.8 per user (was 2110) */
        particleSize={0.14}
        noiseFreq={0.45}
        densityThreshold={0.36}
        octaves={4}
        hueJitter={0.04}
        satJitter={0.22}
        lightJitter={0.2}
        hueZoneScale={0.22}
        hueSkew={1.55}
        layerAxis="y"
        layerFreq={2.2}
        layerPhase={3.4}                 /* unique phase so D's bands don't align with B or G */
        layerContrast={0.5}
        centerBoost={0.55}               /* fills the hollow centre — particles pulled inward */
        centerBoostFalloff={1.8}         /* boost reaches further out → denser core w/o shrinking outline */
        palettes={[
          /* I RESTORED (post-debug): lifted lavender + periwinkle per v2 ref */
          [
            "#3a2058", "#4a2868", "#5a3078", "#384080", "#4858a8",
            "#3a2058", "#4a2868", "#5a3078", "#384080", "#4858a8",
          ],
          [
            "#7858a8", "#8868c0", "#9888d0", "#5068b8", "#6078c8",
            "#7088d0", "#8868c0", "#9888d0", "#7088d0", "#80a0e0",
          ],
          [
            "#b0a0e0", "#c8b8e8", "#d8c8f0", "#80a0e0", "#a0b8e8",
            "#a0b8e8", "#c8b8e8", "#d8c8f0", "#f0e0c8", "#a0b8e8",
          ],
/* === OLD palette backup (brightened pure blue family) ===
          ["#323ad3","#464de6","#2c4de6","#4d4de6","#3a60e6","#3a73f9","#3a86ff","#4d9aff","#4d60f9","#4d73f9"],
          ["#6086ff","#739aff","#60adff","#60b6ff","#73b6ff","#73adff","#86c0ff","#9ad3ff","#739aff","#609aff"],
          ["#86c9ff","#b6e6ff","#86f9ff","#9affff","#73f9ff","#d3ddff","#e6e6ff","#ffffff","#c09aff","#e6c9ff"],
          */
        ]}
      />

      {/* CLOUD I — z=-5.5 inverted triangle (was H in v8, G in v7). Downward-pyramid silhouette (wide at
          top, narrows to a point at bottom).  Position is A's [5.85,4,-7]
          shifted ~150px right + 150px down at A's depth, with Z brought
          forward from -7 to -5.  Extents are 2/3 of A's, particleSize
          matches A.  Palette is A's deep-purple family. */}
      <NebulaField
        position={[11.631, 3.707, -5.5]} /* H up 25px again @ z=-5.5 (px/u≈66.2): Y 3.329→3.707 */
        extents={[2.363, 3.156, 2.588]}  /* ×5/4 (was 1.89/2.525/2.07) → ~320×428 px @ z=-5 */
        count={1523}                     /* v18 density ×0.8 per user (was 1904) */
        particleSize={0.14}               /* matches A */
        noiseFreq={0.45}
        densityThreshold={0.36}
        octaves={4}
        hueJitter={0.02}
        satJitter={0.08}
        lightJitter={0.12}
        hueZoneScale={0.22}
        hueSkew={1.55}
        layerAxis="y"
        layerFreq={2.2}
        layerPhase={4.6}                 /* unique phase so E's bands don't align with the others */
        layerContrast={0.5}
        centerBoost={0.92}                /* fills the centre — no hollow void */
        centerBoostFalloff={1.1}
        shape="invertedTriangle"
        palettes={[
          /* A's palette family — copied verbatim so E reads as a
             smaller bright echo in the same colour identity as A. */
          [
            "#182742", "#182742", "#1d2b52", "#1d2b52", "#27366b",
            "#27366b", "#343d84", "#182742", "#1d2b52", "#27366b",
          ],
          [
            "#343d84", "#343d84", "#4355ad", "#4355ad", "#4b65bd",
            "#4b65bd", "#5b75cd", "#343d84", "#4355ad", "#4b65bd",
          ],
          [
            "#5b75cd", "#6b86d5", "#7b9ee5", "#9cb7ec", "#6b86d5",
            "#7b9ee5", "#9cb7ec", "#5b75cd", "#6b86d5", "#f0e0c8",
          ],
        ]}
      />

      {/* CLOUD H — z=-5.5 ellipsoid (was G in v8, F in v7). Horizontal rectangle in the far upper-right of the
          scene (screen ~100px from right edge, ~350px from top edge).
          Width 400px × height 180px on a 2000-wide viewport ≈ extents
          [2.88, 1.30, 1.5] in world units at z=-5.  Palette is F's
          (= A's deep-purple family). */}
      <NebulaField
        position={[10.754, 2.741, -5.5]} /* G up 25px @ z=-5.5 (px/u≈65.6): Y 2.36→2.741 */
        extents={[2.935, 2.469, 1.5]}    /* ×5/4 (was 2.348/1.975/1.2) → ~394×331 px @ z=-5 */
        count={743}                       /* v18 density ×0.8 per user (was 929) */
        particleSize={0.14}
        noiseFreq={0.45}
        densityThreshold={0.36}
        octaves={4}
        hueJitter={0.02}
        satJitter={0.08}
        lightJitter={0.12}
        hueZoneScale={0.22}
        hueSkew={1.55}
        layerAxis="y"
        layerFreq={2.2}
        layerPhase={3.65}                /* tuned: bright band centered on Y=1.91 (was 5.2 → dark band split the ellipsoid into a ∩ arch) */
        layerContrast={0.25}             /* dark bands only -25% (was 0.5 / -50%) */
        centerBoost={0.92}                /* pulls particles inward to fill noise voids */
        centerBoostFalloff={1.1}
        shape="ellipsoid"                /* rounded oval — distinctly NOT a box */
        palettes={[
          /* F palette: A's deep-purple family with brightness ×1.1 and
             blue channel ×1.21 per user (lift + cooler hue shift). */
          [
            "#182742", "#182742", "#1d2b52", "#1d2b52", "#27366b",
            "#27366b", "#343d84", "#182742", "#1d2b52", "#27366b",
          ],
          [
            "#343d84", "#343d84", "#4355ad", "#4355ad", "#4b65bd",
            "#4b65bd", "#5b75cd", "#343d84", "#4355ad", "#4b65bd",
          ],
          [
            "#5b75cd", "#6b86d5", "#7b9ee5", "#9cb7ec", "#6b86d5",
            "#7b9ee5", "#9cb7ec", "#5b75cd", "#6b86d5", "#f0e0c8",
          ],
        ]}
      />

      {/* CLOUD P — z=-3.8 ellipsoid (was "N" in v8, "J" in v7). Sits frontmost. Volume is 3/4 of F's
          (each axis ×0.909 from F's shrunk [1.6, 1.6, 1.2] → [1.454,
          1.454, 1.091]). Same shape/palette/breath as F so H reads as
          F's smaller, closer companion. Count scaled with volume
          (350 × 3/4 = 263) to keep matching density. */}
      <NebulaField
        position={[8.433, 4.537, -3.8]}  /* N up 25px again @ z=-3.8 (px/u≈74.3): Y 4.201→4.537 */
        extents={[2.4, 2.4, 2.046]}      /* ×5/4 (was 1.92/1.92/1.637) → ~373×373 px @ z=-3 */
        count={692}                       /* v18 density ×0.8 per user (was 865) */
        particleSize={0.14}
        noiseFreq={0.45}
        densityThreshold={0.36}
        octaves={4}
        hueJitter={0.02}
        satJitter={0.08}
        lightJitter={0.12}
        hueZoneScale={0.22}
        hueSkew={1.55}
        layerAxis="y"
        layerFreq={2.2}
        layerPhase={5.9}                  /* unique phase so H doesn't band-align with F */
        layerContrast={0.25}
        centerBoost={0.92}
        centerBoostFalloff={1.1}
        shape="ellipsoid"
        palettes={[
          /* I "+20% bluer +10% greener" — done via R-51 (reducing red
             actually kills the purple feel, since B is already maxed)
             and G+25 (genuine green lift).  Clamped to 0..255. */
          [
            "#652c8d", "#753da8", "#8461b8", "#753da8", "#8461b8",
            "#652c8d", "#753da8", "#8461b8", "#652c8d", "#753da8",
          ],
          [
            "#8764c4", "#9684d4", "#ae9de3", "#9684d4", "#ae9de3",
            "#8764c4", "#9684d4", "#ae9de3", "#8764c4", "#9684d4",
          ],
          [
            "#c7b6ea", "#d8c6f2", "#c7b6ea", "#d8c6f2", "#ae9de3",
            "#c7b6ea", "#d8c6f2", "#c7b6ea", "#d8c6f2", "#f0e0c8",
          ],
        ]}
      />

      {/* CLOUD M (was L in v8, working name "ROSE") — horizontal
          ellipse @ z=-3.8 (sits behind J's z=-3 and in front of F's z=-5,
          screen ≈ (1369, 303), tucked into the gap between J above and F
          below in the upper-right corner).

          AESTHETIC CHOICE (rose-violet 玫瑰紫):
            - F is bright cool-violet (#9a7adf), J is deep blue-purple
              with pale lavender highlights — both leaning cool.
            - A warm rose-violet between them creates a 冷-暖-冷 rhythm
              and pulls the warm accent thread already established by
              E's pink gradient + I's "偏粉紫" shift, so the right side
              has a faint warm spine running through it instead of an
              all-cool block.
            - Bright rose-pink band-2 highlights act as a small pop in
              an otherwise empty pocket without competing with A's mass.
          Will be assigned a letter in the next depth-order rename. */}
      <NebulaField
        position={[4.083, 3.474, -4.0]}     /* L up 25px @ z=-4 (px/u≈72.3): Y 3.128→3.474 */
        extents={[3.938, 3.938, 2.5]}    /* L ×2 + 变正圆 per user (was [1.969, 1.285, 1.25]) — X=Y for circle */
        count={900}                        /* v18 density ×0.8 per user (was 1125) */
        particleSize={0.14}
        noiseFreq={0.5}
        densityThreshold={0.34}
        octaves={4}
        hueJitter={0.04}
        satJitter={0.18}
        lightJitter={0.18}
        hueZoneScale={0.22}
        hueSkew={1.55}
        layerAxis="x"                      /* horizontal layering since the ellipse is wider than tall */
        layerFreq={2.4}
        layerPhase={2.1}                   /* unique phase, no band-align with neighbours */
        layerContrast={0.35}
        centerBoost={0.7}
        centerBoostFalloff={1.5}
        shape="ellipsoid"
        palettes={[
          /* band 0 — saturated rose-violet (warm purple core, ~60%) */
          [
            "#7a3a90", "#8a4aa8", "#9050b0", "#7c46a0", "#854ba5",
            "#6f3a8a", "#9550b8", "#8a4aa8", "#7c46a0", "#854ba5",
          ],
          /* band 1 — pink-violet mid (the warm bridge, ~25%) */
          [
            "#b070c8", "#c080d0", "#a880c0", "#b878d0", "#c890d8",
            "#a070b8", "#b878d0", "#c080d0", "#b070c8", "#c890d8",
          ],
          /* band 2 — rose-pink highlights (~15% — the warm pop) */
          [
            "#ffaad8", "#ffc8e0", "#f0c0e8", "#ffd8e8", "#fdb5d8",
            "#ffc8e0", "#f5b8e0", "#ffd0e8", "#fcaad8", "#ffc8e0",
          ],
        ]}
      />

      {/* CLOUD L (was K in v8, working name "JEWEL") sapphire accent —
          330×250 px ellipse @ z=-3.8, screen ~(1367, 302), filling the
          gap between J (z=-3, screen y≈235) above and F (z=-5, screen
          y≈370) below.  Slightly overlaps both → reads as a unifying
          underlayer rather than a floating dot.

          AESTHETIC CHOICE (sapphire / 宝石蓝):
            - The whole right cluster (A/D/F/J) is purple-dominated;
              there is no true blue jewel tone anywhere in the field.
            - A saturated sapphire here adds a cool gem accent that
              complements (not competes with) the purples — analogous
              colour family but a clear hue shift, so the eye reads
              it as a "blue stone" set into the purple cloud cluster.
            - The warm accents (E/I/ROSE pink-rose) live on the left
              and lower areas; the right cluster has been all-cool
              purple.  Adding a true blue strengthens the cool-cool
              richness on the right rather than fighting it.
            - Band 2 uses ICY cyan-blue highlights → echoes the
              cream/lavender sparkles in J without copying them, and
              makes the cloud feel "lit from within" like a sapphire. */}
      <NebulaField
        position={[8.054, 3.189, -4.0]}     /* K up 25px again @ z=-4 (px/u≈71.9): Y 2.841→3.189 */
        extents={[4.238, 3.207, 2.25]}   /* ×3/2 (was 2.825/2.138/1.5) per user */
        count={3560}                      /* v18 density ×0.8 per user (was 4450) */
        particleSize={0.14}
        noiseFreq={0.45}
        densityThreshold={0.34}
        octaves={4}
        hueJitter={0.04}
        satJitter={0.18}
        lightJitter={0.18}
        hueZoneScale={0.22}
        hueSkew={1.55}
        layerAxis="y"
        layerFreq={2.0}
        layerPhase={4.6}                   /* unique phase, no band-align with neighbours */
        layerContrast={0.35}
        centerBoost={0.6}
        centerBoostFalloff={1.6}
        shape="ellipsoid"
        palettes={[
          /* band 0 — saturated sapphire / royal blue (~60% deep core) */
          [
            "#1e3aa0", "#2545b8", "#2a52c0", "#1a35a8", "#2548b8",
            "#1e3aa0", "#2a52c8", "#2545b8", "#1d4ab0", "#264fc0",
          ],
          /* band 1 — bright bluebell mid (~25% transition) */
          [
            "#4868e0", "#5070e8", "#6080f0", "#4868d8", "#5878e8",
            "#4060d8", "#5878e8", "#5070e8", "#5878e8", "#5070e8",
          ],
          /* band 2 — icy cyan-blue + electric blue highlights (~15% pop) */
          [
            "#a0c8ff", "#b8d8ff", "#c0e0ff", "#80b0ff", "#90c0ff",
            "#a8d0ff", "#b8e0ff", "#80c8ff", "#a0d8ff", "#6090ff",
          ],
        ]}
      />

      {/* CLOUD O (was M / M_L in v8, working name "SPARK" left half, front-layer sparse accent) — 500×350 px
          ellipse centered above J/JEWEL area, frontmost layer.

          PURPOSE: vivid bright-purple-dominant sparkles, with a few
          bright-blue accents, scattered SPARSELY (low count + low
          centerBoost) so each particle reads as an isolated jewel
          rather than a cloud body.  Acts as a vibrant top-layer
          shimmer over the dense purple cluster.

          PALETTE: all three bands skew bright — band 0 saturated
          electric purple (~60%), band 1 mixes bright violet + bright
          royal blue (~25%), band 2 brightest white-violet / icy
          highlights (~15%).  satJitter pulled down so colours stay
          saturated; particleSize bumped slightly so sparse particles
          still read at a glance. */}
      <NebulaField
        position={[2.778, 3.759, -3.8]}  /* M_L up 25px @ z=-3.8 (px/u≈74.3): Y 3.423→3.759 */
        extents={[2.921, 4.089, 2.148]}  /* M ×11/12 around center per user (between original and 5/6) */
        count={534}                      /* count ×(5/4)³≈1.953 (was 547) to preserve sparse density */
        particleSize={0.12}               /* reduced from 0.16 — z=-3.8 made screen-size visibly larger than z=-5 neighbours; balanced down per user */
        noiseFreq={0.6}                   /* finer noise → small bright nuggets instead of soft masses */
        densityThreshold={0.40}
        octaves={4}
        hueJitter={0.01}                  /* locked tight → no more drift into blue-green */
        satJitter={0.10}                  /* kept low → all particles stay saturated */
        lightJitter={0.15}
        hueZoneScale={0.3}
        hueSkew={1.2}                     /* gentler skew so brighter bands get more share */
        layerAxis="x"
        layerFreq={1.6}
        layerPhase={2.9}
        layerContrast={0.2}               /* low contrast → everything stays bright */
        centerBoost={0.2}                 /* low → don't pull particles into a dense centre, keep sparse */
        centerBoostFalloff={2.5}
        shape="ellipsoid"
        palettes={[
          /* Rebuilt as TRUE blue-purple (蓝紫) pastel — every entry
             has B > R > G, with R-G gap kept tiny (≤5) so neither
             pink nor green tint shows; B-R gap 30-50 → clear blue
             lean.  Saturation stays low (~30-40%) so no fluorescent
             spikes when the shader pushes lightness around. */
          /* band 0 — soft indigo dust (~60%, main colour) */
          [
            "#b9b5eb", "#c2c0ed", "#b6b2e8", "#cac8ef", "#bbb8ec",
            "#c5c2eb", "#b1b0de", "#cccaee", "#bcbae8", "#b6b2e8",
          ],
          /* band 1 — pale periwinkle / lavender-blue (~25%) */
          [
            "#d3d2f5", "#e2e0fa", "#cdcbf3", "#e8e7fc", "#b9b5eb",
            "#dad8f7", "#c9c7f1", "#e4e2fa", "#d2d0f4", "#b4b2e3",
          ],
          /* band 2 — icy near-white with faint blue tint (~15%) */
          [
            "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff",
            "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff",
          ],
        ]}
      />

      {/* CLOUD N (was M_R in v8, split from M — right half, bluer +10% saturated +10%) — was working name "SPARK", front-layer sparse accent — 500×350 px
          ellipse centered above J/JEWEL area, frontmost layer.

          PURPOSE: vivid bright-purple-dominant sparkles, with a few
          bright-blue accents, scattered SPARSELY (low count + low
          centerBoost) so each particle reads as an isolated jewel
          rather than a cloud body.  Acts as a vibrant top-layer
          shimmer over the dense purple cluster.

          PALETTE: all three bands skew bright — band 0 saturated
          electric purple (~60%), band 1 mixes bright violet + bright
          royal blue (~25%), band 2 brightest white-violet / icy
          highlights (~15%).  satJitter pulled down so colours stay
          saturated; particleSize bumped slightly so sparse particles
          still read at a glance. */}
      <NebulaField
        position={[8.620, 3.579, -3.8]}  /* M_R up 25px @ z=-3.8 (px/u≈74.3): Y 3.243→3.579 */
        extents={[2.921, 4.089, 2.148]}  /* M ×11/12 around center per user (between original and 5/6) */
        count={535}                      /* count ×(5/4)³≈1.953 (was 547) to preserve sparse density */
        particleSize={0.12}               /* reduced from 0.16 — z=-3.8 made screen-size visibly larger than z=-5 neighbours; balanced down per user */
        noiseFreq={0.6}                   /* finer noise → small bright nuggets instead of soft masses */
        densityThreshold={0.40}
        octaves={4}
        hueJitter={0.01}                  /* locked tight → no more drift into blue-green */
        satJitter={0.10}                  /* kept low → all particles stay saturated */
        lightJitter={0.15}
        hueZoneScale={0.3}
        hueSkew={1.2}                     /* gentler skew so brighter bands get more share */
        layerAxis="x"
        layerFreq={1.6}
        layerPhase={2.9}
        layerContrast={0.2}               /* low contrast → everything stays bright */
        centerBoost={0.2}                 /* low → don't pull particles into a dense centre, keep sparse */
        centerBoostFalloff={2.5}
        shape="ellipsoid"
        palettes={[
          /* Rebuilt as TRUE blue-purple (蓝紫) pastel — every entry
             has B > R > G, with R-G gap kept tiny (≤5) so neither
             pink nor green tint shows; B-R gap 30-50 → clear blue
             lean.  Saturation stays low (~30-40%) so no fluorescent
             spikes when the shader pushes lightness around. */
          /* band 0 — soft indigo dust (~60%, main colour) */
          [
            "#b6b2ee", "#c0beef", "#b3afeb", "#c8c6f1", "#b8b5ef",
            "#c3c0ed", "#afaee0", "#cac8f0", "#bab8ea", "#b3afeb",
          ],
          /* band 1 — pale periwinkle / lavender-blue (~25%) */
          [
            "#d1d0f7", "#e1dffb", "#cbc9f5", "#e7e6fd", "#b6b2ee",
            "#d8d6f9", "#c7c5f3", "#e3e1fb", "#d0cef6", "#b2b0e5",
          ],
          /* band 2 — icy near-white with faint blue tint (~15%) */
          [
            "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff",
            "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff",
          ],
        ]}
      />

      {/* ──────────────────────────────────────────────────────────
          LOWER-RIGHT FAN CLUSTER (3 sub-clouds: FAN_BACK / FAN_MID /
          FAN_TIP) — mirrors the upper-right purple group's "multi-cloud
          stacked at varying Z" design, but in the lower-right of the
          screen as a fan-shaped arc peeking in from the corner.

          PALETTE — sampled from the blue-nebula 调色参考 image:
            Zone-2 青蓝主体: deep teal #0c2845, mid #2890b8, bright
              cyan #70d0e8/#a8e8f0; with rose-pink sparkler
              #e878c0/#ff70b8 as the unifying warm anchor (low % but
              critical for liveliness — same role as the cream
              sparkles in J/N).
          ────────────────────────────────────────────────────────── */}

      {/* CLOUD a (was a_back in v8) — deepest of the fan group (replaces old a as the back anchor at z=-5.1, just behind old a at z=-5
          behind A at z=-8).  Scaled 2x then reshaped to a clear horizontal
          ellipse (X 2× of Y) per user.  Shifted 100px left so the back
          layer doesn't stack exactly behind a — gives the fan group a
          deeper "echo" haze. */}
      <NebulaField
        position={[12.659, -7.847, -4.1]}     /* a left 30px more @ z=-4.1 (scale 72.67): X 13.072 → 12.659 */
        rotation={[0, 0, 0.2094]}             /* +12° CCW (CW 5° from previous 17°) per user */
        extents={[7.16, 5.736, 3.6]}          /* screen 980 × 785 px @ z=-5.1 (scale 68.42); Y bumped only */
        count={6580}                           /* density-preserving (Y ×1.342 from prev 4.275) */
        particleSize={0.14}
        noiseFreq={0.45}
        densityThreshold={0.36}
        octaves={4}
        hueJitter={0.03}
        satJitter={0.18}
        lightJitter={0.20}
        hueZoneScale={0.22}
        hueSkew={1.85}                         /* even darker bias for back-layer fog */
        layerAxis="x"
        layerFreq={2.0}
        layerPhase={2.4}                       /* unique phase so a_back's bands don't align with a's */
        layerContrast={0.35}
        centerBoost={0.45}
        centerBoostFalloff={1.8}
        shape="ellipsoid"
        palettes={[
          /* a — v18 饱和度 +15%（每色远离灰心推 15%）。v17 4 色映射：
             #10204c→#0c1f51, #103850→#0b3954, #185060→#125264, #2c3a78→#28387f */
          /* Band 0 — 最深近黑靛 + 深海青 (~60%) */
          [
            "#0c1f51", "#0b3954", "#0c1f51", "#0b3954", "#0c1f51",
            "#0b3954", "#0c1f51", "#0b3954", "#0c1f51", "#0b3954",
          ],
          /* Band 1 — 深海青 + 深蓝紫桥色 (~30%) */
          [
            "#0b3954", "#125264", "#125264", "#28387f", "#0b3954",
            "#125264", "#28387f", "#125264", "#0b3954", "#125264",
          ],
          /* Band 2 — 蓝绿青 + 深蓝紫高光 (~10%) */
          [
            "#125264", "#28387f", "#125264", "#28387f", "#125264",
            "#28387f", "#125264", "#28387f", "#125264", "#28387f",
          ],
        ]}
      />

      {/* CLOUD b (was a in v8, FAN_BACK) — second-deepest of the lower-right
          fan group.  Anchored at the bottom-right corner: most of
          the body sits below + right of the viewport, only the
          upper-left arc shows.  Lowercase naming separates this
          fan cluster from the main upper-right A-N group. */}
      <NebulaField
        position={[12.210, -7.092, -2.8]}     /* v28: b 右 40px @ scale 79.054 (X 11.704 → 12.210) */
        extents={[5, 5, 1.8]}            /* bigger so the visible arc covers the full green-marked region */
        count={2500}
        particleSize={0.14}
        noiseFreq={0.45}
        densityThreshold={0.36}
        octaves={4}
        hueJitter={0.03}
        satJitter={0.18}
        lightJitter={0.20}
        hueZoneScale={0.13}            /* small → big contiguous color zones, so cyan vs violet sit as separate halves of the cloud, not mixed pixel-by-pixel */
        hueSkew={1.7}                  /* dark bands dominate for moody back */
        layerAxis="x"
        layerFreq={2.0}
        layerPhase={0.8}
        layerContrast={0.35}
        centerBoost={0.45}
        centerBoostFalloff={1.8}
        shape="ellipsoid"
        palettes={[
          /* b — v27 调亮 20% per user (each ×1.2 clamped). 映射:
             #125264→#166278, #28387f→#304398, #334798→#3d55b6, #3f4da0→#4c5cc0 */
          /* Band 0 — 深海青 + 深靛蓝 (~55%) */
          [
            "#166278", "#304398", "#166278", "#304398", "#166278",
            "#304398", "#166278", "#304398", "#166278", "#304398",
          ],
          /* Band 1 — 中段靛蓝 + 蓝紫桥色 (~30%) */
          [
            "#304398", "#3d55b6", "#304398", "#3d55b6", "#304398",
            "#3d55b6", "#304398", "#3d55b6", "#304398", "#3d55b6",
          ],
          /* Band 2 — 蓝紫高光 (~15%) — 整体冷调 */
          [
            "#3d55b6", "#4c5cc0", "#3d55b6", "#4c5cc0", "#3d55b6",
            "#4c5cc0", "#3d55b6", "#4c5cc0", "#3d55b6", "#4c5cc0",
          ],
        ]}
      />

      {/* CLOUD d (v13 rename: was "c" — purple + 30% rose-pink sparkler palette, smallest fan member ext 2.8).
          Sits at z=-2.8 tied with new "e" (was old "d") but slightly FARTHER from camera by distance
          (20.5 vs 19.9), so gets the earlier letter in far→near naming. */}
      <NebulaField
        position={[15.470, -7.169, -4.0]}     /* v27: d 取 b 旧位置 (z=-4.0, X=15.470) per user 对调 */
        extents={[5.6, 5.6, 2.4]}        /* v25: ×2 per user (was 2.8/2.8/1.2) — screen 885×885 px @ z=-2.8 */
        count={6144}                      /* v25 density preserved (count ×2³=8): 768 → 6144 */
        particleSize={0.14}
        noiseFreq={0.5}
        densityThreshold={0.34}
        octaves={4}
        hueJitter={0.03}
        satJitter={0.18}
        lightJitter={0.22}
        hueZoneScale={0.22}
        hueSkew={1.5}                  /* mid-bright bands more even */
        layerAxis="x"
        layerFreq={2.4}
        layerPhase={3.1}
        layerContrast={0.4}
        centerBoost={0.4}
        centerBoostFalloff={1.6}
        shape="ellipsoid"
        palettes={[
          /* d — v28 深蓝紫族 per user (右扇形最右，cx 1931 = gradient rightmost) */
          /* Band 0 — 深紫罗兰骨架 (~50%) */
          [
            "#2a1858", "#301c68", "#2a1858", "#301c68", "#2a1858",
            "#301c68", "#2a1858", "#301c68", "#2a1858", "#301c68",
          ],
          /* Band 1 — 中段蓝紫 (~30%) */
          [
            "#5440a8", "#5c48b0", "#6450b8", "#5440a8", "#5c48b0",
            "#6450b8", "#5440a8", "#5c48b0", "#5440a8", "#5c48b0",
          ],
          /* Band 2 — 浅蓝紫高光 sparkler (~10%) */
          [
            "#9070d0", "#9878d8", "#a080e0", "#9070d0", "#9878d8",
            "#a080e0", "#9070d0", "#9878d8", "#9070d0", "#9878d8",
          ],
        ]}
      />

      {/* CLOUD e (v13 rename: was "d" — cyan-blue dominant palette with 20% rose-pink sparklers in band 2,
          ext 4. Sits at z=-2.8 tied with new "d" (was old "c") but slightly CLOSER to camera by distance
          (19.9 vs 20.5), so gets the later letter in far→near naming. */}
      <NebulaField
        position={[11.245, -7.701, -2.8]}   /* v29d: e 右 15 + 上 15 @ scale 79.054 (X 11.055→11.245, Y -7.891→-7.701) */
        extents={[4, 4, 2.4]}            /* ×2 (was 2/2/1.2) per user */
        count={3920}                      /* v35: 密度 ×0.7 per user (5600 → 3920) */
        particleSize={0.14}
        noiseFreq={0.55}
        densityThreshold={0.34}
        octaves={4}
        hueJitter={0.03}
        satJitter={0.15}
        lightJitter={0.22}
        hueZoneScale={0.25}            /* back to default — palette is uniformly cyan now so we want normal mixing, not chunky zones */
        hueSkew={1.5}                  /* balanced — band 0 dominant but band 2 sparklers still visible (was 1.3 too bright) */
        layerAxis="y"
        layerFreq={2.5}
        layerPhase={5.4}
        layerContrast={0.3}
        centerBoost={0.35}
        centerBoostFalloff={1.5}
        shape="ellipsoid"
        gradientAxis="x"                /* v35: cluster-wide 渐变 — 左→右越来越蓝 */
        gradientColors={["#1d5c86", "#1c40a8"]}  /* v35: 左端=湖水蓝青(贴近 palette 偏蓝 10% 后的 mid-deep)，右端=深皇家蓝 (G 大降 B 大升) */
        gradientMix={0.32}              /* v35: 32% blend — 渐变清晰但不抢 palette */
        palettes={[
          /* e — v36 又偏蓝 40% per user (R×0.6, B=0.6B+102). 从 v35 湖水青蓝
             转为深钴蓝/电蓝/冰蓝 (G 与 B 差距进一步拉大). */
          /* Band 0 — 深钴蓝骨架 (~50%) */
          [
            "#0d50ad", "#0f58b4", "#115cb6", "#0f54b2", "#0d50ad",
            "#115cb6", "#0f58b4", "#0d50ad", "#0f54b2", "#115cb6",
          ],
          /* Band 1 — 中段电蓝 (~30%) */
          [
            "#2798d4", "#2ea0d9", "#34a8dd", "#2798d4", "#2ea0d9",
            "#34a8dd", "#2798d4", "#2ea0d9", "#34a8dd", "#2798d4",
          ],
          /* Band 2 — 浅冰蓝高光 (~10%) */
          [
            "#52c8ea", "#5bd0ee", "#64d8f2", "#52c8ea", "#5bd0ee",
            "#64d8f2", "#52c8ea", "#5bd0ee", "#64d8f2", "#52c8ea",
          ],
        ]}
      />

      {/* CLOUD c (v13 rename: was "e" — blue-green cyan dominant palette, only 2 rose-pink anchor sparklers,
          ext 4. Sits at z=-3.5, deeper than the z=-2.8 pair (new d/e), so gets the EARLIEST letter among
          the front-trio in far→near naming. */}
      <NebulaField
        position={[13.145, -7.25, -3.5]}   /* v26: c 左 50px @ scale 75.48 (X 13.807 → 13.145) */
        extents={[4, 4, 2.4]}
        count={5600}
        particleSize={0.14}
        noiseFreq={0.55}
        densityThreshold={0.34}
        octaves={4}
        hueJitter={0.03}
        satJitter={0.15}
        lightJitter={0.22}
        hueZoneScale={0.25}            /* back to default — uniformly cyan palette, normal mixing */
        hueSkew={1.5}                  /* matches d's new skew so band-0 darks dominate consistently */
        layerAxis="y"
        layerFreq={2.5}
        layerPhase={1.8}                   /* unique phase so e doesn't band-align with d */
        layerContrast={0.3}
        centerBoost={0.35}
        centerBoostFalloff={1.5}
        shape="ellipsoid"
        palettes={[
          /* c — v19 sat+10% + bright+10%（跟 e 同源）。映射：#28387f→#283c92,
             #3f4da0→#4152b7, #425ea8→#4466bf, #7c7ccf→#8585ea, #7c85cf→#8590e9 */
          /* Band 0 — 深靛蓝结构骨架 (~50%) */
          [
            "#283c92", "#4152b7", "#283c92", "#4152b7", "#283c92",
            "#4152b7", "#283c92", "#4152b7", "#283c92", "#4152b7",
          ],
          /* Band 1 — 中段靛蓝/蓝紫 (~30%) */
          [
            "#4152b7", "#4466bf", "#4152b7", "#4466bf", "#4152b7",
            "#4466bf", "#4152b7", "#4466bf", "#4152b7", "#4466bf",
          ],
          /* Band 2 — 薰衣草蓝高光（两个 #8585ea/#8590e9 非常接近）*/
          [
            "#4466bf", "#8585ea", "#8590e9", "#8585ea", "#8590e9",
            "#8585ea", "#8590e9", "#8585ea", "#8590e9", "#4466bf",
          ],
        ]}
      />

      {/* CLOUD f — sparse high-brightness blue-green sparkler over the
          fan cluster (a-e).  Acts as 点睛之笔 highlight scattered above
          the existing fan body.  Position + extents stay strictly
          inside the COMBINED bounding box of a/b/c/d/e (world X 5-13,
          Y -10 to -4) so it never overflows the fan area.  Sparse +
          large particles + bright mint-cyan palette = jewel-like
          flickers on top of the deeper blue fan. */}
      <NebulaField
        position={[11.551, -7, -2.8]}       /* v27: f 右 35px @ scale 79.054 (X 11.108 → 11.551) */
        rotation={[0, 0, 0.3491]}           /* v19: CW 5° from prev 25° → +20° CCW per user */
        extents={[5.693, 4.112, 2.85]}      /* v26: 900×650 px @ z=-2.8 scale 79.05 (was 6/4.5/3) */
        count={1283}                         /* v26 density preserved (vol ratio 0.823): 1558 → 1283 */
        particleSize={0.16}                  /* slightly larger so sparse particles still read as bright jewels */
        noiseFreq={0.6}                      /* finer noise → small bright nuggets */
        densityThreshold={0.42}              /* higher → fewer particles survive → more sparse */
        octaves={4}
        hueJitter={0.02}                     /* locked tight so no blue-green drift into pure green or pure blue */
        satJitter={0.10}                     /* low — all particles stay saturated */
        lightJitter={0.15}
        hueZoneScale={0.15}                  /* smaller value → bigger contiguous color zones, less mixing */
        hueSkew={1.3}                        /* slight bias toward bright bands — sparkler layer should still pop */
        layerAxis="x"
        layerFreq={1.5}
        layerPhase={3.7}
        layerContrast={0.25}
        centerBoost={0.2}                    /* low → don't pull particles into a centre, stay sparse */
        centerBoostFalloff={2.5}
        shape="ellipsoid"
        palettes={[
          /* f — v28 青绿→青蓝过渡 per user (右扇形 cx 1713，gradient ~30% 位置) */
          /* Band 0 — 深青蓝（带绿调） */
          [
            "#207090", "#1c6888", "#246e94", "#207090", "#1c6888",
            "#246e94", "#207090", "#1c6888", "#246e94", "#207090",
          ],
          /* Band 1 — 中段青蓝 */
          [
            "#48a0b8", "#50a8c0", "#5cb0c8", "#48a0b8", "#50a8c0",
            "#5cb0c8", "#48a0b8", "#50a8c0", "#5cb0c8", "#48a0b8",
          ],
          /* Band 2 — 浅青蓝高光 sparkler */
          [
            "#90d0d8", "#a0d8e0", "#b0e0e8", "#90d0d8", "#a0d8e0",
            "#b0e0e8", "#90d0d8", "#a0d8e0", "#b0e0e8", "#a0d8e0",
          ],
        ]}
      />

      {/* CLOUD 1 — first left-side cloud (all others sit X > 0, this one
          balances composition on the left). Screen target 800×500 px @
          z=-5 (px/u≈68.82) → extents [5.81, 3.64, 1.5]. Box shape for
          a clean rectangular silhouette. Deep purple A-family palette so
          it reads as part of the same nebula band rather than a foreign
          new colour family. */}
      <NebulaField
        position={[-11.81, -3.094, -5]}     /* v25: 上 50px @ scale 68.82 (Y -3.82 → -3.094) */
        extents={[8.064, 6.175, 2.0]}       /* v36 width +30px (step 3, tied with cloud 3) @ z=-5 (scale 68.82): ext_x 7.846→8.064 → screen 1110×850 px */
        count={5404}                         /* v26 density preserved (vol ratio 1.127): 4795 → 5404 */
        particleSize={0.14}
        noiseFreq={0.45}
        densityThreshold={0.36}
        octaves={4}
        hueJitter={0.04}
        satJitter={0.22}
        lightJitter={0.2}
        hueZoneScale={0.22}
        hueSkew={1.55}
        layerAxis="y"
        layerFreq={2.2}
        layerPhase={1.6}
        layerContrast={0.5}
        centerBoost={0.45}
        centerBoostFalloff={2.0}
        gradientAxis="x"                       /* v29: 左蓝紫→右粉红 cluster 渐变 per user (参考图色谱) */
        gradientColors={["#2a3098", "#c870a8"]}
        gradientMix={0.55}
        palettes={[
          /* v29b: sat +20% per user. 每色 1.2X - 0.2×gray. 整体仍是冷色
             蓝紫→玫瑰粉光谱，但更鲜活. */
          /* Band 0 — 深海军/深紫黑 (~60%) */
          [
            "#09123d", "#0c1646", "#091a4a", "#160c46", "#091a4a",
            "#10154f", "#161d57", "#0c1646", "#160c46", "#161d57",
          ],
          /* Band 1 — 中段蓝紫罗兰 (~30%) */
          [
            "#2929af", "#3327b7", "#422fbf", "#3333b7", "#2929af",
            "#3327b7", "#422fbf", "#2929af", "#3333b7", "#422fbf",
          ],
          /* Band 2 — 浅紫罗兰 + 玫瑰粉高光 (~10%) */
          [
            "#6447c4", "#6c59cc", "#7d57d4", "#a167d1", "#bb6ece",
            "#cd77c8", "#d589c2", "#dca3c9", "#bf81c4", "#a781d7",
          ],
        ]}
      />

      {/* ──────────────────────────────────────────────────────────
          LEFT-MIDDLE CLUSTER (2 / 3 / 4 / 5) — replicates the
          "iridescent purple silk + magenta rose particle storm" look
          from 紫粉虹彩星云调色参考.html.  All 4 clouds are positioned
          INSIDE cloud 1's bounding range (1 center [-11.81, -3.82, -5]
          ext [7.747, 4.853, 2.0] → world X ∈ [-19.56, -4.06], Y ∈
          [-8.67, 1.03], Z ∈ [-7, -3]).

          v22 UNIFY: v21's 95%/80%/60%/40% staircase read as "4 nested
          concentric ellipses of decreasing size" — felt weird because
          the layers were obviously different SIZES rather than one
          cloud with depth.  v22 instead targets ALL 4 layers at the
          SAME screen footprint (~600 × 410 px centred at screen
          (200, 650)) by inverse-perspective scaling world X/Y/extents
          to compensate for each Z depth.  Layers now differ ONLY by
          PALETTE and PARTICLE DENSITY, so the cluster reads as ONE
          coherent cloud with internal depth (silk dim → silk bright
          → dense magenta storm → sparse cool jewels).
          Names 2-5 continue the numeric convention started by 1.

          4-layer stack (back → front), each tuned to one Zone of the
          reference palette:
            2 (z=-6.0)  → Zone A 深紫黑 + Zone B Band 1 暗绸 ── 雾底
            3 (z=-5.0)  → Zone B Band 2 + Band 3 ──────────── 绸缎中亮
            4 (z=-3.8)  → Zone C 三段品红/玫瑰/桃粉 ─────── 粒子主云
            5 (z=-3.0)  → 冷锚 sparkler（电青 + 虹彩紫 + 冰白）
                          ⟵ 用户决策: 移除暖金/桃橙锚点，改为全冷锚

          Why 4 not 3: the silk effect needs "暗 vs 亮" 两段底面才能
          形成绸光对比，把它压成一层就只剩均匀紫雾，没绸缎反光感
          (参考图 Zone B Band 1 vs Band 3 的明度跨度极大).
          ────────────────────────────────────────────────────────── */}

      {/* CLOUD 2 — left-middle background fog (deepest of left-middle
          cluster, nested inside cloud 1).  Pure Zone A 深紫黑 + Zone B
          Band 1 暗绸, very low saturation jitter to keep moody.
          hueSkew 1.85 biases hard toward band 0 so the brighter bands
          almost never appear.  v22: position + extents inverse-scaled
          for z=-6 so it projects to screen ~600 × 410 @ (200, 650). */}
      <NebulaField
        position={[-11.231, -3.077, -6]}      /* v26: 又左 30px @ scale 65 (X -10.769 → -11.231), screen (70, 700) — 不变 */
        extents={[6.462, 4.462, 2.34]}        /* v36 width +40px (backmost, step 4) @ z=-6 (scale 65): ext_x 6.154→6.462 → screen 840×580 px */
        count={7339}                          /* v29c density preserved 14.64 (vol 896.6→501.4): 13125 → 7339 */
        particleSize={0.14}
        noiseFreq={0.45}
        densityThreshold={0.36}
        octaves={4}
        hueJitter={0.03}
        satJitter={0.10}                      /* low — moody back layer */
        lightJitter={0.18}
        hueZoneScale={0.20}
        hueSkew={1.85}                        /* very dark — band 0 dominates, band 2 rare */
        layerAxis="x"
        layerFreq={2.0}
        layerPhase={0.5}
        layerContrast={0.35}
        centerBoost={0.40}
        centerBoostFalloff={1.8}
        shape="ellipsoid"
        gradientAxis="x"                      /* v36: 左蓝→右粉 cluster 渐变 per user. 与 cloud 1/3/4/5 同向 */
        gradientColors={["#2a2880", "#7a2050"]}  /* 左端深蓝紫 + 右端深玫瑰红，贴合 cloud 2 暗底深色族 */
        gradientMix={0.40}                    /* 40% blend — 后景层不抢前景，但提供方向感 */
        palettes={[
          /* 2 (v29) — 改为深海军/深紫黑 per user (参考图最深部色谱).
             移除所有红色，纯冷色：navy → 深紫蓝 → 偏紫红中亮. */
          /* Band 0 — 极深海军 + 紫黑 (~60%) */
          [
            "#0a0e2a", "#0e1232", "#101638", "#0a0e2a", "#0e1638",
            "#161a3c", "#0e1232", "#0a0e2a", "#101638", "#161a3c",
          ],
          /* Band 1 — 中段深紫蓝 (~30%) */
          [
            "#2a285c", "#302864", "#34306c", "#2a285c", "#302864",
            "#34306c", "#2a285c", "#302864", "#342c64", "#302864",
          ],
          /* Band 2 — 偏紫红中亮 (~10%) — 极少量带红 anchor */
          [
            "#4a3068", "#503070", "#582c70", "#4a3068", "#503070",
            "#582c70", "#4a3068", "#503070", "#582c70", "#503070",
          ],
        ]}
      />

      {/* CLOUD 3 — left-middle silk mid-bright (绸缎层).  Slightly
          forward of 2 (z=-5).  hueSkew 1.4 + lightJitter 0.30 = wide
          brightness range mimicking silk reflection (some particles
          near-white, others medium lavender, all coexisting).
          v22: same screen footprint as 2 to merge into one cloud. */}
      <NebulaField
        position={[-10.607, -2.906, -5]}      /* v27: 移到 cloud 2 中心 (70, 700) @ scale 68.82 */
        extents={[7.265, 4.977, 2.6]}         /* v36 width +30px (step 3, tied with cloud 1) @ z=-5 (scale 68.82): ext_x 7.047→7.265 → screen 1000×685 px */
        count={10500}                         /* v29b: count 链式递减 20% from 2 (13125 × 0.8) per user */
        particleSize={0.13}
        noiseFreq={0.5}
        densityThreshold={0.34}
        octaves={4}
        hueJitter={0.04}                      /* slight hue drift for iridescence */
        satJitter={0.18}
        lightJitter={0.30}                    /* HIGH — full silk brightness range */
        hueZoneScale={0.25}
        hueSkew={1.4}                         /* more even — let mid + bright shine */
        layerAxis="y"                         /* vertical streaks like silk fold */
        layerFreq={2.2}
        layerPhase={2.0}
        layerContrast={0.35}
        centerBoost={0.30}
        centerBoostFalloff={1.6}
        shape="ellipsoid"
        gradientAxis="x"                      /* v36: 左蓝→右粉 cluster 渐变 per user. 与 cloud 1/2/4/5 同向 */
        gradientColors={["#5060c0", "#c870a0"]}  /* 左端蓝紫罗兰 + 右端玫瑰紫，silk 层最明显的色温过渡 */
        gradientMix={0.45}                    /* 45% blend — silk 中等亮度层，渐变明显 */
        palettes={[
          /* 3 (v29) — 紫绸缎中层 + 玫瑰粉高光 per user. 参考图中等亮度
             紫色丝绸 + 粉色光泽. silk 效果：宽明度范围，从中紫到亮粉. */
          /* Band 0 — 中段紫罗兰 (~30%) */
          [
            "#3a3088", "#403490", "#3a3088", "#443898", "#383088",
            "#403490", "#3a3088", "#443898", "#383088", "#403490",
          ],
          /* Band 1 — 中段紫 + 粉紫桥色 (~40%) */
          [
            "#7050b0", "#8060b8", "#9070c0", "#7050b0", "#8868b8",
            "#8060b8", "#9070c0", "#7050b0", "#8060b8", "#9070c0",
          ],
          /* Band 2 — 浅薰衣草 + 玫瑰粉光泽 (~30%) — 绸光最亮端 */
          [
            "#c8a0d0", "#d4a8d4", "#e0b0d8", "#c8a0d0", "#d4a8d4",
            "#e0b0d8", "#c8a0d0", "#e8b8d8", "#d4a8d4", "#e0b0d8",
          ],
        ]}
      />

      {/* CLOUD 4 — left-middle rose particle storm (视觉焦点).
          Tilted +15° CCW around Z so the magenta band "flows" like
          petals drifting across the silk surface, not a flat blob.
          hueSkew 1.3 favors brighter bands so the sparkler effect
          dominates (matches the reference image's "粒子云层" feel).
          v22: same screen footprint as 2/3 but 2-3× HIGHER density →
          clear magenta focal point without obvious size disparity. */}
      <NebulaField
        position={[-9.858, -2.701, -3.8]}     /* v27: 移到 cloud 2 中心 (70, 700) @ scale 74.05 */
        rotation={[0, 0, 0.2618]}             /* +15° CCW — petal flow */
        extents={[6.617, 4.524, 2.38]}        /* v36 width +10px (frontmost, step 1) @ z=-3.8 (scale 74.05): ext_x 6.549→6.617 → screen 980×670 px */
        count={8400}                          /* v29b: count 链式递减 20% from 3 (10500 × 0.8) per user */
        particleSize={0.12}                   /* smaller — individual "粒子" feel */
        noiseFreq={0.55}
        densityThreshold={0.34}
        octaves={4}
        hueJitter={0.03}                      /* tight lock — no drift out of magenta family */
        satJitter={0.15}
        lightJitter={0.25}
        hueZoneScale={0.18}                   /* smaller → big contiguous magenta blobs */
        hueSkew={1.3}                         /* bright bands favored — sparkler dominates */
        layerAxis="x"
        layerFreq={2.4}
        layerPhase={3.5}
        layerContrast={0.35}
        centerBoost={0.30}
        centerBoostFalloff={1.6}
        shape="ellipsoid"
        gradientAxis="x"                      /* v36: 左蓝→右粉 cluster 渐变 per user. 焦点层强度最大 */
        gradientColors={["#3848c0", "#e060a0"]}  /* 左端皇家蓝紫 + 右端纯玫瑰粉，焦点层蓝-粉对比最强 */
        gradientMix={0.50}                    /* 50% blend — 视觉焦点层渐变最强，决定整体观感 */
        palettes={[
          /* 4 (v29) — 玫瑰粒子焦点 per user. 参考图最显眼的玫瑰品红粒子云，
             深品红 → 中玫瑰 → 亮玫红. 剔除任何带橙/桃色的暖红，全部冷色玫瑰. */
          /* Band 0 — 深玫瑰品红 (~30%) — 粒子阴侧 */
          [
            "#5e286c", "#6a2c78", "#5e286c", "#6a2c78", "#7a3088",
            "#5e286c", "#6a2c78", "#7a3088", "#5e286c", "#6a2c78",
          ],
          /* Band 1 — 中段玫瑰粉 (~40%) — 粒子主调 */
          [
            "#a04088", "#b04898", "#c05ca8", "#a04088", "#b04898",
            "#c05ca8", "#a04088", "#b04898", "#c05ca8", "#a04088",
          ],
          /* Band 2 — 亮玫红 sparkler (~30%) — 全部冷色玫红，无桃橙 */
          [
            "#e070a8", "#e878b0", "#f088b8", "#e070a8", "#e878b0",
            "#f088b8", "#e070a8", "#e878b0", "#f088b8", "#e878b0",
          ],
        ]}
      />

      {/* CLOUD 5 — left-middle COOL anchor sparkler (最稀疏锚点).
          User decision: removed warm gold/peach anchors, replaced with
          all-cool palette — electric cyan + iridescent violet + cool
          ice white.  This makes the left-middle cluster read as
          "pure cool jewel scatter on rose silk", reinforcing the
          冷紫绸缎底 + 热玫瑰粒子 visual logic without warm interference.
          Same role / sparseness mechanics as fan-cluster's "f":
          high densityThreshold + large particleSize. */}
      <NebulaField
        position={[-9.983, -2.735, -4.0]}     /* v28: 下移一层 z=-3→-4.0 (在 4 之后) per user. 保持屏幕 (70, 700) @ scale 73.125 */
        extents={[6.770, 4.478, 2.21]}        /* v36 width +20px (step 2) @ z=-4 (scale 73.125): ext_x 6.633→6.770 → screen 990×655 px */
        count={184}                           /* v29b: 恢复 v28b 值 per user "5 不动"（保留 sparkler 性质）*/
        particleSize={0.18}                   /* largest — jewels */
        noiseFreq={0.6}
        densityThreshold={0.42}               /* HIGHEST — matches fan-f */
        octaves={4}
        hueJitter={0.02}                      /* locked tight, no drift */
        satJitter={0.10}
        lightJitter={0.15}
        hueZoneScale={0.15}
        hueSkew={1.3}                         /* bright bands favored */
        layerAxis="x"
        layerFreq={1.5}
        layerPhase={4.0}
        layerContrast={0.25}
        centerBoost={0.2}                     /* low — keep sparse */
        centerBoostFalloff={2.5}
        shape="ellipsoid"
        gradientAxis="x"                      /* v36: 左蓝→右粉 cluster 渐变 per user. sparkler 层用浅色端点 */
        gradientColors={["#7060d0", "#e088c0"]}  /* 左端鸢尾蓝紫 + 右端玫瑰粉，sparkler 顶层柔和过渡 */
        gradientMix={0.45}                    /* 45% blend — sparkler 层亮，渐变不能太强否则盖过 palette */
        palettes={[
          /* 5 (v29) — 浅粉 sparkler 锚点 per user. 参考图最亮的粉色光斑.
             紫红 anchor → 浅粉紫 → 极淡近白粉. 整体冷色，无暖橙. */
          /* Band 0 — 中段紫红 anchor (~30%) — 衬底带点深紫 */
          [
            "#684078", "#704480", "#684078", "#704480", "#7c4888",
            "#684078", "#704480", "#7c4888", "#684078", "#704480",
          ],
          /* Band 1 — 浅粉紫 (~30%) */
          [
            "#b890c8", "#c098cc", "#cca8d4", "#b890c8", "#c098cc",
            "#cca8d4", "#b890c8", "#c098cc", "#cca8d4", "#b890c8",
          ],
          /* Band 2 — 极淡粉 sparkler (~40%): 浅粉 + 近白冷粉 */
          [
            "#f0c0d8", "#f4c8dc", "#f8d0e0", "#f0c0d8", "#f4c8dc",
            "#f8d0e0", "#fcd8e4", "#f0c0d8", "#f4c8dc", "#fcd8e4",
          ],
        ]}
      />

      {/* Other three nebulas paused — uncomment once the top-right one
          is dialled in, then duplicate the same RichNebula structure
          with different palettes per position. */}
      {/*
      <NebulaPatches position={[-9, 2.5, -4]} patches={[...]} />
      <NebulaPatches position={[8, -1.5, -5]} patches={[...]} />
      <NebulaPatches position={[-6, -3, 2]} patches={[...]} />
      */}

      {/* Three sun variants — swap one of these in to compare:
          - <AmberSun />       original PBR glass (no dispersion, no SSS)
          - <DispersionSun />  drei MeshTransmissionMaterial (R/G/B dispersion via FBO)
          - <AmberCoreSun />   mattdesl-style internal-light SSS (warm core glow)
          All three keep the LOCKED displacement + pulse + pano spec. */}
      <AmberCoreSun />
      {/* Sun label — same chromatic three-layer Text/Billboard treatment
          used by every planet (PlanetLabel above), so the sun reads as
          a navigable "world" too. Sits in front of the sun core in
          screen-space (Billboard always faces the camera). Sun radius
          is 1.2, so the label sits at distance ≈ 1.2 * 1.1 + 0.06 =
          1.38 world units toward the camera. Not wrapped in <Float>:
          the parent sun bobs gently (floatIntensity 0.12) but the
          drift is well under one frame and a stable label reads
          better than a wobbling one. raycast={() => null} inside
          PlanetLabel means clicks still pass through to the sun
          mesh's onClick → /about. */}
      <PlanetLabel
        name="Amber Xu"
        planetRadius={1.2}
        hovered
        sizeMultiplier={1.6}
      />

      <PlanetSystem
        onPlanetClick={onPlanetClick}
        cursorInsideRef={cursorInsideRef}
      />

      {/* Global post-processing chain.
          - HueSaturation: neutral (saturation 0). Kept as a no-op slot for
            quick tint adjustments without re-wiring the chain.
          - Bloom: gentle glow on bright pixels. luminanceThreshold = 0.7
            so only the sun + emissive map highlights + bright nebula
            cores bleed into a halo; darker matte stuff stays matte. Tune
            `intensity` if too soft / too hot. mipmapBlur gives a higher
            quality wide blur at moderate cost. */}
      {/* Post-processing chain — kept on mobile but at a much lighter
          setting. Without ANY bloom on mobile, the planets read as flat
          stickers pasted on pure black; with the full desktop bloom they
          shred the GPU. Sweet spot for mobile: intensity 0.35 (was 0.6)
          and only 2 mip levels (was 3) — keeps the atmospheric softening
          that bridges sun/HYSTON into the background while keeping the
          pass cheap.
          levels controls how many mip steps the bloom walks down before
          compositing — each step roughly doubles the kernel radius.
          Default 8 → halo bleeds ~100px past silhouette. Cut to 3 → halo
          hugs the silhouette (~25-30px out), which reads as "internal
          glow that just kisses the edge". Mobile goes one tighter still. */}
      <EffectComposer>
        <HueSaturation hue={0} saturation={0} />
        <Bloom
          intensity={lowQuality ? 0.35 : 0.6}
          luminanceThreshold={0.7}
          luminanceSmoothing={0.3}
          mipmapBlur
          levels={lowQuality ? 2 : 3}
        />
      </EffectComposer>
    </>
  );
}

// Slugs whose static detail page exists at public/works/<slug>/index.html.
// Anything NOT in this set falls through to the "still forming" modal.
// Next.js serves /public/works/ directly (the app router uses /work/ singular,
// not /works/ plural, so there's no route collision).
const PUBLISHED_WORKS = new Set([
  "nemo",
  "moonlight",
  "model",
  "concept",
  "mask",
]);

export default function Universe() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Shared site-wide EN/中 toggle — drives the INDEX/目录 + Close/关闭
  // labels on the left cluster passed to <TopNav>. The TopNav itself
  // already wires HOME/WORKS/ABOUT to this store.
  const [lang] = useLang();
  // Mobile / weak-GPU detection drives quality degradation: lower dpr,
  // skip Bloom, fewer stars. See useIsMobile + SceneContent.lowQuality.
  const isMobile = useIsMobile();
  // tracked via DOM pointer events on the fullscreen wrapper; read by
  // PlanetSystem in useFrame to gate mouse-driven rotation
  const cursorInsideRef = useRef(true);

  // Click handler: published works → navigate to their static detail page;
  // placeholder works → show the "still forming" modal as before.
  const handlePlanetClick = (slug: string) => {
    if (PUBLISHED_WORKS.has(slug)) {
      // Clean URL — next.config rewrites /works/<slug>/ to
      // /public/works/<slug>/index.html behind the scenes.
      window.location.href = `/works/${slug}/`;
    } else {
      setActiveSlug(slug);
    }
  };

  return (
    <div
      className="fixed inset-0 z-10"
      onPointerEnter={() => {
        cursorInsideRef.current = true;
      }}
      onPointerLeave={() => {
        cursorInsideRef.current = false;
      }}
    >
      <Canvas
        // low-side angle so orbital rings read as thin flattened ellipses,
        // matching the reference solar-system diagram. Roughly 14° elevation.
        camera={{ position: [0, 3.0, 12], fov: 48 }}
        gl={{
          antialias: true,
          alpha: true,                /* transparent canvas so LiquidEther background bleeds through */
          powerPreference: "high-performance",
        }}
        // Mobile caps DPR at 1.25 (vs desktop 2) → ~2.5× fewer pixels to
        // shade per frame, the single biggest perf win on phones.
        dpr={isMobile ? [1, 1.25] : [1, 2]}
        onCreated={({ camera, gl }) => {
          camera.lookAt(0, 0, 0);
          // Global brightness multiplier — applies uniformly to every
          // mesh's final colour, so it brightens the sun + all 9
          // planets + moon together without touching their individual
          // material props. Default is 1.0; 1.5 = 50% brighter overall.
          // Mobile gets a calmer 1.0 so the planets don't pop too hard
          // against the pure-black backdrop (Bloom is also lighter on
          // mobile, so without dropping exposure the scene reads as
          // "neon stickers on black"). The matching `useEffect` inside
          // SceneContent keeps this in sync if the viewport changes
          // (e.g. user rotates the phone) without remounting the canvas.
          gl.toneMappingExposure = isMobile ? 1.0 : 1.4;
        }}
      >
        {/* scene background removed so LiquidEther layer behind canvas
            shows through.  Fog still applies in the dark cosmic colour
            so distant nebulas blend toward dark, just without a solid
            backdrop. */}
        <fog attach="fog" args={["#0a0807", 15, 40]} />
        <SceneContent
          onPlanetClick={handlePlanetClick}
          cursorInsideRef={cursorInsideRef}
          lowQuality={isMobile}
        />
      </Canvas>

      {/* brand + collapsible works directory.
          The brand row sits inside a <GlassSurface> (React Bits glass with
          chromatic SVG displacement) so the nav reads as a frosted pill
          floating over the universe canvas.  Glass takes width/height from
          fit-content + inline padding; the inner flex row provides the
          actual layout. */}
      {/* Top nav — /work uses the wide mode: TopNav with a `left`
          cluster (brand + INDEX) fuses with the always-on right
          cluster (HOME · WORKS · ABOUT · EN/中) into one continuous
          glass bar that spans the full top of the page. The previous
          two-corner-capsule layout is gone — Amber asked for them to
          be visually connected on this page. */}
      <TopNav
        left={
          <>
            {/* Brand mark + INDEX — font-mono removed so both children
                inherit the Times serif declared on TopNav's inner row.
                Letter-spacing + uppercase + colour preserved. */}
            <span className="text-xs uppercase tracking-[0.3em] text-muted">
              Amber Xu · Universe
            </span>
            {/* INDEX disclosure — plain text matching the brand label
                beside it (no border / button frame). ▸ rotates 90° to
                signal open. */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="pointer-events-auto inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.3em] text-muted hover:text-amber transition-colors"
              aria-expanded={menuOpen}
              aria-controls="universe-works-menu"
            >
              <span>
                {menuOpen
                  ? lang === "zh" ? "关闭" : "Close"
                  : lang === "zh" ? "目录" : "Index"}
              </span>
              <span className="text-[10px] opacity-80 transition-transform" style={{ transform: menuOpen ? "rotate(90deg)" : "rotate(0)" }}>▸</span>
            </button>
          </>
        }
        below={
          menuOpen ? (
            <ul
              id="universe-works-menu"
              /* Fixed-width column (w-80 = 320px) so each row's right-
                 aligned category tag (ml-auto on the <span> inside
                 the <li>) actually has room to push to the right and
                 sit close to the name. Without an explicit width the
                 ul inherits the full-width TopNav wrapper (left-6
                 right-6) and the categories drift all the way to the
                 viewport's far-right edge, where they read as missing.
                 max-w cap protects very narrow phones from overflow. */
              className="pointer-events-auto mt-3 flex w-80 max-w-[calc(100vw-3rem)] flex-col gap-1.5 text-[11px] uppercase tracking-[0.15em] border-l border-white/10 pl-3 pr-3"
              style={{ fontFamily: 'Times, "Times New Roman", serif' }}
            >
              {/* Flatten planets + moons so HYSTON gets its own <li> and
                  inherits the parent gap-1.5 (was nested inside Photography's
                  <li> → no gap between them).  Marker is a 4-point sparkle
                  star (vertical taller than horizontal) per user request. */}
              {PLANETS.flatMap((p) => [
                { slug: p.slug, name: p.name, category: p.category, color: p.iridescenceColor },
                ...((p.moons ?? []).map((m) => ({
                  slug: m.slug,
                  name: m.name,
                  category: m.category,
                  color: m.iridescenceColor,
                }))),
              ]).map((item) => {
                /* Both `name` and `category` are bilingual dicts ({zh,en}).
                   Pick the side matching the site-wide language store, so
                   when Amber flips EN/中 in the TopNav the directory
                   updates left + right column in sync. CJK names ignore
                   the uppercase utility on the <span>, so 寰外/月光/etc.
                   render as-is; latin names get capitalised. */
                const itemName = item.name[lang];
                const itemCategory = item.category?.[lang];
                /* Published works (HTML detail page shipped) read at full
                   opacity; placeholders dim to ~65% and tag the category
                   with a small "· soon" suffix so visitors know the
                   planet is still WIP before they click and see the
                   "still forming" modal. */
                const isPublished = PUBLISHED_WORKS.has(item.slug);
                const wipLabel = lang === "zh" ? "即将上线" : "soon";
                return (
                  <li key={item.slug}>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        handlePlanetClick(item.slug);
                      }}
                      className={`group flex items-center gap-2.5 hover:text-white transition-colors w-full text-left py-0.5 ${
                        isPublished ? "text-muted" : "text-muted/65"
                      }`}
                    >
                      <svg
                        width="9"
                        height="14"
                        viewBox="-9 -14 18 28"
                        className="shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                        aria-hidden
                      >
                        {/* 4-point sparkle: vertical points at y=±14, horizontal
                            at x=±5, inner waist ±3 → tall thin twinkle shape.
                            Silver fill per user (was per-planet iridescent). */}
                        <path
                          d="M 0 -14 L 3 -3 L 9 0 L 3 3 L 0 14 L -3 3 L -9 0 L -3 -3 Z"
                          fill="#d0d4dc"
                        />
                      </svg>
                      <span className="truncate uppercase tracking-wider">{itemName}</span>
                      {itemCategory && (
                        <span
                          aria-hidden
                          className="ml-auto pl-3 text-[10px] tracking-[0.15em] text-muted/55 group-hover:text-muted/80 transition-colors shrink-0"
                        >
                          {itemCategory}
                          {!isPublished && (
                            <span className="ml-1 italic text-muted/40">· {wipLabel}</span>
                          )}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null
        }
      />

      {/* hint removed per user — "← move cursor to rotate →" no longer rendered */}

      {/* back-to-home moved to left header row */}

      {activeSlug && (
        <PlanetModal slug={activeSlug} onClose={() => setActiveSlug(null)} />
      )}
    </div>
  );
}

function PlanetModal({
  slug,
  onClose,
}: {
  slug: string;
  onClose: () => void;
}) {
  const planet = PLANETS.find((p) => p.slug === slug);
  // Read the shared language store so the modal title swaps in sync
  // with the INDEX dropdown when Amber flips EN/中 in TopNav. The
  // `name` field on each planet is a {zh,en} dict (see Planet type).
  const [lang] = useLang();
  if (!planet) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative max-w-md rounded-2xl border border-white/10 bg-black/40 p-8 text-center backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 font-serif text-3xl italic text-amber">
          {planet.name[lang]}
        </h2>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
          This world is still forming. Come back when the dust settles.
        </p>
        <button
          onClick={onClose}
          className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-muted hover:text-amber"
        >
          close
        </button>
      </div>
    </div>
  );
}
