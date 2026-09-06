"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * Procedural studio IBL built from Lightformers — no external HDRI, works offline.
 * The environment is deliberately BRIGHT (so the stone reflects light and reads as
 * luminous) while the visible scene background stays black — set by the canvas, not here.
 */
export default function StudioEnvironment({ resolution = 512 }: { resolution?: number }) {
  return (
    <Environment resolution={resolution} frames={1}>
      {/* large soft key + fills — fill the stone with white */}
      <Lightformer form="rect" intensity={3.2} position={[0, 1, 8]} scale={[16, 16, 1]} color="#ffffff" />
      <Lightformer form="rect" intensity={2.2} position={[0, -2, -8]} scale={[16, 16, 1]} color="#eaf0ff" />
      <Lightformer form="rect" intensity={2.0} position={[-8, 0, 0]} scale={[10, 16, 1]} color="#ffffff" rotation={[0, Math.PI / 2, 0]} />
      <Lightformer form="rect" intensity={2.0} position={[8, 0, 0]} scale={[10, 16, 1]} color="#fbf3e2" rotation={[0, -Math.PI / 2, 0]} />
      {/* razor strips → sharp facet flashes (the SILAVU line seed) */}
      <Lightformer form="rect" intensity={9} position={[-5, 3, 4]} scale={[0.3, 10, 1]} color="#ffffff" />
      <Lightformer form="rect" intensity={9} position={[5, -3, 4]} scale={[0.3, 10, 1]} color="#ffffff" />
      {/* spectral hints for dispersion */}
      <Lightformer form="circle" intensity={2.6} position={[-4, -4, 5]} scale={2.6} color="#8fb4ff" />
      <Lightformer form="circle" intensity={2.0} position={[4, 4, 4]} scale={2.6} color="#d9c193" />
    </Environment>
  );
}
