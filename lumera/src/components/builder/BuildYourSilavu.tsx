"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ORIGINS,
  METALS,
  QUALITIES,
  SIZES,
  sizeLabel,
  DEFAULT_CONFIG,
  estimatePrice,
  type SilavuConfig,
  type Metal,
  type Origin,
  type Quality,
} from "@/lib/pricing";
import { formatAED } from "@/lib/utils";
import { BRAND, whatsappLink } from "@/lib/brand";
import { useEnquiry } from "@/components/enquiry/EnquiryProvider";
import { useSound } from "@/components/system/SoundProvider";
import { useQualityTier } from "@/lib/useQualityTier";
import BraceletHero from "@/components/webgl/BraceletHero";
import StoneVisual from "@/components/visual/StoneVisual";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function BuildYourSilavu() {
  const [cfg, setCfg] = useState<SilavuConfig>(DEFAULT_CONFIG);
  const { add } = useEnquiry();
  const { chime } = useSound();
  const q = useQualityTier();
  const est = estimatePrice(cfg);
  const metal = METALS.find((m) => m.id === cfg.metal)!;

  function set<K extends keyof SilavuConfig>(k: K, v: SilavuConfig[K]) {
    setCfg((c) => ({ ...c, [k]: v }));
    chime();
  }

  function request() {
    const detail = `${cfg.origin === "lab" ? "Lab-grown" : "Natural"} · ${cfg.totalCt} CT total · ${cfg.quality} · ${metal.label}`;
    add({ id: `silavu-${Date.now()}`, title: "The SILAVU Line — configured", detail, meta: formatAED(est.total) });
  }

  const use3D = q.webgl && !q.reduced;

  return (
    <div className="mx-auto max-w-editorial px-6 md:px-12 grid gap-14 lg:grid-cols-12 pb-40">
      {/* LIVE OBJECT */}
      <div className="lg:col-span-6">
        <div className="lg:sticky lg:top-24">
          <div className="relative aspect-[4/3] w-full overflow-hidden border hairline bg-gradient-to-b from-white/[0.04] to-transparent">
            {use3D ? (
              <BraceletHero config={cfg} quality={q} className="absolute inset-0" />
            ) : (
              <StoneVisual hue={["#ffffff", "#cfe0ff"]} className="absolute inset-0 p-16" />
            )}
            <div className="pointer-events-none absolute left-5 top-5 overline text-graphite">
              {use3D ? "Drag to rotate · scroll to zoom" : "The SILAVU Line"}
            </div>
          </div>

          <div className="mt-8 hairline-t pt-6 flex items-end justify-between">
            <div>
              <div className="overline text-graphite">Estimated value</div>
              <div className="h-[3rem] overflow-hidden mt-1">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={Math.round(est.total)}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    exit={{ y: "-100%", opacity: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="font-serif text-4xl md:text-5xl text-ivory tabular"
                  >
                    {formatAED(est.total)}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="overline text-graphite mt-1">Indicative · confirmed privately</div>
            </div>
          </div>
        </div>
      </div>

      {/* STEPS */}
      <div className="lg:col-span-5 lg:col-start-8 space-y-12">
        <Step n="01" label="Stone">
          {ORIGINS.map((o) => (
            <Tactile key={o.id} active={cfg.origin === o.id} onClick={() => set("origin", o.id as Origin)} sub={o.note}>
              {o.label}
            </Tactile>
          ))}
        </Step>

        <Step n="02" label="Size · total carat">
          {SIZES.map((s) => (
            <Tactile key={s} active={cfg.totalCt === s} onClick={() => set("totalCt", s)}>
              {sizeLabel(s)}
            </Tactile>
          ))}
        </Step>

        <Step n="03" label="Quality">
          {QUALITIES.map((qy) => (
            <Tactile key={qy.id} active={cfg.quality === qy.id} onClick={() => set("quality", qy.id as Quality)} sub={`${qy.clarity} · ${qy.color}`}>
              {qy.label}
            </Tactile>
          ))}
        </Step>

        <Step n="04" label="Metal">
          {METALS.map((mm) => (
            <Tactile key={mm.id} active={cfg.metal === mm.id} onClick={() => set("metal", mm.id as Metal)}>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: mm.color, boxShadow: `0 0 6px ${mm.color}` }} />
                {mm.label}
              </span>
            </Tactile>
          ))}
        </Step>

        <div className="hairline-t pt-8">
          <div className="overline text-champagne mb-2">Your SILAVU</div>
          <p className="font-serif text-3xl text-ivory leading-snug">
            {cfg.totalCt} CT · {cfg.quality} · {metal.label}
            <span className="block text-ash text-base font-sans tracking-wide mt-2">
              {cfg.origin === "lab" ? "Lab-grown" : "Natural"} diamonds, set in Dubai.
            </span>
          </p>
          <div className="mt-8 space-y-4">
            <button onClick={request} className="cta cta-ghost w-full justify-center" data-diamond data-cursor="Reserve">
              Request This Piece
            </button>
            <a
              href={whatsappLink(
                `Hello ${BRAND.name} — I've configured The SILAVU Line: ${cfg.origin === "lab" ? "Lab-grown" : "Natural"}, ${cfg.totalCt} CT total, ${cfg.quality}, ${metal.label}. Estimated ${formatAED(est.total)}.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="cta w-full justify-center"
              data-diamond
            >
              Send to Concierge
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ n, label, children }: { n: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-5">
        <span className="text-champagne text-xs tabular">Step {n}</span>
        <span className="h-px flex-1 bg-white/10" />
        <span className="overline text-ivory-dim">{label}</span>
      </div>
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  );
}

function Tactile({
  active,
  onClick,
  children,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <button
      onClick={onClick}
      data-diamond
      className={`group relative border px-5 py-3 text-left transition-all duration-500 ${
        active ? "border-champagne/60 bg-white/[0.05]" : "hairline hover:border-white/25"
      }`}
    >
      <span className={`overline ${active ? "text-ivory" : "text-graphite group-hover:text-ivory-dim"}`}>{children}</span>
      {sub && <span className="block text-[0.6rem] tracking-wide text-graphite mt-1 normal-case">{sub}</span>}
    </button>
  );
}
