"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useEnquiry } from "./EnquiryProvider";
import { BRAND, whatsappLink } from "@/lib/brand";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function EnquiryDrawer() {
  const { items, remove, open, setOpen, count, clear } = useEnquiry();
  const [form, setForm] = useState({ name: "", contact: "", note: "" });
  const [sent, setSent] = useState(false);

  function submit() {
    const lines = items.map((i) => `• ${i.title} — ${i.detail}${i.meta ? ` (${i.meta})` : ""}`).join("\n");
    const msg =
      `Private enquiry — ${BRAND.name} ${BRAND.city}\n\n` +
      `Name: ${form.name || "—"}\nContact: ${form.contact || "—"}\n\n` +
      `Pieces of interest:\n${lines || "—"}\n\n` +
      (form.note ? `Note: ${form.note}\n\n` : "") +
      `Requested via the private showroom.`;
    window.open(whatsappLink(msg), "_blank");
    setSent(true);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className="fixed right-0 top-0 z-[81] flex h-full w-full max-w-[460px] flex-col bg-ink border-l hairline"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div className="flex items-center justify-between px-8 py-7 hairline-b">
              <div className="overline">Private Enquiry · {count}</div>
              <button onClick={() => setOpen(false)} className="overline hover:text-champagne transition-colors" data-diamond>
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              {items.length === 0 ? (
                <p className="font-serif text-3xl text-ivory-dim leading-snug mt-6">
                  Your selection is empty.
                  <span className="block text-ash text-lg mt-3 font-sans tracking-wide">
                    Add a piece from the showcase to begin a private conversation.
                  </span>
                </p>
              ) : (
                <ul className="space-y-6">
                  {items.map((i) => (
                    <li key={i.id} className="hairline-b pb-6">
                      <div className="flex justify-between gap-4">
                        <div>
                          <div className="font-serif text-2xl leading-tight">{i.title}</div>
                          <div className="text-ash text-sm mt-1 tracking-wide">{i.detail}</div>
                          {i.meta && <div className="text-champagne text-xs mt-2 tracking-widest">{i.meta}</div>}
                        </div>
                        <button
                          onClick={() => remove(i.id)}
                          className="overline text-graphite hover:text-ivory transition-colors self-start"
                          data-diamond
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {items.length > 0 && (
                <div className="mt-8 space-y-4">
                  <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                  <Field
                    label="Email or phone"
                    value={form.contact}
                    onChange={(v) => setForm({ ...form, contact: v })}
                  />
                  <Field label="Note (optional)" value={form.note} onChange={(v) => setForm({ ...form, note: v })} textarea />
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="px-8 py-7 hairline-t space-y-4">
                {sent && (
                  <p className="text-champagne text-xs tracking-widest">
                    Handed to the concierge. We reply personally.
                  </p>
                )}
                <button onClick={submit} className="cta w-full justify-between" data-diamond>
                  <span>Send to Concierge</span>
                  <svg width="26" height="8" viewBox="0 0 26 8" fill="none" className="cta-arrow">
                    <path d="M0 4h24M20 1l4 3-4 3" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </button>
                <button onClick={clear} className="overline text-graphite hover:text-ivory transition-colors" data-diamond>
                  Clear selection
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="overline block mb-2">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-transparent border hairline px-4 py-3 text-ivory text-sm tracking-wide focus:border-champagne/50 outline-none resize-none transition-colors"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border hairline px-4 py-3 text-ivory text-sm tracking-wide focus:border-champagne/50 outline-none transition-colors"
        />
      )}
    </label>
  );
}
