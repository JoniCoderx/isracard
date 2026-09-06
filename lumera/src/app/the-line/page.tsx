import type { Metadata } from "next";
import TheLineHero from "@/components/line/TheLineHero";
import BuildYourSilavu from "@/components/builder/BuildYourSilavu";
import FinalSection from "@/components/sections/FinalSection";
import { Reveal, MaskReveal } from "@/components/motion/Reveal";
import { SectionLabel } from "@/components/ui/LinkCTA";

export const metadata: Metadata = {
  title: "The SILAVU Line",
  description: "The house tennis bracelet — a single unbroken line of matched brilliants. Configure your own.",
};

export default function TheLinePage() {
  return (
    <>
      <TheLineHero />

      <section className="bg-obsidian px-6 md:px-12 py-28 md:py-40">
        <div className="mx-auto max-w-editorial grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <Reveal>
              <SectionLabel index="—">The Signature</SectionLabel>
            </Reveal>
            <h2 className="mt-8 font-serif text-display-sm text-ivory leading-[0.98]">
              <MaskReveal>One line.</MaskReveal>
              <MaskReveal delay={0.06}>
                <span className="italic text-ivory-dim">Never broken.</span>
              </MaskReveal>
            </h2>
          </div>
          <Reveal className="md:col-span-5 md:col-start-8" delay={0.15}>
            <p className="text-ash text-lg leading-relaxed">
              Every stone is hand-matched for colour and cut, then set in a continuous flexible line so the light runs
              without interruption around the wrist. Drag the piece above to move it in the light. Then build your own.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-ink pt-24 md:pt-32">
        <div className="mx-auto max-w-editorial px-6 md:px-12 mb-14">
          <Reveal>
            <div className="eyebrow text-champagne">Build Your SILAVU</div>
          </Reveal>
          <h2 className="mt-6 font-serif text-display-sm text-ivory max-w-3xl">
            <MaskReveal>Your stone. Your specification.</MaskReveal>
          </h2>
        </div>
        <BuildYourSilavu />
      </section>

      <FinalSection />
    </>
  );
}
