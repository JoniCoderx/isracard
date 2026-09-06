"use client";

import { useEffect, useState } from "react";
import { BRAND, whatsappLink } from "@/lib/brand";

export default function WhatsAppConcierge() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 2600);
    return () => clearTimeout(t);
  }, []);

  return (
    <a
      href={whatsappLink(`Hello ${BRAND.name} — I would like to speak with the concierge.`)}
      target="_blank"
      rel="noopener noreferrer"
      data-diamond
      aria-label="WhatsApp Concierge"
      className={`fixed bottom-6 right-6 z-[75] group flex items-center gap-3 border hairline bg-obsidian/70 backdrop-blur-md px-4 py-3 transition-all duration-700 hover:border-champagne/50 ${
        show ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-champagne/60 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-champagne" />
      </span>
      <span className="overline text-ivory-dim group-hover:text-champagne transition-colors">Concierge</span>
    </a>
  );
}
