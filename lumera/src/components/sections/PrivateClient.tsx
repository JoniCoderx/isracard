import { Reveal, MaskReveal } from "@/components/motion/Reveal";
import { LinkCTA, SectionLabel } from "@/components/ui/LinkCTA";

const SERVICES = [
  { t: "Dubai showroom", d: "A private appointment at our DIFC atelier." },
  { t: "Residence & hotel viewing", d: "We come to you — anywhere in the city." },
  { t: "International concierge", d: "A single point of contact across time zones." },
  { t: "Rare stone sourcing", d: "Specific stones located and secured on request." },
  { t: "Custom jewellery", d: "One-of-one commissions, start to finish." },
  { t: "Discreet delivery", d: "Fully insured, worldwide, in confidence." },
];

export default function PrivateClient() {
  return (
    <section className="relative bg-obsidian px-6 md:px-12 py-32 md:py-48">
      <div className="mx-auto max-w-editorial">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Reveal>
              <SectionLabel index="V">Private Client</SectionLabel>
            </Reveal>
            <h2 className="mt-10 font-serif text-display-md text-ivory leading-[0.95]">
              <MaskReveal>Private viewing</MaskReveal>
              <MaskReveal delay={0.06}>
                <span className="italic text-ivory-dim">Dubai.</span>
              </MaskReveal>
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-8 text-ash text-lg leading-relaxed max-w-sm">
                By appointment. The wealthier the client, the quieter we become. No showroom floor, no pressure — only the
                stones, and time to consider them.
              </p>
              <div className="mt-10">
                <LinkCTA href="/private-viewing">Request an appointment</LinkCTA>
              </div>
            </Reveal>
          </div>

          <div className="md:col-span-6 md:col-start-7">
            <div className="grid sm:grid-cols-2 gap-x-10">
              {SERVICES.map((s, i) => (
                <Reveal key={s.t} delay={0.05 + i * 0.05}>
                  <div className="hairline-t py-7">
                    <div className="font-serif text-2xl text-ivory">{s.t}</div>
                    <p className="mt-2 text-ash text-sm tracking-wide leading-relaxed">{s.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
