"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Procedural luminous brilliant (side profile) rendered as SVG + gradients.
 * Stands in for macro photography — the stone is the light source.
 */
export default function StoneVisual({
  hue = ["#ffffff", "#bcd2ff"],
  className,
  glow = true,
}: {
  hue?: [string, string];
  className?: string;
  glow?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useRef("s" + Math.random().toString(36).slice(2, 8)).current;

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    el.style.setProperty("--sheen", "1");
  }
  function onLeave() {
    ref.current?.style.setProperty("--sheen", "0");
  }

  // crown strips (quads) and pavilion strips (triangles to culet)
  const K = 9;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const crown = Array.from({ length: K }, (_, k) => {
    const tl = lerp(70, 130, k / K),
      tr = lerp(70, 130, (k + 1) / K);
    const bl = lerp(40, 160, k / K),
      br = lerp(40, 160, (k + 1) / K);
    return { pts: `${tl},60 ${tr},60 ${br},95 ${bl},95`, k };
  });
  const P = 11;
  const pav = Array.from({ length: P }, (_, k) => {
    const l = lerp(40, 160, k / P),
      r = lerp(40, 160, (k + 1) / P);
    return { pts: `${l},95 ${r},95 100,186`, k };
  });
  const fillFor = (k: number) => {
    const m = k % 4;
    if (m === 0) return `url(#${uid}-bright)`;
    if (m === 2) return `url(#${uid}-hue)`;
    return `url(#${uid}-mid)`;
  };

  return (
    <div
      ref={ref}
      className={cn("relative select-none", className)}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      data-diamond
      style={{ ["--sheen" as string]: "0" }}
    >
      {glow && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(45% 45% at 50% 46%, ${hue[1]}22, transparent 70%)`,
          }}
        />
      )}
      <svg viewBox="0 0 200 200" className="relative h-full w-full overflow-visible">
        <defs>
          <linearGradient id={`${uid}-bright`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="1" stopColor={hue[1]} stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id={`${uid}-hue`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={hue[0]} stopOpacity="0.85" />
            <stop offset="1" stopColor={hue[1]} stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={`${uid}-mid`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="1" stopColor={hue[1]} stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id={`${uid}-table`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* pavilion */}
        {pav.map((p) => (
          <polygon key={"p" + p.k} points={p.pts} fill={fillFor(p.k + 1)} stroke="#00000022" strokeWidth="0.4" />
        ))}
        {/* crown */}
        {crown.map((c) => (
          <polygon key={"c" + c.k} points={c.pts} fill={fillFor(c.k)} stroke="#00000022" strokeWidth="0.4" />
        ))}
        {/* table face */}
        <polygon points="70,60 130,60 160,95 40,95" fill="none" stroke="#ffffff30" strokeWidth="0.5" />
        <rect x="70" y="57" width="60" height="4" fill={`url(#${uid}-table)`} />
        {/* girdle line */}
        <line x1="40" y1="95" x2="160" y2="95" stroke="#ffffff55" strokeWidth="0.6" />
        {/* specular flash */}
        <line x1="52" y1="70" x2="150" y2="150" stroke="#ffffff" strokeWidth="1.1" opacity="0.5" />
      </svg>

      {/* pointer sheen — the stone catches a highlight near the cursor */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 mix-blend-screen"
        style={{
          opacity: "var(--sheen)",
          background: "radial-gradient(120px 120px at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.5), transparent 60%)",
        }}
      />
    </div>
  );
}
