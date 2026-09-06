"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { PIECES, CATEGORIES, type Category } from "@/lib/data/pieces";
import { formatAED } from "@/lib/utils";
import StoneVisual from "@/components/visual/StoneVisual";

const EASE = [0.16, 1, 0.3, 1] as const;
type Filter = Category | "All";

export default function ShowcaseGrid() {
  const [filter, setFilter] = useState<Filter>("All");
  const pieces = filter === "All" ? PIECES : PIECES.filter((p) => p.category === filter);

  return (
    <div className="mx-auto max-w-editorial px-6 md:px-12">
      {/* filter rail */}
      <div className="flex flex-wrap gap-x-8 gap-y-3 hairline-b pb-6">
        {(["All", ...CATEGORIES] as Filter[]).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            data-diamond
            className={`overline transition-colors ${
              filter === c ? "text-champagne" : "text-graphite hover:text-ivory-dim"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <motion.div layout className="mt-14 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {pieces.map((p) => (
            <motion.div
              key={p.slug}
              layout
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <Link href={`/showcase/${p.slug}`} className="block group" data-diamond>
                <div className="relative aspect-[4/5] overflow-hidden border hairline bg-gradient-to-b from-white/[0.03] to-transparent">
                  <StoneVisual hue={p.hue} className="absolute inset-0 p-10 transition-transform duration-[1.4s] ease-luxe group-hover:scale-105" />
                  <div className="absolute left-5 top-5 overline text-graphite">{p.category}</div>
                </div>
                <div className="mt-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-serif text-3xl text-ivory">{p.name}</h3>
                    <span className="text-ivory-dim tabular text-sm">{formatAED(p.lab.price)}</span>
                  </div>
                  <p className="mt-2 text-ash text-sm leading-relaxed max-w-xs">{p.line}</p>
                  <div className="mt-4 overline text-graphite">{p.metal} · from {p.lab.carat}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
