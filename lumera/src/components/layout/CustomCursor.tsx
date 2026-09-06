"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.documentElement.classList.add("cursor-hide");
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    let hover = false, text = "", moved = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!moved) {
        moved = true;
        [dot, ring].forEach((r) => r.current && (r.current.style.opacity = "1"));
      }
      const el = (e.target as HTMLElement)?.closest?.("[data-cursor],[data-diamond],a,button") as HTMLElement | null;
      hover = !!el;
      text = el?.getAttribute("data-cursor") || "";
    };

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (dot.current) dot.current.style.transform = `translate3d(${mx}px,${my}px,0) translate(-50%,-50%)`;
      if (ring.current) {
        const s = text ? 2.6 : hover ? 1.8 : 1;
        ring.current.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%) scale(${s})`;
        ring.current.style.borderColor = hover ? "rgba(200,169,106,0.7)" : "rgba(244,240,232,0.28)";
      }
      if (label.current) {
        label.current.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
        label.current.textContent = text;
        label.current.style.opacity = text ? "1" : "0";
      }
      raf = requestAnimationFrame(loop);
    };

    addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    if (reduce) cancelAnimationFrame(raf);

    return () => {
      removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("cursor-hide");
    };
  }, []);

  return (
    <>
      <div ref={dot} className="pointer-events-none fixed left-0 top-0 z-[100] h-[5px] w-[5px] rounded-full bg-ivory opacity-0 mix-blend-difference" />
      <div ref={ring} className="pointer-events-none fixed left-0 top-0 z-[100] h-9 w-9 rounded-full border opacity-0 transition-[border-color] duration-300" style={{ borderColor: "rgba(244,240,232,0.28)" }} />
      <div ref={label} className="pointer-events-none fixed left-0 top-0 z-[100] text-[0.55rem] tracking-[0.3em] uppercase text-ivory opacity-0 transition-opacity duration-300" />
    </>
  );
}
