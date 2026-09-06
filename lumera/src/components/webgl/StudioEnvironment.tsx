"use client";

import { Environment, Lightformer } from "@react-three/drei";

/** Procedural studio IBL built from Lightformers — no external HDRI, works offline. */
export default function StudioEnvironment({ resolution = 512 }: { resolution?: number }) {
  return (
    <Environment resolution={resolution} frames={1}>
      {/* deep base */}
      <color attach="background" args={["#050506"]} />
      {/* soft key */}
      <Lightformer form="rect" intensity={1.6} position={[0, 0.5, 6]} scale={[12, 12, 1]} color="#ffffff" />
      {/* razor strips → sharp facet flashes (the SILAVU line seed) */}
      <Lightformer form="rect" intensity={7} position={[-5, 2, 3]} scale={[0.25, 9, 1]} color="#ffffff" />
      <Lightformer form="rect" intensity={7} position={[5, -2, 3]} scale={[0.25, 9, 1]} color="#ffffff" />
      <Lightformer form="rect" intensity={3.5} position={[0, 6, 2]} scale={[10, 0.3, 1]} color="#f6eed8" />
      {/* spectral hints for dispersion */}
      <Lightformer form="circle" intensity={2.4} position={[-4, -4, 4]} scale={2.4} color="#8fb4ff" />
      <Lightformer form="circle" intensity={1.8} position={[4, 4, 3]} scale={2.4} color="#d9c193" />
      <Lightformer form="circle" intensity={1.4} position={[0, -5, 3]} scale={3} color="#b9a0ff" />
    </Environment>
  );
}
