import { Reveal, MaskReveal } from "@/components/motion/Reveal";
import { LinkCTA, SectionLabel } from "@/components/ui/LinkCTA";

const JOURNEY = ["Concept", "Stone", "Design", "Setting", "Dubai"];

export default function BespokeTeaser() {
  return (
    <section className="relative bg-ink px-6 md:px-12 py-32 md:py-48 overflow-hidden">
      <div className="mx-auto max-w-editorial">
        <Reveal>
          <SectionLabel index="IV">Bespoke</SectionLabel>
        </Reveal>

        <div className="mt-12 grid gap-12 md:grid-cols-12 items-end">
          <h2 className="md:col-span-7 font-serif text-display-lg text-ivory leading-[0.9]">
            <MaskReveal>Your idea.</MaskReveal>
            <MaskReveal delay={0.06}>
              <span className="text-ivory-dim italic">Our stone.</span>
            </MaskReveal>
            <MaskReveal delay={0.12}>One piece.</MaskReveal>
          </h2>
          <Reveal className="md:col-span-4 md:col-start-9" delay={0.2}>
            <p className="text-ash text-lg leading-relaxed">
              A single commission, from a sketch or a feeling. We source the stone, design around it, and set it in Dubai.
              Yours alone — and never made again.
            </p>
            <div className="mt-8">
              <LinkCTA href="/bespoke">Begin a commission</LinkCTA>
            </div>
          </Reveal>
        </div>

        <div className="mt-24 hairline-t pt-10">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-6">
            {JOURNEY.map((step, i) => (
              <Reveal key={step} delay={i * 0.08}>
                <div className="flex items-center gap-6">
                  <span className="font-serif text-2xl md:text-4xl text-ivory">
                    <span className="text-champagne text-sm align-super mr-2 tabular">0{i + 1}</span>
                    {step}
                  </span>
                  {i < JOURNEY.length - 1 && <span className="hidden md:block h-px w-16 bg-white/15" />}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
