"use client";

import { useQualityTier } from "@/lib/useQualityTier";
import BraceletHero from "@/components/webgl/BraceletHero";
import StoneVisual from "@/components/visual/StoneVisual";
import { DEFAULT_CONFIG } from "@/lib/pricing";
import { Reveal } from "@/components/motion/Reveal";

export default function TheLineHero() {
  const q = useQualityTier();
  const use3D = q.webgl && !q.reduced;
  const config = { ...DEFAULT_CONFIG, totalCt: 12, quality: "VVS" as const };

  return (
    <section className="relative h-[92svh] w-full overflow-hidden bg-obsidian">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(55% 55% at 50% 55%, rgba(120,140,190,0.12), transparent 70%)" }}
      />
      {use3D ? (
        <BraceletHero config={config} quality={q} className="absolute inset-0" />
      ) : (
        <StoneVisual hue={["#ffffff", "#cfe0ff"]} className="absolute inset-0 p-24" />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-[22%] flex flex-col items-center text-center px-6">
        <Reveal>
          <div className="eyebrow text-champagne">The SILAVU Line</div>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mt-6 font-serif text-display-md text-ivory leading-none">Rare is only the beginning.</h1>
        </Reveal>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-12 flex items-center justify-center gap-6 overline text-platinum">
        <span>12.84 CT</span>
        <span className="h-px w-6 bg-white/25" />
        <span>D–F</span>
        <span className="h-px w-6 bg-white/25" />
        <span>VVS</span>
      </div>
    </section>
  );
}
