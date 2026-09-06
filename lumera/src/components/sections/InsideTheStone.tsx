"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import StoneVisual from "@/components/visual/StoneVisual";

const STAGES = [
  { key: "01", title: "Cut", line: "Light is engineered, not found. Angles to a tenth of a degree." },
  { key: "02", title: "Colour", line: "D to F. The rarest stones hold no colour at all." },
  { key: "03", title: "Clarity", line: "VVS and above. Flawless to all but the loupe." },
  { key: "04", title: "Carat", line: "Weight you feel in the hand before you see it in the light." },
];

export default function InsideTheStone() {
  const section = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const stone = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const render = (p: number) => {
      if (stone.current) {
        const scale = 1 + p * 2.0;
        stone.current.style.transform = `scale(${scale}) rotate(${p * 40}deg)`;
        stone.current.style.opacity = String(1 - p * 0.15);
      }
      const seg = 1 / STAGES.length;
      panels.current.forEach((el, i) => {
        if (!el) return;
        const center = seg * (i + 0.5);
        const d = Math.abs(p - center);
        const vis = Math.max(0, 1 - d / (seg * 0.5));
        el.style.opacity = String(vis);
        el.style.transform = `translateY(${(1 - vis) * 26}px)`;
      });
      if (rail.current) rail.current.style.transform = `scaleY(${p})`;
    };

    if (reduce) {
      render(0.12);
      panels.current.forEach((el) => el && (el.style.opacity = "1"));
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: section.current!,
      start: "top top",
      end: "+=320%",
      pin: pin.current!,
      scrub: 0.6,
      onUpdate: (self) => render(self.progress),
    });
    render(0);
    return () => st.kill();
  }, []);

  return (
    <section ref={section} className="relative bg-obsidian">
      <div ref={pin} className="relative flex h-[100svh] w-full items-center justify-center overflow-hidden">
        {/* progress rail */}
        <div className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 h-40 w-px bg-white/10">
          <div ref={rail} className="absolute inset-0 origin-top bg-champagne" style={{ transform: "scaleY(0)" }} />
        </div>

        <div className="absolute left-6 md:left-12 top-16 overline text-graphite">Inside the Stone</div>

        {/* the stone */}
        <div
          ref={stone}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[62vmin] w-[62vmin] -translate-x-1/2 -translate-y-1/2 will-change-transform"
        >
          <StoneVisual hue={["#ffffff", "#cfe0ff"]} />
        </div>

        {/* stage panels */}
        {STAGES.map((s, i) => (
          <div
            key={s.key}
            ref={(el) => {
              panels.current[i] = el;
            }}
            className="absolute bottom-20 left-0 right-0 px-6 md:px-12 text-center"
            style={{ opacity: 0 }}
          >
            <div className="overline text-champagne">{s.key}</div>
            <h3 className="mt-4 font-serif text-display-sm text-ivory">{s.title}</h3>
            <p className="mx-auto mt-4 max-w-md text-ash tracking-wide">{s.line}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
