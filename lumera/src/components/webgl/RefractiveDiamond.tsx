"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import { brilliantGeometry } from "@/components/hero/diamondGeometry";

export type DiamondQuality = {
  samples: number;
  resolution: number;
  roughness: number;
  transmission: boolean; // ULTRA only — otherwise a reflective PBR gem (robust everywhere)
};

/**
 * The house stone. Heavy, almost still. Transmission + dispersion on ULTRA,
 * a physically convincing reflective brilliant elsewhere.
 */
export default function RefractiveDiamond({
  quality,
  spin = 0.05,
  facets = 20,
  showLine = true,
}: {
  quality: DiamondQuality;
  spin?: number;
  facets?: number;
  showLine?: boolean;
}) {
  const group = useRef<THREE.Group>(null!);
  const line = useRef<THREE.Mesh>(null!);
  const geo = useMemo(() => brilliantGeometry(facets), [facets]);

  useFrame(({ clock }, dt) => {
    if (group.current) {
      group.current.rotation.y += dt * spin;
      group.current.rotation.x = -0.16 + Math.sin(clock.elapsedTime * 0.1) * 0.03;
    }
    if (line.current) {
      const t = clock.elapsedTime * 0.22;
      line.current.position.x = Math.sin(t) * 0.28;
      (line.current.material as THREE.MeshBasicMaterial).opacity = 0.14 + Math.abs(Math.sin(t * 2)) * 0.18;
    }
  });

  return (
    <group ref={group} scale={1.35}>
      <mesh geometry={geo}>
        {quality.transmission ? (
          <MeshTransmissionMaterial
            transmissionSampler
            samples={Math.max(4, quality.samples)}
            resolution={quality.resolution}
            transmission={1}
            thickness={3.2}
            roughness={quality.roughness}
            ior={2.42}
            chromaticAberration={0.16}
            anisotropy={0.2}
            distortion={0.1}
            distortionScale={0.3}
            temporalDistortion={0.02}
            attenuationColor={"#eef4ff"}
            attenuationDistance={3.5}
            color={"#ffffff"}
            background={new THREE.Color("#050506")}
            flatShading
          />
        ) : (
          <meshPhysicalMaterial
            color="#ffffff"
            metalness={0}
            roughness={quality.roughness}
            ior={2.42}
            reflectivity={1}
            clearcoat={1}
            clearcoatRoughness={0}
            iridescence={0.6}
            iridescenceIOR={1.3}
            iridescenceThicknessRange={[120, 420]}
            envMapIntensity={2.8}
            specularIntensity={1}
            flatShading
          />
        )}
      </mesh>
      {showLine && (
        <mesh ref={line}>
          <boxGeometry args={[0.012, 1.2, 0.012]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.16} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
