"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BRAND } from "@/lib/brand";
import { useEnquiry } from "@/components/enquiry/EnquiryProvider";
import { useSound } from "@/components/system/SoundProvider";
import Menu from "./Menu";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [visible, setVisible] = useState(false);
  const { count, setOpen } = useEnquiry();
  const { enabled, toggle } = useSound();

  useEffect(() => {
    if (pathname !== "/") {
      setVisible(true);
      return;
    }
    setVisible(false);
    const onEnter = () => setVisible(true);
    window.addEventListener("silavu:enter", onEnter);
    return () => window.removeEventListener("silavu:enter", onEnter);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "fixed top-0 left-0 right-0 z-[70] transition-[padding,background] duration-700",
              scrolled ? "bg-obsidian/70 backdrop-blur-md py-4" : "py-6 md:py-7"
            )}
          >
            <div className="mx-auto max-w-editorial px-6 md:px-12 flex items-center justify-between">
              <Link href="/" className="font-serif text-2xl md:text-[1.6rem] tracking-[0.32em] pl-[0.32em] text-ivory" data-diamond data-cursor="Home">
                {BRAND.name}
              </Link>

              <div className="flex items-center gap-7">
                <button onClick={toggle} className="hidden sm:block overline text-graphite hover:text-ivory transition-colors" data-diamond data-cursor={enabled ? "Sound off" : "Sound on"}>
                  Sound {enabled ? "On" : "Off"}
                </button>
                <button
                  onClick={() => setOpen(true)}
                  className="hidden sm:flex items-center gap-2 overline text-ivory hover:text-champagne transition-colors"
                  data-diamond
                  data-cursor="Enquiry"
                >
                  Enquiry <span className="text-champagne tabular">({count})</span>
                </button>
                <button
                  onClick={() => setMenu(true)}
                  className="flex items-center gap-3 overline text-ivory"
                  aria-label="Open menu"
                  data-diamond
                  data-cursor="Open"
                >
                  <span className="hidden md:inline">Menu</span>
                  <span className="flex flex-col gap-[5px] w-6">
                    <span className="h-px w-full bg-ivory" />
                    <span className="h-px w-full bg-ivory" />
                  </span>
                </button>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <Menu open={menu} onClose={() => setMenu(false)} onEnquiry={() => setOpen(true)} />
    </>
  );
}
