"use client";

/**
 * Silk — React Bits canonical component, ported to TSX.
 *
 * Fullscreen Three.js plane with a custom fragment shader that paints
 * a slowly-undulating silk-fabric pattern. Driven by uTime so the
 * weave drifts continuously; tunable via speed / scale / colour /
 * noiseIntensity / rotation props.
 *
 * Lives in its own R3F <Canvas> — does not share the Universe page's
 * canvas. The plane scales to fit the camera viewport in a
 * useLayoutEffect so the pattern always covers full-bleed regardless
 * of container size.
 *
 * Behaviour preserved verbatim from the React Bits JS reference; only
 * change is TypeScript types and the `eslint-disable react/no-unknown-
 * property` line (R3F uses lowercase Three.js property names like
 * `args` / `attach` that React's lint rule flags).
 */

/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  forwardRef,
  useRef,
  useMemo,
  useEffect,
  useLayoutEffect,
  type ForwardedRef,
  type RefObject,
  type MutableRefObject,
} from "react";
import { Color, Mesh } from "three";
import type { IUniform } from "three";

const hexToNormalizedRGB = (hex: string): [number, number, number] => {
  hex = hex.replace("#", "");
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255,
  ];
};

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
}
`;

interface SilkUniforms {
  uSpeed: IUniform<number>;
  uScale: IUniform<number>;
  uNoiseIntensity: IUniform<number>;
  uColor: IUniform<Color>;
  uRotation: IUniform<number>;
  uTime: IUniform<number>;
  [uniform: string]: IUniform<unknown>;
}

interface SilkPlaneProps {
  uniforms: SilkUniforms;
}

const SilkPlane = forwardRef<Mesh, SilkPlaneProps>(function SilkPlane(
  { uniforms },
  ref: ForwardedRef<Mesh>
) {
  const { viewport } = useThree();

  useLayoutEffect(() => {
    const meshRef = ref as RefObject<Mesh> | MutableRefObject<Mesh | null>;
    if (meshRef && "current" in meshRef && meshRef.current) {
      meshRef.current.scale.set(viewport.width, viewport.height, 1);
    }
  }, [ref, viewport]);

  useFrame((_, delta) => {
    const meshRef = ref as RefObject<Mesh> | MutableRefObject<Mesh | null>;
    if (meshRef && "current" in meshRef && meshRef.current) {
      // shaderMaterial assigned via JSX — TS doesn't know the material
      // type, so we cast through unknown to access the uniforms map.
      const mat = meshRef.current.material as unknown as {
        uniforms: { uTime: IUniform<number> };
      };
      mat.uniforms.uTime.value += 0.1 * delta;
    }
  });

  return (
    <mesh ref={ref}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
});
SilkPlane.displayName = "SilkPlane";

export interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
}

const Silk = ({
  speed = 5,
  scale = 1,
  color = "#7B7481",
  noiseIntensity = 1.5,
  rotation = 0,
}: SilkProps) => {
  const meshRef = useRef<Mesh | null>(null);

  // R3F's Canvas auto-resizes via ResizeObserver, but when it lives
  // inside a `position:fixed` parent that hydrates after SSR, the
  // observer's first measurement can fire BEFORE the parent has its
  // viewport-derived size — Canvas then keeps the <canvas> element
  // stuck at the HTML default 300×150. Dispatching a window resize
  // event after mount forces R3F's internal resize handler to re-
  // measure once the layout is settled. Cheap, safe, one-shot.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  const uniforms: SilkUniforms = useMemo(
    () => ({
      uSpeed: { value: speed },
      uScale: { value: scale },
      uNoiseIntensity: { value: noiseIntensity },
      uColor: { value: new Color(...hexToNormalizedRGB(color)) },
      uRotation: { value: rotation },
      uTime: { value: 0 },
    }),
    [speed, scale, noiseIntensity, color, rotation]
  );

  return (
    // Wrap in an explicitly-sized div (100vw × 100vh inline) so R3F's
    // ResizeObserver has a measurable parent on first paint. Without
    // this wrapper, when Silk lives inside a `position:fixed` parent
    // that hydrates from SSR, R3F's observer reads 0×0 on first tick
    // and the underlying <canvas> stays stuck at the HTML default
    // 300×150. The wrapper also makes Silk usable in any parent
    // regardless of its layout (the wrapper itself is full viewport).
    // resize={{ debounce: 0 }} tells R3F to react instantly to any
    // size change instead of waiting the default 50ms debounce.
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
      }}
    >
      <Canvas
        dpr={[1, 2]}
        frameloop="always"
        resize={{ debounce: 0 }}
        style={{ display: "block" }}
      >
        <SilkPlane ref={meshRef} uniforms={uniforms} />
      </Canvas>
    </div>
  );
};

export default Silk;
