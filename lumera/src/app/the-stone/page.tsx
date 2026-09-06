import type { Metadata } from "next";
import InsideTheStone from "@/components/sections/InsideTheStone";
import FinalSection from "@/components/sections/FinalSection";
import { Reveal, MaskReveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "The Stone",
  description: "Inside the stone — cut, colour, clarity, carat. Beauty measured in microns.",
};

export default function TheStonePage() {
  return (
    <>
      <section className="bg-obsidian px-6 md:px-12 pt-40 md:pt-52 pb-10 text-center">
        <Reveal>
          <div className="eyebrow text-champagne">The Stone</div>
        </Reveal>
        <h1 className="mt-8 font-serif text-display-md text-ivory leading-[0.95]">
          <MaskReveal>Scroll into the stone.</MaskReveal>
        </h1>
      </section>

      <InsideTheStone />

      <section className="bg-obsidian px-6 md:px-12 py-40 md:py-56 text-center">
        <Reveal>
          <h2 className="font-serif text-display-md text-ivory leading-[0.95]">
            <MaskReveal>Beauty is measured</MaskReveal>
            <MaskReveal delay={0.07}>
              <span className="italic text-ivory-dim">in microns.</span>
            </MaskReveal>
          </h2>
        </Reveal>
      </section>

      <FinalSection />
    </>
  );
}
