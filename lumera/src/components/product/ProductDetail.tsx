"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Piece } from "@/lib/data/pieces";
import { formatAED } from "@/lib/utils";
import { BRAND, whatsappLink } from "@/lib/brand";
import { useEnquiry } from "@/components/enquiry/EnquiryProvider";
import StoneVisual from "@/components/visual/StoneVisual";
import { Reveal } from "@/components/motion/Reveal";

type Origin = "lab" | "natural";
const EASE = [0.16, 1, 0.3, 1] as const;

export default function ProductDetail({ piece }: { piece: Piece }) {
  const [origin, setOrigin] = useState<Origin>("lab");
  const [angle, setAngle] = useState(0);
  const [zoom, setZoom] = useState(false);
  const { add } = useEnquiry();
  const spec = piece[origin];

  const enquiryDetail = useMemo(
    () => `${piece.metal} · ${spec.carat} · ${spec.clarity} · ${origin === "lab" ? "Lab-grown" : "Natural"}`,
    [piece, spec, origin]
  );

  return (
    <div className="mx-auto max-w-editorial px-6 md:px-12 pt-32 md:pt-40 pb-32">
      <div className="grid gap-12 lg:grid-cols-12">
        {/* VISUAL */}
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-28">
            <div className="relative aspect-square w-full overflow-hidden border hairline bg-gradient-to-b from-white/[0.04] to-transparent">
              <div
                className="absolute inset-0 p-12 transition-transform duration-500 ease-luxe will-change-transform"
                style={{ transform: `perspective(1200px) rotateY(${angle}deg) scale(${zoom ? 1.5 : 1})` }}
              >
                <StoneVisual hue={piece.hue} />
              </div>
              <div className="absolute left-6 top-6 overline text-graphite">{piece.category}</div>
              <button
                onClick={() => setZoom((z) => !z)}
                className="absolute right-6 top-6 overline text-ivory-dim hover:text-champagne transition-colors"
                data-diamond
              >
                {zoom ? "Reset" : "Zoom setting"}
              </button>
            </div>

            {/* 360 control */}
            <div className="mt-6 flex items-center gap-5">
              <span className="overline text-graphite whitespace-nowrap">360°</span>
              <input
                type="range"
                min={-180}
                max={180}
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-full accent-champagne"
                aria-label="Rotate piece"
                data-diamond
              />
            </div>
          </div>
        </div>

        {/* DETAIL */}
        <div className="lg:col-span-5">
          <Reveal>
            <div className="eyebrow">{piece.category}</div>
            <h1 className="mt-5 font-serif text-display-sm text-ivory leading-[0.98]">{piece.name}</h1>
            <p className="mt-6 text-ash text-lg leading-relaxed">{piece.story}</p>
          </Reveal>

          {/* origin toggle */}
          <div className="mt-10">
            <div className="overline text-graphite mb-3">Diamond</div>
            <div className="flex border hairline">
              {(["natural", "lab"] as Origin[]).map((o) => (
                <button
                  key={o}
                  onClick={() => setOrigin(o)}
                  data-diamond
                  className={`relative flex-1 px-5 py-4 text-left transition-colors ${
                    origin === o ? "text-ivory" : "text-graphite hover:text-ivory-dim"
                  }`}
                >
                  {origin === o && (
                    <motion.span
                      layoutId="origin-active"
                      className="absolute inset-0 bg-white/[0.05] border-b border-champagne"
                      transition={{ duration: 0.5, ease: EASE }}
                    />
                  )}
                  <span className="relative overline">{o === "lab" ? "Lab-Grown" : "Natural"}</span>
                </button>
              ))}
            </div>
          </div>

          {/* spec table with animated values */}
          <dl className="mt-10">
            <SpecRow k="Metal" v={piece.metal} />
            <SpecRow k="Total carat" v={spec.carat} animate origin={origin} />
            <SpecRow k="Clarity" v={spec.clarity} animate origin={origin} />
            <SpecRow k="Colour" v={spec.color} animate origin={origin} />
            <SpecRow k="Certification" v={spec.certification} animate origin={origin} />
            <SpecRow k="Sizing" v={piece.sizing} />
            <SpecRow k="Availability" v={piece.availability} />
          </dl>

          {/* price */}
          <div className="mt-10 flex items-end justify-between hairline-t pt-6">
            <div>
              <div className="overline text-graphite">Guide price · {origin === "lab" ? "Lab-grown" : "Natural"}</div>
              <div className="h-[3.2rem] overflow-hidden mt-2">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={origin + spec.price}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    exit={{ y: "-100%", opacity: 0 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className="font-serif text-4xl md:text-5xl text-ivory tabular"
                  >
                    {formatAED(spec.price)}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="mt-10 space-y-4">
            <button
              onClick={() =>
                add({ id: `${piece.slug}-${origin}`, title: piece.name, detail: enquiryDetail, meta: formatAED(spec.price) })
              }
              className="cta cta-ghost w-full justify-center"
              data-diamond
            >
              Request Private Price
            </button>
            <div className="grid grid-cols-2 gap-4">
              <a href="/private-viewing" className="cta cta-ghost justify-center text-center" data-diamond>
                Book a Viewing
              </a>
              <a
                href={whatsappLink(`Hello ${BRAND.name} — I'm interested in ${piece.name} (${enquiryDetail}).`)}
                target="_blank"
                rel="noopener noreferrer"
                className="cta cta-ghost justify-center text-center"
                data-diamond
              >
                WhatsApp Concierge
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecRow({ k, v, animate, origin }: { k: string; v: string; animate?: boolean; origin?: string }) {
  return (
    <div className="flex items-center justify-between hairline-t py-4">
      <dt className="overline text-graphite">{k}</dt>
      <dd className="text-ivory-dim tracking-wide text-right overflow-hidden">
        {animate ? (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={origin + v}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="block"
            >
              {v}
            </motion.span>
          </AnimatePresence>
        ) : (
          v
        )}
      </dd>
    </div>
  );
}
