"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Lanyard — hanging ID card with the user's photo.
 *
 * v2 (simplified physics): a single-group sin-swing instead of the
 * React Bits rapier-physics setup, so it doesn't depend on a GLB
 * asset or meshline. The card hangs from an eyelet, swings softly,
 * and tilts a bit with the cursor — close enough to "hanging
 * lanyard" for a static portrait page.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";

import * as THREE from "three";
import "./Lanyard.css";

interface LanyardProps {
  position?: [number, number, number];
  fov?: number;
  transparent?: boolean;
  photoSrc?: string;
}

export default function Lanyard({
  position = [0, 0, 12],
  fov = 30,
  transparent = true,
  photoSrc = "/og-default.jpg",
}: LanyardProps) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{ position, fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent, powerPreference: "high-performance" }}
        onCreated={({ gl }) =>
          gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)
        }
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 5, 5]} intensity={1.4} />
        <directionalLight position={[-5, 3, -2]} intensity={0.6} />
        <Suspense fallback={null}>
          <Lanyard3D photoSrc={photoSrc} />
        </Suspense>
      </Canvas>
    </div>
  );
}

function Lanyard3D({ photoSrc }: { photoSrc: string }) {
  const photo = useTexture(photoSrc);
  photo.colorSpace = THREE.SRGBColorSpace;
  photo.anisotropy = 16;

  const groupRef = useRef<THREE.Group>(null!);
  const { pointer } = useThree();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const swing = Math.sin(t * 0.9) * 0.08;
    const breathe = Math.sin(t * 0.45) * 0.02;
    const mouseTilt = pointer.x * 0.15;
    groupRef.current.rotation.z = swing + mouseTilt;
    groupRef.current.rotation.y = breathe + pointer.x * 0.08;
  });

  const strapWidth = 0.55;
  const strapLength = 2.4;
  const strapColor = "#3d4f8a";

  const cardWidth = 2.2;
  const cardHeight = 3.0;
  const cardThickness = 0.08;

  return (
    <group ref={groupRef} position={[0, 3, 0]}>
      {/* Anchor — small metal eyelet at the top */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.18, 0.04, 16, 32]} />
        <meshStandardMaterial color="#9aa3b2" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Strap */}
      <mesh position={[0, -strapLength / 2 - 0.05, 0]}>
        <planeGeometry args={[strapWidth, strapLength]} />
        <meshStandardMaterial
          color={strapColor}
          side={THREE.DoubleSide}
          roughness={0.85}
          metalness={0}
        />
      </mesh>

      {/* Clip */}
      <mesh
        position={[0, -strapLength - 0.1, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.18, 0.18, 0.5, 16]} />
        <meshStandardMaterial color="#bcc4d2" metalness={0.9} roughness={0.25} />
      </mesh>

      {/* Card body + photo + name plate */}
      <group position={[0, -strapLength - cardHeight / 2 - 0.25, 0]}>
        <mesh>
          <boxGeometry args={[cardWidth, cardHeight, cardThickness]} />
          <meshStandardMaterial color="#0a0a18" roughness={0.6} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0, cardThickness / 2 + 0.001]}>
          <planeGeometry args={[cardWidth * 0.92, cardHeight * 0.85]} />
          <meshStandardMaterial
            map={photo}
            roughness={0.4}
            metalness={0}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, -cardHeight / 2 + 0.25, cardThickness / 2 + 0.001]}>
          <planeGeometry args={[cardWidth * 0.7, 0.32]} />
          <meshStandardMaterial color="#15203f" roughness={0.5} metalness={0.1} />
        </mesh>
      </group>
    </group>
  );
}
