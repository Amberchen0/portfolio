"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Html } from "@react-three/drei";
import { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";

/** Each work-planet's identity */
type Planet = {
  slug: string;
  name: string;
  /** base body tint */
  color: string;
  /** which iridescence color band to bias toward */
  iridescenceColor: string;
};

const PLANETS: Planet[] = [
  { slug: "nemo",      name: "Nemo",            color: "#1a6b8e", iridescenceColor: "#3dd5b0" },
  { slug: "moonlight", name: "Moonlight",       color: "#2a1f3d", iridescenceColor: "#c08af0" },
  { slug: "mask",      name: "Under the Mask",  color: "#8b1d22", iridescenceColor: "#f0c050" },
  { slug: "model",     name: "Model",           color: "#8b4513", iridescenceColor: "#f29a4a" },
  { slug: "concept",   name: "Concept Design",  color: "#1d5b58", iridescenceColor: "#7ad5e8" },
  { slug: "game",      name: "Game",            color: "#666666", iridescenceColor: "#cccccc" },
];

/** Single glass-bead planet — dichroic / iridescent physical material */
function Planet({
  planet,
  angle,
  radius,
  onClick,
}: {
  planet: Planet;
  angle: number;
  radius: number;
  onClick: (slug: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  const position = useMemo<[number, number, number]>(() => {
    return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];
  }, [angle, radius]);

  // gentle self-rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <Float
      position={position}
      speed={1.2}
      rotationIntensity={0.3}
      floatIntensity={0.4}
    >
      <group
        ref={groupRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onClick(planet.slug)}
      >
        <mesh scale={hovered ? 1.12 : 1}>
          <sphereGeometry args={[0.9, 64, 64]} />
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

        {/* name label */}
        <Html
          position={[0, -1.3, 0]}
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

/** Central amber sun — placeholder for now (user's ChatGPT round-amber will replace this) */
function AmberSun() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05;
  });

  return (
    <Float speed={0.6} rotationIntensity={0.1} floatIntensity={0.15}>
      <mesh ref={ref}>
        <sphereGeometry args={[1.6, 96, 96]} />
        <meshPhysicalMaterial
          color="#d9a574"
          emissive="#b8843f"
          emissiveIntensity={0.45}
          roughness={0.35}
          metalness={0.0}
          transmission={0.55}
          thickness={1.5}
          ior={1.6}
          clearcoat={1.0}
          clearcoatRoughness={0.2}
          attenuationColor="#f0c885"
          attenuationDistance={2.0}
        />
      </mesh>
      {/* warm halo light */}
      <pointLight color="#f0c885" intensity={3} distance={20} decay={1.5} />
    </Float>
  );
}

/** Iridescent nebula wisps — translucent volumetric clouds drifting through the scene */
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
        metalness={0.0}
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
function StarField({ count = 1200 }) {
  const points = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 40 + Math.random() * 30;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points, 3]}
        />
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
function PlanetSystem({ onPlanetClick }: { onPlanetClick: (slug: string) => void }) {
  const groupRef = useRef<THREE.Group>(null!);
  const rotationVelocity = useRef(0);
  const currentRotation = useRef(0);
  const mouse = useThree((s) => s.mouse);

  useFrame((_, delta) => {
    // mouse.x is in [-1, +1]; map to a max rotation speed
    const targetVelocity = -mouse.x * 0.35; // negative so left-mouse rotates clockwise (your spec)
    // smooth velocity changes
    rotationVelocity.current +=
      (targetVelocity - rotationVelocity.current) * Math.min(1, delta * 4);
    currentRotation.current += rotationVelocity.current * delta;
    if (groupRef.current) {
      groupRef.current.rotation.y = currentRotation.current;
    }
  });

  const radius = 4.5;

  return (
    <group ref={groupRef}>
      {PLANETS.map((p, i) => {
        const angle = (i / PLANETS.length) * Math.PI * 2;
        return (
          <Planet
            key={p.slug}
            planet={p}
            angle={angle}
            radius={radius}
            onClick={onPlanetClick}
          />
        );
      })}
    </group>
  );
}

/** Main scene composition */
function SceneContent({ onPlanetClick }: { onPlanetClick: (slug: string) => void }) {
  return (
    <>
      {/* environment provides reflections for the physical glass material */}
      <Environment preset="night" environmentIntensity={0.4} />

      {/* lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.6}
        color="#e8d5a8"
      />
      <directionalLight
        position={[-6, -2, -4]}
        intensity={0.3}
        color="#7ab0e0"
      />

      {/* background */}
      <StarField count={1200} />

      {/* iridescent nebula wisps */}
      <NebulaWisp position={[-7, 2, -3]} scale={1.4} color="#8a4dff" />
      <NebulaWisp position={[6, -1.5, -4]} scale={1.6} color="#3dd5b0" />
      <NebulaWisp position={[2, 3.5, -5]} scale={1.2} color="#e070c0" />
      <NebulaWisp position={[-5, -3, 1]} scale={1.0} color="#5a8de0" />

      {/* sun in the center */}
      <AmberSun />

      {/* 6 planet orbital system */}
      <PlanetSystem onPlanetClick={onPlanetClick} />
    </>
  );
}

export default function Universe() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-background">
      <Canvas
        camera={{ position: [0, 1.5, 9], fov: 50 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#0a0807"]} />
        <fog attach="fog" args={["#0a0807", 12, 35]} />
        <SceneContent onPlanetClick={setActiveSlug} />
      </Canvas>

      {/* top-left brand */}
      <div className="pointer-events-none absolute left-6 top-6 font-mono text-xs uppercase tracking-[0.3em] text-muted sm:left-12 sm:top-8">
        Amber Xu · Universe
      </div>

      {/* hint */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs uppercase tracking-[0.3em] text-muted sm:bottom-8">
        ← move cursor to rotate →
      </div>

      {/* tiny back-to-home link */}
      <a
        href="/"
        className="absolute right-6 top-6 font-mono text-xs uppercase tracking-[0.3em] text-muted transition-colors hover:text-amber sm:right-12 sm:top-8"
      >
        ← home
      </a>

      {/* clicked planet modal placeholder */}
      {activeSlug && (
        <PlanetModal slug={activeSlug} onClose={() => setActiveSlug(null)} />
      )}
    </div>
  );
}

function PlanetModal({ slug, onClose }: { slug: string; onClose: () => void }) {
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
          {slug === "game"
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
