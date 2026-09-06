"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { BRAND, NAV } from "@/lib/brand";
import StoneVisual from "@/components/visual/StoneVisual";

const EASE = [0.16, 1, 0.3, 1] as const;
const HUES: [string, string][] = [
  ["#ffffff", "#bcd2ff"],
  ["#ffffff", "#d8c6ff"],
  ["#ffffff", "#cfe0ff"],
  ["#fff7ea", "#e8c98f"],
  ["#eae6ff", "#9fb6e6"],
  ["#ffffff", "#c9dcff"],
];

export default function Menu({
  open,
  onClose,
  onEnquiry,
}: {
  open: boolean;
  onClose: () => void;
  onEnquiry: () => void;
}) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[92] bg-obsidian flex flex-col"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.85, ease: EASE }}
        >
          {/* macro stone emerging behind */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-end pr-[6vw]">
            <AnimatePresence>
              {active !== null && (
                <motion.div
                  key={active}
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 0.5, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 1, ease: EASE }}
                  className="h-[60vmin] w-[60vmin]"
                >
                  <StoneVisual hue={HUES[active % HUES.length]} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative flex items-center justify-between px-6 md:px-12 py-6 md:py-7">
            <Link href="/" onClick={onClose} className="font-serif text-2xl tracking-[0.32em] pl-[0.32em]" data-diamond>
              {BRAND.name}
            </Link>
            <button onClick={onClose} className="overline text-ivory hover:text-champagne transition-colors" data-diamond data-cursor="Close">
              Close
            </button>
          </div>

          <nav className="relative flex-1 flex flex-col justify-center px-6 md:px-12">
            {NAV.map((n, i) => (
              <motion.div
                key={n.href}
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06, duration: 0.8, ease: EASE }}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                <Link
                  href={n.href}
                  onClick={onClose}
                  data-diamond
                  data-cursor="View"
                  className="group flex items-baseline gap-6 py-2 md:py-3"
                >
                  <span className="overline text-graphite w-10 tabular">0{i + 1}</span>
                  <span
                    className={`font-serif text-[clamp(2.4rem,7vw,6rem)] leading-[0.98] transition-colors duration-500 ${
                      active === i ? "text-ivory" : "text-ivory/45 hover:text-ivory"
                    }`}
                  >
                    {n.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </nav>

          <div className="relative flex flex-wrap items-center justify-between gap-4 px-6 md:px-12 py-8 hairline-t">
            <div className="flex gap-8">
              <button onClick={() => { onClose(); onEnquiry(); }} className="overline text-ivory-dim hover:text-champagne transition-colors" data-diamond>
                Enquiry
              </button>
              <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="overline text-ivory-dim hover:text-champagne transition-colors" data-diamond>
                Instagram
              </a>
            </div>
            <div className="overline text-graphite">{BRAND.address}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
