"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BRAND, whatsappLink } from "@/lib/brand";
import { useEnquiry } from "@/components/enquiry/EnquiryProvider";

const EASE = [0.16, 1, 0.3, 1] as const;

const SERVICES = [
  { id: "viewing", t: "Private Viewing", d: "See the pieces in person. No floor, no audience." },
  { id: "bespoke", t: "Bespoke Consultation", d: "Design a piece from nothing, with the atelier." },
  { id: "sourcing", t: "Stone Sourcing", d: "We locate a specific stone, discreetly." },
];
const TIMES = ["11:00", "14:00", "16:00", "18:00", "20:00"];

export default function PrivateRoom() {
  const { add } = useEnquiry();
  const [service, setService] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", contact: "" });
  const [done, setDone] = useState(false);

  const dates = useMemo(() => {
    const out: { key: string; wd: string; d: string; mo: string }[] = [];
    const now = new Date();
    for (let i = 1; i <= 14; i++) {
      const dt = new Date(now);
      dt.setDate(now.getDate() + i);
      out.push({
        key: dt.toISOString().slice(0, 10),
        wd: dt.toLocaleDateString("en-GB", { weekday: "short" }),
        d: String(dt.getDate()),
        mo: dt.toLocaleDateString("en-GB", { month: "short" }),
      });
    }
    return out;
  }, []);

  const ready = service && date && time && form.name && form.contact;
  const svc = SERVICES.find((s) => s.id === service);

  function reserve() {
    if (!ready) return;
    const msg =
      `The Private Room — reservation request\n\n` +
      `Service: ${svc?.t}\nDate: ${date}\nTime: ${time} (GST)\n\n` +
      `Name: ${form.name}\nContact: ${form.contact}\n\n` +
      `${BRAND.city} · by appointment`;
    add({ id: `room-${Date.now()}`, title: `${svc?.t}`, detail: `${date} · ${time} GST`, meta: form.name });
    window.open(whatsappLink(msg), "_blank");
    setDone(true);
  }

  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-black">
      {/* single overhead light */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh]"
        style={{ background: "radial-gradient(50% 80% at 50% 0%, rgba(244,240,232,0.16), transparent 70%)" }}
      />
      {/* the illuminated table */}
      <div
        className="pointer-events-none absolute left-1/2 top-[58%] h-[40vh] w-[80vw] max-w-4xl -translate-x-1/2 rounded-[50%]"
        style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.06), transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-3xl px-6 pt-40 md:pt-52 pb-32">
        <div className="text-center">
          <div className="eyebrow text-champagne">The Private Room</div>
          <h1 className="mt-6 font-serif text-display-md text-ivory leading-none">{BRAND.city}</h1>
          <p className="mt-6 text-ash tracking-wide">By appointment. Reserve the room, and the time is yours alone.</p>
        </div>

        {done ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }} className="mt-24 text-center">
            <h2 className="font-serif text-display-sm text-ivory">The room is held.</h2>
            <p className="mt-4 text-ash">
              {svc?.t} · {date} · {time} GST. Your concierge will confirm personally.
            </p>
          </motion.div>
        ) : (
          <div className="mt-20 space-y-14">
            {/* service */}
            <Block n="01" label="Choose the occasion">
              <div className="grid gap-4 sm:grid-cols-3">
                {SERVICES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setService(s.id)}
                    data-diamond
                    className={`border p-5 text-left transition-all duration-500 ${
                      service === s.id ? "border-champagne/60 bg-white/[0.05]" : "hairline hover:border-white/25"
                    }`}
                  >
                    <div className="font-serif text-2xl text-ivory">{s.t}</div>
                    <div className="mt-2 text-ash text-xs leading-relaxed">{s.d}</div>
                  </button>
                ))}
              </div>
            </Block>

            <AnimatePresence>
              {service && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
                  <Block n="02" label="Select a day">
                    <div className="flex flex-wrap gap-3">
                      {dates.map((d) => (
                        <button
                          key={d.key}
                          onClick={() => setDate(d.key)}
                          data-diamond
                          className={`border px-4 py-3 text-center transition-all duration-400 ${
                            date === d.key ? "border-champagne/60 bg-white/[0.05] text-ivory" : "hairline text-graphite hover:text-ivory-dim"
                          }`}
                        >
                          <div className="overline">{d.wd}</div>
                          <div className="font-serif text-2xl tabular">{d.d}</div>
                          <div className="overline text-graphite">{d.mo}</div>
                        </button>
                      ))}
                    </div>
                  </Block>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {date && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
                  <Block n="03" label="Select a time · GST">
                    <div className="flex flex-wrap gap-3">
                      {TIMES.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTime(t)}
                          data-diamond
                          className={`border px-6 py-3 tabular transition-all duration-400 ${
                            time === t ? "border-champagne/60 bg-white/[0.05] text-ivory" : "hairline text-graphite hover:text-ivory-dim"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </Block>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {time && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
                  <Block n="04" label="Your details">
                    <div className="grid gap-4 sm:grid-cols-2 w-full">
                      <input
                        placeholder="Name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="bg-transparent border hairline px-4 py-3 text-ivory text-sm tracking-wide focus:border-champagne/50 outline-none transition-colors"
                      />
                      <input
                        placeholder="Email or phone"
                        value={form.contact}
                        onChange={(e) => setForm({ ...form, contact: e.target.value })}
                        className="bg-transparent border hairline px-4 py-3 text-ivory text-sm tracking-wide focus:border-champagne/50 outline-none transition-colors"
                      />
                    </div>
                    <button
                      onClick={reserve}
                      disabled={!ready}
                      data-diamond
                      data-cursor="Reserve"
                      className={`cta cta-ghost mt-6 w-full justify-center ${ready ? "" : "opacity-40 pointer-events-none"}`}
                    >
                      Reserve the Room
                    </button>
                  </Block>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}

function Block({ n, label, children }: { n: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-5">
        <span className="text-champagne text-xs tabular">{n}</span>
        <span className="h-px flex-1 bg-white/10" />
        <span className="overline text-ivory-dim">{label}</span>
      </div>
      {children}
    </div>
  );
}
