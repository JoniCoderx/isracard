import { Reveal, MaskReveal } from "@/components/motion/Reveal";
import { SectionLabel } from "@/components/ui/LinkCTA";

export default function HouseStatement() {
  return (
    <section className="relative bg-obsidian px-6 md:px-12 py-32 md:py-52">
      <div className="mx-auto max-w-editorial">
        <Reveal>
          <SectionLabel index="I">The House</SectionLabel>
        </Reveal>
        <h2 className="mt-10 font-serif text-display-md text-ivory max-w-5xl">
          <MaskReveal>The rarest thing in the room</MaskReveal>
          <MaskReveal delay={0.08}>
            <span className="text-ivory-dim italic">shouldn&rsquo;t need an introduction.</span>
          </MaskReveal>
        </h2>

        <div className="mt-16 grid gap-10 md:grid-cols-12">
          <Reveal className="md:col-span-5 md:col-start-1" delay={0.1}>
            <p className="text-ash text-lg leading-relaxed max-w-md">
              A private diamond house in Dubai, working quietly for a small number of clients across the Gulf, Europe and
              beyond. We source, cut and set exceptional stones — and we do it discreetly.
            </p>
          </Reveal>
          <Reveal className="md:col-span-5 md:col-start-8" delay={0.2}>
            <p className="font-serif text-3xl leading-snug text-ivory">
              Money doesn&rsquo;t need to shout.
              <span className="block text-champagne text-xl mt-4 font-sans tracking-[0.28em] uppercase">
                Not made for everyone.
              </span>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
