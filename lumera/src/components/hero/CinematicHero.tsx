"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useQualityTier } from "@/lib/useQualityTier";
import HeroExperience from "./HeroExperience";
import { BRAND } from "@/lib/brand";

const EASE = [0.16, 1, 0.3, 1] as const;
const STONES = 30;

export default function CinematicHero() {
  const q = useQualityTier();
  const [phase, setPhase] = useState<"loading" | "intro" | "entered">("loading");
  const progressRef = useRef(0);

  const section = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvasWrap = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const finale = useRef<HTMLDivElement>(null);
  const stoneEls = useRef<(HTMLDivElement | null)[]>([]);
  const use3D = q.webgl && !q.reduced;

  // loading → intro
  useEffect(() => {
    const t = setTimeout(() => setPhase("intro"), use3D ? 1500 : 300);
    return () => clearTimeout(t);
  }, [use3D]);

  // if no 3D / reduced motion, reveal nav immediately and skip the pinned film
  useEffect(() => {
    if (!use3D && phase === "intro") {
      enter(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, use3D]);

  // lock scroll until entered
  useEffect(() => {
    const l = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    if (phase !== "entered") {
      l?.stop();
      document.documentElement.style.overflow = "hidden";
    } else {
      l?.start();
      document.documentElement.style.overflow = "";
    }
  }, [phase]);

  function enter(silent = false) {
    setPhase("entered");
    window.dispatchEvent(new Event("silavu:enter"));
    if (!silent) {
      const l = (window as unknown as { __lenis?: { start: () => void } }).__lenis;
      l?.start();
    }
  }

  // scroll → camera + finale
  useEffect(() => {
    if (phase !== "entered" || !use3D) return;
    gsap.registerPlugin(ScrollTrigger);

    const render = (p: number) => {
      progressRef.current = p;
      // canvas fades out into the whiteout, then the line reveal takes over
      if (canvasWrap.current) canvasWrap.current.style.opacity = String(1 - Math.max(0, (p - 0.72) / 0.16));
      if (flash.current) {
        const f = Math.max(0, 1 - Math.abs(p - 0.72) / 0.08);
        flash.current.style.opacity = String(f * 0.9);
      }
      // finale: line of light travels stone by stone (p 0.76 → 1)
      const fp = Math.max(0, (p - 0.76) / 0.24);
      if (finale.current) finale.current.style.opacity = String(fp > 0 ? 1 : 0);
      const travel = fp * (STONES + 3);
      stoneEls.current.forEach((s, k) => {
        if (!s) return;
        const b = Math.max(0, Math.min(1, travel - k));
        s.style.opacity = String(0.08 + b * 0.92);
        s.style.transform = `translateY(${Math.sin((k / STONES) * Math.PI) * -7}px) scale(${0.8 + b * 0.4}) rotate(45deg)`;
        s.style.boxShadow = b > 0.15 ? `0 0 ${8 + b * 20}px rgba(255,255,255,${b * 0.6}), 0 0 ${b * 26}px rgba(200,169,106,${b * 0.3})` : "none";
        s.style.background = b > 0.1 ? `rgba(255,255,255,${0.5 + b * 0.5})` : "rgba(210,210,220,0.12)";
      });
    };

    const st = ScrollTrigger.create({
      trigger: section.current!,
      start: "top top",
      end: "+=600%",
      pin: stage.current!,
      scrub: 0.7,
      onUpdate: (self) => render(self.progress),
    });
    render(0);
    ScrollTrigger.refresh();
    return () => st.kill();
  }, [phase, use3D]);

  return (
    <section ref={section} className="relative bg-obsidian" style={{ height: use3D ? "700vh" : "100svh" }}>
      {/* fixed WebGL canvas (behind everything) */}
      {use3D && (
        <div ref={canvasWrap} className="fixed inset-0 z-0">
          <HeroExperience quality={q} progressRef={progressRef} />
        </div>
      )}

      <div ref={stage} className="relative z-10 flex h-[100svh] w-full items-center justify-center overflow-hidden">
        {!use3D && <StaticHero />}

        {/* radial bed for depth (both modes) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(55% 50% at 50% 44%, rgba(120,140,190,0.10), transparent 70%)" }}
        />

        {/* whiteout flash */}
        <div ref={flash} className="pointer-events-none absolute inset-0 bg-white opacity-0" />

        {/* SILAVU line finale */}
        {use3D && (
          <div ref={finale} className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-black opacity-0">
            <div className="flex items-center justify-center gap-[5px] md:gap-[8px] px-6">
              {Array.from({ length: STONES }).map((_, k) => (
                <div
                  key={k}
                  ref={(el) => {
                    stoneEls.current[k] = el;
                  }}
                  className="h-3 w-3 md:h-4 md:w-4 rounded-[2px]"
                  style={{ background: "rgba(210,210,220,0.12)", opacity: 0.08 }}
                />
              ))}
            </div>
            <div className="mt-16 text-center">
              <div className="eyebrow text-champagne">The SILAVU Line</div>
              <div className="mt-4 font-serif text-display-sm text-ivory leading-none">12.84 CT</div>
              <div className="mt-3 flex items-center justify-center gap-4 overline text-platinum">
                <span>D–F</span>
                <span className="h-px w-6 bg-white/25" />
                <span>VVS</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LOADING → INTRO overlay */}
      <AnimatePresence>
        {phase !== "entered" && (
          <motion.div
            className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-obsidian"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: EASE }}
          >
            {/* the point of light → reflection */}
            <motion.div
              className="absolute rounded-full bg-white"
              initial={{ width: 2, height: 2, opacity: 0, filter: "blur(0px)" }}
              animate={
                phase === "loading"
                  ? { width: 4, height: 4, opacity: [0, 1, 0.7], boxShadow: "0 0 30px 6px rgba(255,255,255,0.7)" }
                  : { width: 6, height: 6, opacity: 0, boxShadow: "0 0 120px 30px rgba(255,255,255,0.25)" }
              }
              transition={{ duration: phase === "loading" ? 1.4 : 1.2, ease: EASE }}
            />

            {phase === "intro" && (
              <div className="relative flex flex-col items-center">
                <motion.h1
                  className="font-serif text-[clamp(3rem,12vw,10rem)] tracking-[0.34em] pl-[0.34em] text-ivory"
                  initial={{ opacity: 0, letterSpacing: "0.6em", filter: "blur(10px)" }}
                  animate={{ opacity: 1, letterSpacing: "0.34em", filter: "blur(0px)" }}
                  transition={{ duration: 2.2, ease: EASE, delay: 0.3 }}
                >
                  {BRAND.name}
                </motion.h1>
                <motion.div
                  className="mt-6 flex items-center gap-4 overline text-platinum"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.4, delay: 1.4 }}
                >
                  <span>{BRAND.tagline}</span>
                  <span className="h-px w-6 bg-white/30" />
                  <span className="text-champagne">{BRAND.city}</span>
                </motion.div>
                <motion.button
                  onClick={() => enter()}
                  className="cta mt-16 pointer-events-auto"
                  data-diamond
                  data-cursor="Enter"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, ease: EASE, delay: 2.4 }}
                >
                  <span>Enter {BRAND.name}</span>
                  <svg width="26" height="8" viewBox="0 0 26 8" fill="none" className="cta-arrow rotate-90">
                    <path d="M0 4h24M20 1l4 3-4 3" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* scroll hint */}
      {use3D && phase === "entered" && (
        <motion.div
          className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2 overline text-graphite"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 4, times: [0, 0.2, 0.8, 1] }}
        >
          Scroll — the camera follows
        </motion.div>
      )}
    </section>
  );
}

function StaticHero() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center">
      <div
        className="absolute left-1/2 top-[44%] h-[42vmin] w-[42vmin] -translate-x-1/2 -translate-y-1/2"
        style={{
          background: "conic-gradient(from 210deg, #ffffff, rgba(180,205,255,0.3), rgba(200,169,106,0.4), #ffffff)",
          clipPath: "polygon(50% 0, 100% 38%, 78% 100%, 22% 100%, 0 38%)",
          opacity: 0.85,
        }}
      />
      <h1 className="relative font-serif text-[clamp(3rem,12vw,9rem)] tracking-[0.3em] pl-[0.3em] text-ivory">{BRAND.name}</h1>
      <div className="relative mt-5 overline text-platinum">
        {BRAND.tagline} · {BRAND.city}
      </div>
    </div>
  );
}
