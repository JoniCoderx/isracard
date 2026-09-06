"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

export type EnquiryItem = {
  id: string;
  title: string;
  detail: string;
  meta?: string;
};

type Ctx = {
  items: EnquiryItem[];
  add: (item: EnquiryItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  count: number;
};

const EnquiryContext = createContext<Ctx | null>(null);
const KEY = "lumera.enquiry";

export function EnquiryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<EnquiryItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  // lock scroll while drawer is open
  useEffect(() => {
    const l = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    if (open) {
      l?.stop();
      document.documentElement.style.overflow = "hidden";
    } else {
      l?.start();
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const add = useCallback((item: EnquiryItem) => {
    setItems((prev) => (prev.some((p) => p.id === item.id) ? prev : [...prev, item]));
    setOpen(true);
  }, []);
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((p) => p.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<Ctx>(
    () => ({ items, add, remove, clear, open, setOpen, count: items.length }),
    [items, add, remove, clear, open]
  );

  return <EnquiryContext.Provider value={value}>{children}</EnquiryContext.Provider>;
}

export function useEnquiry() {
  const ctx = useContext(EnquiryContext);
  if (!ctx) throw new Error("useEnquiry must be used within EnquiryProvider");
  return ctx;
}
