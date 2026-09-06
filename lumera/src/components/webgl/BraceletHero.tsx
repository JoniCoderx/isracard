"use client";

import * as THREE from "three";
import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import StudioEnvironment from "./StudioEnvironment";
import { brilliantGeometry } from "@/components/hero/diamondGeometry";
import type { QualitySettings } from "@/lib/useQualityTier";
import { METAL_INFO, QUALITIES, stoneScaleFor, type SilavuConfig } from "@/lib/pricing";

const N = 22;
const WIDTH = 4.6;
const CURVE = 0.5;

function Stone({
  geo,
  position,
  scale,
  rough,
  metalMat,
  clawGeo,
}: {
  geo: THREE.BufferGeometry;
  position: [number, number, number];
  scale: number;
  rough: number;
  metalMat: THREE.Material;
  clawGeo: THREE.BufferGeometry;
}) {
  const ref = useRef<THREE.MeshPhysicalMaterial>(null!);
  const [hover, setHover] = useState(false);
  useFrame(() => {
    if (ref.current) {
      const target = hover ? 0.9 : 0;
      ref.current.emissiveIntensity += (target - ref.current.emissiveIntensity) * 0.15;
    }
  });
  return (
    <group position={position}>
      {/* metal basket + claws */}
      <mesh geometry={clawGeo} material={metalMat} scale={scale * 1.1} position={[0, -0.05 * scale, 0]} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh
            key={i}
            material={metalMat}
            position={[Math.cos(a) * 0.16 * scale, 0.02 * scale, Math.sin(a) * 0.16 * scale]}
            scale={[0.03 * scale, 0.18 * scale, 0.03 * scale]}
          >
            <cylinderGeometry args={[1, 0.7, 1, 6]} />
          </mesh>
        );
      })}
      {/* the stone */}
      <mesh
        geometry={geo}
        scale={scale * 0.22}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
        }}
        onPointerOut={() => setHover(false)}
      >
        <meshPhysicalMaterial
          ref={ref}
          color="#ffffff"
          metalness={0}
          roughness={rough}
          ior={2.42}
          reflectivity={1}
          clearcoat={1}
          clearcoatRoughness={0}
          envMapIntensity={2.4}
          emissive="#ffffff"
          emissiveIntensity={0}
          flatShading
        />
      </mesh>
    </group>
  );
}

function Bracelet({ config }: { config: SilavuConfig }) {
  const group = useRef<THREE.Group>(null!);
  const geo = useMemo(() => brilliantGeometry(12), []);
  const clawGeo = useMemo(() => new THREE.CylinderGeometry(0.16, 0.12, 0.12, 12), []);
  const linkGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const m = METAL_INFO[config.metal];
  const metalMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ color: m.color, metalness: m.metalness, roughness: m.roughness, envMapIntensity: m.env });
    return mat;
  }, [m.color, m.metalness, m.roughness, m.env]);
  const rough = QUALITIES.find((q) => q.id === config.quality)!.rough;
  const scale = stoneScaleFor(config.totalCt);

  const stones = useMemo(() => {
    const arr: { pos: [number, number, number] }[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const x = (t - 0.5) * WIDTH;
      const y = -Math.pow((t - 0.5) * 2, 2) * CURVE;
      arr.push({ pos: [x, y, 0] });
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.05;
  });

  return (
    <group ref={group} rotation={[0.15, 0, 0]}>
      {/* metal rail links between stones */}
      {stones.slice(0, -1).map((s, i) => {
        const a = s.pos;
        const b = stones[i + 1].pos;
        const mx = (a[0] + b[0]) / 2;
        const my = (a[1] + b[1]) / 2;
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const len = Math.hypot(dx, dy);
        return (
          <mesh
            key={i}
            geometry={linkGeo}
            material={metalMat}
            position={[mx, my, -0.02 * scale]}
            rotation={[0, 0, Math.atan2(dy, dx)]}
            scale={[len, 0.06 * scale, 0.09 * scale]}
          />
        );
      })}
      {stones.map((s, i) => (
        <Stone key={i} geo={geo} clawGeo={clawGeo} position={s.pos} scale={scale} rough={rough} metalMat={metalMat} />
      ))}
    </group>
  );
}

export default function BraceletHero({
  config,
  quality,
  className,
}: {
  config: SilavuConfig;
  quality: QualitySettings;
  className?: string;
}) {
  return (
    <div className={className} data-cursor="Hold to move" data-diamond>
      <Canvas camera={{ position: [0, 0.2, 5.2], fov: 40, near: 0.05, far: 60 }} dpr={quality.dpr} gl={{ antialias: quality.aa, alpha: true }}>
        <ambientLight intensity={0.25} />
        <pointLight position={[-4, 3, 4]} intensity={35} color="#cfe0ff" />
        <pointLight position={[4, -2, 3]} intensity={20} color="#c8a96a" />
        <Bracelet config={config} />
        <StudioEnvironment resolution={Math.min(512, quality.transmissionResolution)} />
        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={1.4}
          maxDistance={9}
          autoRotate={!quality.reduced}
          autoRotateSpeed={0.35}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.6}
        />
        {quality.bloom && (
          <EffectComposer>
            <Bloom mipmapBlur intensity={0.42} luminanceThreshold={0.82} luminanceSmoothing={0.25} radius={0.5} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
