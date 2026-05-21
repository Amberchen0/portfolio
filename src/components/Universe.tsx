"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Float,
  Text,
  Billboard,
  useTexture,
} from "@react-three/drei";
import { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";

/** A moon orbits a parent planet (not the sun). */
type Moon = {
  slug: string;
  name: string;
  color: string;
  iridescenceColor: string;
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
  slug: string;
  name: string;
  color: string;
  iridescenceColor: string;
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
  { slug: "model",     name: "L'HEURE VIOLETTE", color: "#8b4513", iridescenceColor: "#f29a4a",
    size: 1.00, orbitRadius: 4.6, angle: Math.PI / 2,                          orbitSpeed: ORBIT_SPEED, orbitTilt: [0.22, -0.10] },
  { slug: "nemo",      name: "Nemo",            color: "#1a6b8e", iridescenceColor: "#3dd5b0",
    size: 1.00, orbitRadius: 3.6, angle: Math.PI / 2 + (2 * Math.PI) / 8,     orbitSpeed: ORBIT_SPEED, orbitTilt: [-0.30, 0.12] },
  { slug: "concept",   name: "Concept Design",  color: "#1d5b58", iridescenceColor: "#7ad5e8",
    size: 1.00, orbitRadius: 6.0, angle: Math.PI / 2 + (4 * Math.PI) / 8,     orbitSpeed: ORBIT_SPEED, orbitTilt: [0.15, 0.26] },
  { slug: "moonlight", name: "Moonlight",       color: "#2a1f3d", iridescenceColor: "#c08af0",
    size: 0.85, orbitRadius: 7.2, angle: Math.PI / 2 + (6 * Math.PI) / 8,     orbitSpeed: ORBIT_SPEED, orbitTilt: [-0.24, -0.18] },
  { slug: "mask",      name: "Under the Mask",  color: "#8b1d22", iridescenceColor: "#f0c050",
    size: 0.85, orbitRadius: 5.3, angle: Math.PI / 2 + Math.PI,                orbitSpeed: ORBIT_SPEED, orbitTilt: [0.30, 0.05] },
  { slug: "game",      name: "Game",            color: "#666666", iridescenceColor: "#cccccc",
    size: 0.55, orbitRadius: 8.2, angle: Math.PI / 2 + (10 * Math.PI) / 8,    orbitSpeed: ORBIT_SPEED, orbitTilt: [-0.14, 0.28] },

  // Drawing — placeholder (ink-toned)
  { slug: "drawing",      name: "Drawing",      color: "#2a2a32", iridescenceColor: "#b0a8b8",
    size: 0.55, orbitRadius: 7.6, angle: Math.PI / 2 + (12 * Math.PI) / 8,    orbitSpeed: ORBIT_SPEED, orbitTilt: [0.28, 0.10] },

  // Photography — placeholder + HYSTON moon-system parent (sized up to be believable parent)
  { slug: "photography",  name: "Photography",  color: "#3a4a58", iridescenceColor: "#a8c0d8",
    size: 0.95, orbitRadius: 6.7, angle: Math.PI / 2 + (14 * Math.PI) / 8,    orbitSpeed: ORBIT_SPEED, orbitTilt: [-0.20, 0.30],
    moons: [
      {
        slug: "hyston",
        name: "HYSTON",
        color: "#7a4520",
        iridescenceColor: "#e8b070",
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
  opacity = 0.16,
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
        color="#d9a574"
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
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
}: {
  name: string;
  planetRadius: number;
  hovered: boolean;
}) {
  const shift = hovered ? 0.018 : 0.008;
  const fontSize = hovered ? 0.16 : 0.13;
  const fillOpacity = hovered ? 0.95 : 0.8;
  // sit just outside hover-scaled (1.1x) sphere, on the camera-facing side
  const distance = planetRadius * 1.1 + 0.06;
  return (
    <Billboard>
      {/* magenta-red ghost */}
      <Text
        position={[shift, 0, distance]}
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
      <OrbitRing radius={moon.orbitRadius} opacity={0.12} segments={96} />
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
            <meshPhysicalMaterial
              color={moon.color}
              roughness={0.18}
              metalness={0.05}
              transmission={0.85}
              thickness={0.8}
              ior={1.5}
              iridescence={1.0}
              iridescenceIOR={1.3}
              iridescenceThicknessRange={[100, 800]}
              clearcoat={1.0}
              clearcoatRoughness={0.08}
              attenuationColor={moon.iridescenceColor}
              attenuationDistance={2.0}
              envMapIntensity={1.4}
            />
          </mesh>
          <PlanetLabel
            name={moon.name}
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
              <meshPhysicalMaterial
                color={planet.color}
                roughness={0.18}
                metalness={0.05}
                transmission={0.85}
                thickness={1.2}
                ior={1.5}
                iridescence={1.0}
                iridescenceIOR={1.3}
                iridescenceThicknessRange={[100, 800]}
                clearcoat={1.0}
                clearcoatRoughness={0.08}
                attenuationColor={planet.iridescenceColor}
                attenuationDistance={2.5}
                envMapIntensity={1.4}
              />
            </mesh>
          </group>

          {/* curved 3D chromatic label wrapping the planet's equator — sibling
              of body so it doesn't spin with body's self-rotation */}
          <PlanetLabel
            name={planet.name}
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

/** Central amber sun — real 3D sphere wrapped with an equirectangular
 *  panorama texture. Rotates around its Y axis in the negative
 *  direction so surface features visibly move from right to left
 *  across the visible face — the "globe rotating" feel the user
 *  asked for (vs the previous 2D sprite-spin which read as a flat
 *  coin spinning face-up).
 *  Currently using /sun-pano-1.png. Swap to /sun-pano-2.png to try
 *  the other panorama. */
function AmberSun() {
  const tex = useTexture("/sun-pano-2.png");
  const meshRef = useRef<THREE.Mesh>(null!);
  // Negative Y rotation → in this camera setup features sweep from
  // the right of the visible face toward the left. ~0.1 rad/s gives
  // a full revolution every ~63s.
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y -= delta * 0.1;
  });
  return (
    <Float speed={0.6} rotationIntensity={0.08} floatIntensity={0.12}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <pointLight color="#f0c885" intensity={4} distance={28} decay={1.5} />
    </Float>
  );
}

/** Iridescent nebula wisps — translucent volumetric clouds drifting through */
function NebulaWisp({
  position,
  scale,
  color,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.rotation.x = Math.sin(t * 0.05) * 0.3;
      ref.current.rotation.y += 0.0008;
      ref.current.position.x = position[0] + Math.sin(t * 0.07) * 0.4;
    }
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <sphereGeometry args={[2.5, 24, 24]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.9}
        transmission={0.95}
        thickness={4.0}
        iridescence={1.0}
        iridescenceIOR={1.4}
        iridescenceThicknessRange={[400, 1400]}
        transparent
        opacity={0.18}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

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

/** Main scene composition */
function SceneContent({
  onPlanetClick,
  cursorInsideRef,
}: {
  onPlanetClick: (slug: string) => void;
  cursorInsideRef: React.MutableRefObject<boolean>;
}) {
  return (
    <>
      <Environment preset="night" environmentIntensity={0.4} />

      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} color="#e8d5a8" />
      <directionalLight position={[-6, -2, -4]} intensity={0.3} color="#7ab0e0" />

      <StarField count={1500} />

      {/* iridescent nebula wisps — gas drifting through the universe */}
      <NebulaWisp position={[-9, 2.5, -4]} scale={1.5} color="#8a4dff" />
      <NebulaWisp position={[8, -1.5, -5]} scale={1.7} color="#3dd5b0" />
      <NebulaWisp position={[3, 4.5, -7]} scale={1.3} color="#e070c0" />
      <NebulaWisp position={[-6, -3, 2]} scale={1.1} color="#5a8de0" />

      <AmberSun />

      <PlanetSystem
        onPlanetClick={onPlanetClick}
        cursorInsideRef={cursorInsideRef}
      />
    </>
  );
}

// slugs that have a published detail page in public/works/[slug]/.
// Anything NOT in this set falls through to the "still forming" modal.
const PUBLISHED_WORKS = new Set([
  "nemo",
  "moonlight",
  "model",
  "concept",
  "mask",
]);

export default function Universe() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  // tracked via DOM pointer events on the fullscreen wrapper; read by
  // PlanetSystem in useFrame to gate mouse-driven rotation
  const cursorInsideRef = useRef(true);

  // Click handler: published works → navigate to their static detail page;
  // placeholder works → show the "still forming" modal as before.
  const handlePlanetClick = (slug: string) => {
    if (PUBLISHED_WORKS.has(slug)) {
      window.location.href = `/works/${slug}/`;
    } else {
      setActiveSlug(slug);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-background"
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
          alpha: false,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        onCreated={({ camera }) => {
          camera.lookAt(0, 0, 0);
        }}
      >
        <color attach="background" args={["#0a0807"]} />
        <fog attach="fog" args={["#0a0807", 15, 40]} />
        <SceneContent
          onPlanetClick={handlePlanetClick}
          cursorInsideRef={cursorInsideRef}
        />
      </Canvas>

      {/* brand */}
      <div className="pointer-events-none absolute left-6 top-6 font-mono text-xs uppercase tracking-[0.3em] text-muted sm:left-12 sm:top-8">
        Amber Xu · Universe
      </div>

      {/* hint */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs uppercase tracking-[0.3em] text-muted sm:bottom-8">
        ← move cursor to rotate →
      </div>

      {/* back-to-home */}
      <a
        href="/"
        className="absolute right-6 top-6 font-mono text-xs uppercase tracking-[0.3em] text-muted transition-colors hover:text-amber sm:right-12 sm:top-8"
      >
        ← home
      </a>

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
          {planet.name}
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
