import type { Metadata } from "next";
import PrivateJourney from "@/components/private/PrivateJourney";
import BespokeRequest from "@/components/private/BespokeRequest";
import FinalSection from "@/components/sections/FinalSection";
import { Reveal, MaskReveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "SILAVU Private",
  description: "One client. One stone. One piece. Bespoke high jewellery, made in Dubai.",
};

export default function PrivatePage() {
  return (
    <>
      <section className="bg-obsidian px-6 md:px-12 pt-40 md:pt-56 pb-28 md:pb-40 text-center">
        <Reveal>
          <div className="eyebrow text-champagne">SILAVU Private</div>
        </Reveal>
        <h1 className="mt-10 font-serif text-display-lg text-ivory leading-[0.9]">
          <MaskReveal>One client.</MaskReveal>
          <MaskReveal delay={0.06}>
            <span className="italic text-ivory-dim">One stone.</span>
          </MaskReveal>
          <MaskReveal delay={0.12}>One piece.</MaskReveal>
        </h1>
      </section>

      <PrivateJourney />

      <BespokeRequest />
      <FinalSection />
    </>
  );
}
