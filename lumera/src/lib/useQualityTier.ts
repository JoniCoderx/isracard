"use client";

import { useEffect, useState } from "react";

export type Tier = "ultra" | "standard" | "lite" | "none";

export type QualitySettings = {
  tier: Tier;
  webgl: boolean;
  reduced: boolean;
  mobile: boolean;
  dpr: [number, number];
  bloom: boolean;
  transmissionSamples: number;
  transmissionResolution: number;
  aa: boolean;
};

function detect(): QualitySettings {
  if (typeof window === "undefined") {
    return { tier: "standard", webgl: true, reduced: false, mobile: false, dpr: [1, 1.5], bloom: true, transmissionSamples: 6, transmissionResolution: 512, aa: true };
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.matchMedia("(max-width: 820px)").matches || /Mobi|Android/i.test(navigator.userAgent);

  let webgl = false;
  try {
    const c = document.createElement("canvas");
    webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    webgl = false;
  }

  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? (mobile ? 4 : 8);
  const cores = navigator.hardwareConcurrency ?? (mobile ? 4 : 8);
  const saveData = (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData ?? false;

  if (!webgl) return base("none", { webgl: false, reduced, mobile });
  if (reduced || saveData) return base("lite", { webgl, reduced, mobile });

  let score = 0;
  score += mem >= 8 ? 2 : mem >= 4 ? 1 : 0;
  score += cores >= 8 ? 2 : cores >= 4 ? 1 : 0;
  score += mobile ? 0 : 2;

  const tier: Tier = score >= 5 ? "ultra" : score >= 2 ? "standard" : "lite";
  return base(tier, { webgl, reduced, mobile });
}

function base(tier: Tier, o: { webgl: boolean; reduced: boolean; mobile: boolean }): QualitySettings {
  const map: Record<Tier, Omit<QualitySettings, "tier" | "webgl" | "reduced" | "mobile">> = {
    ultra: { dpr: [1, 2], bloom: true, transmissionSamples: 10, transmissionResolution: 1024, aa: true },
    standard: { dpr: [1, 1.6], bloom: true, transmissionSamples: 6, transmissionResolution: 512, aa: true },
    lite: { dpr: [1, 1.3], bloom: false, transmissionSamples: 0, transmissionResolution: 256, aa: false },
    none: { dpr: [1, 1], bloom: false, transmissionSamples: 0, transmissionResolution: 128, aa: false },
  };
  return { tier, ...o, ...map[tier] };
}

export function useQualityTier(): QualitySettings {
  const [q, setQ] = useState<QualitySettings>(() => ({
    tier: "standard",
    webgl: true,
    reduced: false,
    mobile: false,
    dpr: [1, 1.5],
    bloom: true,
    transmissionSamples: 6,
    transmissionResolution: 512,
    aa: true,
  }));
  useEffect(() => setQ(detect()), []);
  return q;
}
