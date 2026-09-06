"use client";

import * as THREE from "three";
import { useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import RefractiveDiamond from "@/components/webgl/RefractiveDiamond";
import StudioEnvironment from "@/components/webgl/StudioEnvironment";
import type { QualitySettings } from "@/lib/useQualityTier";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = THREE.MathUtils.lerp;

// Camera keyframes across scroll progress — approach, orbit, dive into a facet.
type Key = { p: number; radius: number; azimuth: number; polar: number; ty: number };
const KEYS: Key[] = [
  { p: 0.0, radius: 7.2, azimuth: 0.0, polar: 1.35, ty: 0 },
  { p: 0.18, radius: 4.8, azimuth: 0.4, polar: 1.4, ty: 0 },
  { p: 0.4, radius: 3.2, azimuth: 1.5, polar: 1.55, ty: 0.05 },
  { p: 0.62, radius: 1.7, azimuth: 2.5, polar: 1.5, ty: 0.1 },
  { p: 0.82, radius: 0.75, azimuth: 3.3, polar: 1.48, ty: 0.12 },
  { p: 1.0, radius: 0.42, azimuth: 3.9, polar: 1.46, ty: 0.12 },
];

function sample(p: number): Key {
  if (p <= KEYS[0].p) return KEYS[0];
  if (p >= KEYS[KEYS.length - 1].p) return KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i];
    const b = KEYS[i + 1];
    if (p >= a.p && p <= b.p) {
      const t = (p - a.p) / (b.p - a.p);
      const e = t * t * (3 - 2 * t); // smoothstep
      return {
        p,
        radius: lerp(a.radius, b.radius, e),
        azimuth: lerp(a.azimuth, b.azimuth, e),
        polar: lerp(a.polar, b.polar, e),
        ty: lerp(a.ty, b.ty, e),
      };
    }
  }
  return KEYS[0];
}

function CameraRig({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const { camera, pointer } = useThree();
  const cur = useRef({ az: 0, po: 1.35, r: 7.2, ty: 0 });
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const p = clamp01(progressRef.current);
    const k = sample(p);
    // pointer adds a tiny, weighty parallax — stronger when far, minimal when close
    const par = (1 - p) * 0.25;
    const az = k.azimuth + pointer.x * par;
    const po = k.polar - pointer.y * par * 0.6;

    const s = 0.08;
    cur.current.az = lerp(cur.current.az, az, s);
    cur.current.po = lerp(cur.current.po, po, s);
    cur.current.r = lerp(cur.current.r, k.radius, s);
    cur.current.ty = lerp(cur.current.ty, k.ty, s);

    const { az: A, po: P, r } = cur.current;
    camera.position.set(
      r * Math.sin(P) * Math.sin(A),
      r * Math.cos(P) + cur.current.ty,
      r * Math.sin(P) * Math.cos(A)
    );
    target.set(0, cur.current.ty * 0.5, 0);
    camera.lookAt(target);
  });
  return null;
}

function Dust({ count = 140 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * 10;
      a[i * 3 + 1] = (Math.random() - 0.5) * 7;
      a[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return a;
  }, [count]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.015;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 1; i < arr.length; i += 3) {
      arr[i] += dt * 0.05;
      if (arr[i] > 3.5) arr[i] = -3.5;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial size={0.018} color="#d8d0be" transparent opacity={0.45} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function HeroExperience({
  quality,
  progressRef,
}: {
  quality: QualitySettings;
  progressRef: MutableRefObject<number>;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7.2], fov: 38, near: 0.01, far: 100 }}
      dpr={quality.dpr}
      gl={{ antialias: quality.aa, alpha: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#050506"]} />
      <ambientLight intensity={0.2} />
      <pointLight position={[-5, 3, 4]} intensity={40} color="#cfe0ff" />
      <pointLight position={[4, -3, 3]} intensity={22} color="#c8a96a" />

      <RefractiveDiamond
        quality={{
          samples: quality.transmissionSamples,
          resolution: quality.transmissionResolution,
          roughness: quality.tier === "ultra" ? 0.0 : 0.02,
          transmission: quality.tier === "ultra",
        }}
        facets={quality.tier === "ultra" ? 24 : 18}
      />
      <Dust count={quality.mobile ? 48 : 90} />
      <StudioEnvironment resolution={quality.transmissionResolution} />
      <CameraRig progressRef={progressRef} />

      {quality.bloom && (
        <EffectComposer>
          {/* restrained — only true facet highlights bloom, never the whole frame */}
          <Bloom mipmapBlur intensity={quality.tier === "ultra" ? 0.5 : 0.34} luminanceThreshold={0.82} luminanceSmoothing={0.25} radius={0.5} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
