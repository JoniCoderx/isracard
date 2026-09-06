"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

type Ctx = { enabled: boolean; toggle: () => void; chime: () => void };
const SoundContext = createContext<Ctx | null>(null);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const droneRef = useRef<{ stop: () => void } | null>(null);

  const ensure = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    ctxRef.current = ctx;
    masterRef.current = master;
    return ctx;
  }, []);

  const startDrone = useCallback(() => {
    const ctx = ensure();
    if (droneRef.current) return;
    // low atmospheric room tone: filtered noise + two detuned sines, very quiet
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 3);
    g.connect(masterRef.current!);

    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 180;
    noise.connect(lp);
    lp.connect(g);
    noise.start();

    const oscs = [55, 82.5].map((f) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const og = ctx.createGain();
      og.gain.value = 0.04;
      o.connect(og);
      og.connect(g);
      o.start();
      return o;
    });

    droneRef.current = {
      stop: () => {
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
        setTimeout(() => {
          noise.stop();
          oscs.forEach((o) => o.stop());
        }, 1600);
      },
    };
  }, [ensure]);

  const toggle = useCallback(() => {
    setEnabled((e) => {
      const next = !e;
      if (next) {
        const ctx = ensure();
        ctx.resume();
        startDrone();
      } else {
        droneRef.current?.stop();
        droneRef.current = null;
      }
      return next;
    });
  }, [ensure, startDrone]);

  const chime = useCallback(() => {
    if (!enabled || !ctxRef.current) return;
    const ctx = ctxRef.current;
    const t = ctx.currentTime;
    // tiny crystalline resonance
    [1568, 2093, 3136].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.06 / (i + 1), t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      o.connect(g);
      g.connect(masterRef.current!);
      o.start(t);
      o.stop(t + 1.3);
    });
  }, [enabled]);

  useEffect(() => () => droneRef.current?.stop(), []);

  return <SoundContext.Provider value={{ enabled, toggle, chime }}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const c = useContext(SoundContext);
  if (!c) return { enabled: false, toggle: () => {}, chime: () => {} };
  return c;
}
