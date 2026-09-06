import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import TrustEditorial from "@/components/sections/TrustEditorial";
import FinalSection from "@/components/sections/FinalSection";
import { Reveal, MaskReveal } from "@/components/motion/Reveal";
import { SectionLabel } from "@/components/ui/LinkCTA";

export const metadata: Metadata = {
  title: "The House",
  description: "SILAVU — a private diamond house in Dubai. Quiet by design.",
};

export default function HousePage() {
  return (
    <>
      <PageHeader
        eyebrow="The House"
        title="Private by design."
        titleItalic="Quiet on purpose."
        intro="SILAVU is a private diamond house in Dubai. We work for a small number of clients across the Gulf, Europe and beyond — sourcing, cutting and setting exceptional stones, and saying very little about it."
      />

      <section className="bg-obsidian px-6 md:px-12 py-24 md:py-36">
        <div className="mx-auto max-w-editorial grid gap-12 md:grid-cols-12 items-start">
          <div className="md:col-span-5">
            <Reveal>
              <SectionLabel index="I">Philosophy</SectionLabel>
            </Reveal>
            <h2 className="mt-8 font-serif text-display-sm text-ivory leading-[0.98]">
              <MaskReveal>The rarest thing</MaskReveal>
              <MaskReveal delay={0.06}>
                <span className="italic text-ivory-dim">in the room.</span>
              </MaskReveal>
            </h2>
          </div>
          <Reveal className="md:col-span-6 md:col-start-7" delay={0.12}>
            <p className="text-ash text-lg leading-relaxed">
              We believe wealth is best expressed through what it does not need to prove. No floor of glass cabinets, no
              pressure, no spectacle. Only the stones — sourced with intention, cut for light, and set by hand.
            </p>
            <p className="mt-6 text-ash text-lg leading-relaxed">
              Every commission begins with a private conversation and ends with a single object that will outlast all of us.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-ink px-6 md:px-12 py-24 md:py-36">
        <div className="mx-auto max-w-editorial">
          <div className="grid gap-y-2 md:grid-cols-3 md:gap-x-16">
            {[
              { k: "Sourced", v: "Stones located across the world’s cutting houses, chosen one at a time." },
              { k: "Cut for light", v: "Proportioned to a tenth of a degree, so the fire never dulls." },
              { k: "Set in Dubai", v: "Finished by hand in our DIFC atelier, and delivered in confidence." },
            ].map((x, i) => (
              <Reveal key={x.k} delay={i * 0.08}>
                <div className="hairline-t py-10">
                  <div className="text-champagne text-xs tabular">0{i + 1}</div>
                  <h3 className="mt-4 font-serif text-3xl text-ivory">{x.k}</h3>
                  <p className="mt-4 text-ash text-sm leading-relaxed">{x.v}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <TrustEditorial />
      <FinalSection />
    </>
  );
}
