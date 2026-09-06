"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const STAGES = [
  { key: "01", t: "Concept", l: "A sketch, or a feeling." },
  { key: "02", t: "Stone", l: "The stone is sourced to the idea." },
  { key: "03", t: "Design", l: "Drawn precisely. Every angle resolved." },
  { key: "04", t: "Setting", l: "Cast, hand-finished, and set in Dubai." },
  { key: "05", t: "SILAVU", l: "Yours alone. Never made again." },
];

export default function PrivateJourney() {
  const section = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const outline = useRef<SVGPathElement>(null);
  const stoneOutline = useRef<SVGPathElement>(null);
  const cad = useRef<SVGGElement>(null);
  const metal = useRef<SVGGElement>(null);
  const finish = useRef<SVGGElement>(null);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const oLen = outline.current?.getTotalLength() ?? 1000;
    const sLen = stoneOutline.current?.getTotalLength() ?? 400;
    if (outline.current) {
      outline.current.style.strokeDasharray = String(oLen);
      outline.current.style.strokeDashoffset = String(oLen);
    }
    if (stoneOutline.current) {
      stoneOutline.current.style.strokeDasharray = String(sLen);
      stoneOutline.current.style.strokeDashoffset = String(sLen);
    }

    const band = (p: number, a: number, b: number) => Math.max(0, Math.min(1, (p - a) / (b - a)));

    const render = (p: number) => {
      if (outline.current) outline.current.style.strokeDashoffset = String(oLen * (1 - band(p, 0, 0.22)));
      if (stoneOutline.current) stoneOutline.current.style.strokeDashoffset = String(sLen * (1 - band(p, 0.2, 0.4)));
      if (cad.current) cad.current.style.opacity = String(band(p, 0.4, 0.55) * (1 - band(p, 0.82, 1)));
      if (metal.current) metal.current.style.opacity = String(band(p, 0.6, 0.78));
      if (finish.current) finish.current.style.opacity = String(band(p, 0.8, 0.96));
      const seg = 1 / STAGES.length;
      panels.current.forEach((el, i) => {
        if (!el) return;
        const c = (i + 0.5) * seg;
        const vis = Math.max(0, 1 - Math.abs(p - c) / (seg * 0.5));
        el.style.opacity = String(vis);
        el.style.transform = `translateY(${(1 - vis) * 18}px)`;
      });
      if (rail.current) rail.current.style.transform = `scaleX(${p})`;
    };

    if (reduce) {
      render(1);
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: section.current!,
      start: "top top",
      end: "+=420%",
      pin: pin.current!,
      scrub: 0.6,
      onUpdate: (self) => render(self.progress),
    });
    render(0);
    return () => st.kill();
  }, []);

  return (
    <section ref={section} className="relative bg-ivory text-ink">
      <div ref={pin} className="relative flex h-[100svh] w-full flex-col items-center justify-center overflow-hidden">
        <div className="absolute left-6 md:left-12 top-16 text-[0.66rem] tracking-[0.34em] uppercase text-ink/40">
          SILAVU Private
        </div>

        <svg viewBox="0 0 400 400" className="h-[54vmin] w-[54vmin]">
          <defs>
            <linearGradient id="pj-metal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#c9c9ce" />
              <stop offset="0.5" stopColor="#f4f0e8" />
              <stop offset="1" stopColor="#9a9aa1" />
            </linearGradient>
            <radialGradient id="pj-stone" cx="0.4" cy="0.35" r="0.7">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.5" stopColor="#dfe8ff" />
              <stop offset="1" stopColor="#8fb4ff" />
            </radialGradient>
          </defs>

          {/* metal (fills first so outlines sit on top) */}
          <g ref={metal} style={{ opacity: 0 }}>
            <ellipse cx="200" cy="250" rx="112" ry="66" fill="none" stroke="url(#pj-metal)" strokeWidth="16" />
            <path d="M175 150 L225 150 L232 178 L200 200 L168 178 Z" fill="url(#pj-metal)" />
          </g>

          {/* CAD guides */}
          <g ref={cad} style={{ opacity: 0 }} stroke="#b98f3a" strokeWidth="0.6" fill="none">
            <ellipse cx="200" cy="250" rx="128" ry="80" opacity="0.5" />
            <ellipse cx="200" cy="250" rx="96" ry="54" opacity="0.5" />
            <line x1="200" y1="120" x2="200" y2="330" opacity="0.4" />
            <line x1="60" y1="250" x2="340" y2="250" opacity="0.4" />
            <circle cx="200" cy="175" r="42" opacity="0.5" />
          </g>

          {/* finish: stone brilliance + glow */}
          <g ref={finish} style={{ opacity: 0 }}>
            <path d="M175 150 L225 150 L232 178 L200 200 L168 178 Z" fill="url(#pj-stone)" />
            <line x1="175" y1="150" x2="200" y2="200" stroke="#ffffff" strokeWidth="0.8" />
            <line x1="225" y1="150" x2="200" y2="200" stroke="#ffffff" strokeWidth="0.8" />
            <line x1="200" y1="150" x2="200" y2="200" stroke="#ffffff" strokeWidth="0.6" opacity="0.7" />
            <circle cx="200" cy="175" r="55" fill="#8fb4ff" opacity="0.12" />
          </g>

          {/* sketch outlines (drawn on top) */}
          <path
            ref={outline}
            d="M200 316 C120 316 88 284 88 250 C88 216 132 190 200 190 C268 190 312 216 312 250 C312 284 280 316 200 316 Z"
            fill="none"
            stroke="#1a1a1e"
            strokeWidth="1.4"
          />
          <path ref={stoneOutline} d="M175 150 L225 150 L232 178 L200 200 L168 178 Z" fill="none" stroke="#1a1a1e" strokeWidth="1.4" />
        </svg>

        {/* stage captions */}
        {STAGES.map((s, i) => (
          <div
            key={s.key}
            ref={(el) => {
              panels.current[i] = el;
            }}
            className="absolute bottom-24 left-0 right-0 px-6 text-center"
            style={{ opacity: 0 }}
          >
            <div className="text-[0.66rem] tracking-[0.34em] uppercase text-[#b98f3a]">{s.key}</div>
            <h3 className="mt-3 font-serif text-display-sm text-ink">{s.t}</h3>
            <p className="mt-2 text-ink/50 tracking-wide">{s.l}</p>
          </div>
        ))}

        {/* progress rail */}
        <div className="absolute bottom-12 left-1/2 h-px w-40 -translate-x-1/2 bg-ink/15">
          <div ref={rail} className="absolute inset-0 origin-left bg-[#b98f3a]" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </section>
  );
}
