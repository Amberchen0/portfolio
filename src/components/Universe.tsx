"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Html } from "@react-three/drei";
import { useRef, useMemo, useState } from "react";
import * as THREE from "three";

/** Each work-planet's identity.
 *  size        = sphere radius (varied for visual hierarchy by importance)
 *  orbitRadius = distance from sun in scene units
 *  angle       = initial position on orbital ring (radians)
 *  orbitTilt   = each orbit slightly tilted on its own axes (like real planets)
 *                  → [tiltX, tiltZ] in radians (~0.05 = 3°) */
type Planet = {
  slug: string;
  name: string;
  color: string;
  iridescenceColor: string;
  size: number;
  orbitRadius: number;
  angle: number;
  orbitTilt: [number, number];
};

const PLANETS: Planet[] = [
  // ── 6 real works ──
  { slug: "model",     name: "Model",           color: "#8b4513", iridescenceColor: "#f29a4a",
    size: 1.15, orbitRadius: 4.6, angle: Math.PI / 2,                          orbitTilt: [0.05, -0.02] },
  { slug: "nemo",      name: "Nemo",            color: "#1a6b8e", iridescenceColor: "#3dd5b0",
    size: 1.00, orbitRadius: 3.6, angle: Math.PI / 2 + (2 * Math.PI) / 9,     orbitTilt: [-0.08, 0.03] },
  { slug: "concept",   name: "Concept Design",  color: "#1d5b58", iridescenceColor: "#7ad5e8",
    size: 1.00, orbitRadius: 6.0, angle: Math.PI / 2 + (4 * Math.PI) / 9,     orbitTilt: [0.04, 0.06] },
  { slug: "moonlight", name: "Moonlight",       color: "#2a1f3d", iridescenceColor: "#c08af0",
    size: 0.85, orbitRadius: 7.2, angle: Math.PI / 2 + (6 * Math.PI) / 9,     orbitTilt: [-0.06, -0.04] },
  { slug: "mask",      name: "Under the Mask",  color: "#8b1d22", iridescenceColor: "#f0c050",
    size: 0.85, orbitRadius: 5.3, angle: Math.PI / 2 + (8 * Math.PI) / 9,     orbitTilt: [0.09, 0.01] },
  { slug: "game",      name: "Game",            color: "#666666", iridescenceColor: "#cccccc",
    size: 0.55, orbitRadius: 8.1, angle: Math.PI / 2 + (10 * Math.PI) / 9,    orbitTilt: [-0.03, 0.07] },

  // HYSTON — real (documentary interview, warm cinematic palette)
  { slug: "hyston",       name: "HYSTON",       color: "#7a4520", iridescenceColor: "#e8b070",
    size: 0.85, orbitRadius: 4.0, angle: Math.PI / 2 + (12 * Math.PI) / 9,    orbitTilt: [0.06, -0.05] },
  // Photography — placeholder (cool documentary blue-grey)
  { slug: "photography",  name: "Photography",  color: "#3a4a58", iridescenceColor: "#a8c0d8",
    size: 0.60, orbitRadius: 6.7, angle: Math.PI / 2 + (14 * Math.PI) / 9,    orbitTilt: [-0.05, 0.08] },
  // Drawing — placeholder (ink-toned)
  { slug: "drawing",      name: "Drawing",      color: "#2a2a32", iridescenceColor: "#b0a8b8",
    size: 0.55, orbitRadius: 7.6, angle: Math.PI / 2 + (16 * Math.PI) / 9,    orbitTilt: [0.07, 0.02] },
];

/** Faint orbital ring drawn on the XZ plane at the planet's distance from sun.
 *  Used to visualize the orbit, like in the reference solar-system diagram. */
function OrbitRing({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
      <ringGeometry args={[radius - 0.018, radius + 0.018, 196]} />
      <meshBasicMaterial
        color="#d9a574"
        transparent
        opacity={0.16}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/** Single glass-bead planet — dichroic / iridescent physical material */
function Planet({
  planet,
  onClick,
}: {
  planet: Planet;
  onClick: (slug: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  const position = useMemo<[number, number, number]>(
    () => [
      Math.cos(planet.angle) * planet.orbitRadius,
      0,
      Math.sin(planet.angle) * planet.orbitRadius,
    ],
    [planet.angle, planet.orbitRadius]
  );

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.15;
  });

  return (
    <Float
      position={position}
      speed={1.0}
      rotationIntensity={0.25}
      floatIntensity={0.3}
    >
      <group
        ref={groupRef}
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

        <Html
          position={[0, -(planet.size + 0.35), 0]}
          center
          style={{
            pointerEvents: "none",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: hovered ? "11px" : "10px",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: hovered ? "#f0e0c5" : "#8a7e6a",
            transition: "all 0.4s ease",
            whiteSpace: "nowrap",
            textShadow: "0 2px 12px rgba(0,0,0,0.8)",
          }}
        >
          {planet.name}
        </Html>
      </group>
    </Float>
  );
}

/** Central amber sun — placeholder; ChatGPT round-amber will swap in later */
function AmberSun() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05;
  });

  return (
    <Float speed={0.6} rotationIntensity={0.08} floatIntensity={0.12}>
      <mesh ref={ref}>
        <sphereGeometry args={[1.8, 96, 96]} />
        <meshPhysicalMaterial
          color="#d9a574"
          emissive="#b8843f"
          emissiveIntensity={0.5}
          roughness={0.35}
          transmission={0.5}
          thickness={1.5}
          ior={1.6}
          clearcoat={1.0}
          clearcoatRoughness={0.2}
          attenuationColor="#f0c885"
          attenuationDistance={2.0}
        />
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

/** Mouse-velocity driven rotation of the entire planet system */
function PlanetSystem({
  onPlanetClick,
}: {
  onPlanetClick: (slug: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const rotationVelocity = useRef(0);
  const currentRotation = useRef(0);
  const mouse = useThree((s) => s.mouse);

  useFrame((_, delta) => {
    // mouse.x is in [-1, +1]; negative so left-cursor rotates clockwise per spec
    const targetVelocity = -mouse.x * 0.35;
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
}: {
  onPlanetClick: (slug: string) => void;
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

      <PlanetSystem onPlanetClick={onPlanetClick} />
    </>
  );
}

export default function Universe() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-background">
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
        <SceneContent onPlanetClick={setActiveSlug} />
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
          {["game", "photography", "drawing"].includes(slug)
            ? "This world is still forming. Come back when the dust settles."
            : "World detail page — coming soon."}
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
