"use client";

import { useRef, useState } from "react";
import { whatsappLink } from "@/lib/brand";
import { Reveal } from "@/components/motion/Reveal";

export default function BespokeRequest() {
  const [form, setForm] = useState({ name: "", contact: "", vision: "" });
  const [files, setFiles] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function submit() {
    const msg =
      `SILAVU Private — bespoke enquiry\n\n` +
      `Name: ${form.name || "—"}\nContact: ${form.contact || "—"}\n\n` +
      `Vision: ${form.vision || "—"}\n` +
      (files.length ? `\nReferences ready to share: ${files.join(", ")}` : "");
    window.open(whatsappLink(msg), "_blank");
    setSent(true);
  }

  return (
    <section className="bg-obsidian px-6 md:px-12 py-28 md:py-40">
      <div className="mx-auto max-w-editorial grid gap-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <Reveal>
            <div className="eyebrow text-champagne">Begin</div>
            <h2 className="mt-8 font-serif text-display-sm text-ivory leading-[0.98]">One client. One stone. One piece.</h2>
            <p className="mt-6 text-ash leading-relaxed max-w-sm">
              Share the idea. A reference, a sketch, a memory — anything. Your concierge takes it from there, in confidence.
            </p>
          </Reveal>
        </div>

        <div className="md:col-span-6 md:col-start-7">
          <Reveal delay={0.1}>
            <div className="space-y-5">
              <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Email or phone" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} />
              <label className="block">
                <span className="overline block mb-2">Your vision</span>
                <textarea
                  rows={4}
                  value={form.vision}
                  onChange={(e) => setForm({ ...form, vision: e.target.value })}
                  className="w-full bg-transparent border hairline px-4 py-3 text-ivory text-sm tracking-wide focus:border-champagne/50 outline-none resize-none transition-colors"
                />
              </label>

              <div>
                <span className="overline block mb-2">Reference images</span>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border hairline px-4 py-5 text-left overline text-graphite hover:border-champagne/40 hover:text-ivory-dim transition-colors"
                  data-diamond
                >
                  {files.length ? files.join(" · ") : "Attach inspiration — optional"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []).map((f) => f.name))}
                />
              </div>

              {sent && <p className="text-champagne text-xs tracking-widest">Handed to the concierge. We reply personally.</p>}
              <button onClick={submit} className="cta cta-ghost w-full justify-center" data-diamond data-cursor="Private access">
                Open a Private Commission
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="overline block mb-2">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border hairline px-4 py-3 text-ivory text-sm tracking-wide focus:border-champagne/50 outline-none transition-colors"
      />
    </label>
  );
}
