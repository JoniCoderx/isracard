import Link from "next/link";
import { featuredPieces } from "@/lib/data/pieces";
import { formatAED } from "@/lib/utils";
import StoneVisual from "@/components/visual/StoneVisual";
import { Reveal, MaskReveal } from "@/components/motion/Reveal";
import { LinkCTA, SectionLabel } from "@/components/ui/LinkCTA";
import { cn } from "@/lib/utils";

export default function ShowcasePreview() {
  const pieces = featuredPieces();
  return (
    <section className="relative bg-ink px-6 md:px-12 py-28 md:py-40">
      <div className="mx-auto max-w-editorial">
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div>
            <Reveal>
              <SectionLabel index="II">The Showcase</SectionLabel>
            </Reveal>
            <h2 className="mt-8 font-serif text-display-sm text-ivory max-w-2xl">
              <MaskReveal>A few exceptional pieces,</MaskReveal>
              <MaskReveal delay={0.06}>
                <span className="italic text-ivory-dim">presented one at a time.</span>
              </MaskReveal>
            </h2>
          </div>
          <Reveal delay={0.2}>
            <LinkCTA href="/showcase">View the full showcase</LinkCTA>
          </Reveal>
        </div>

        <div className="mt-24 space-y-32 md:space-y-48">
          {pieces.map((p, i) => {
            const flip = i % 2 === 1;
            return (
              <div key={p.slug} className="grid items-center gap-10 md:grid-cols-12">
                <Reveal
                  className={cn("md:col-span-6", flip ? "md:order-2 md:col-start-7" : "md:order-1")}
                  delay={0.05}
                >
                  <Link href={`/showcase/${p.slug}`} className="block group" data-diamond>
                    <div className="relative aspect-[4/5] w-full bg-gradient-to-b from-white/[0.03] to-transparent border hairline overflow-hidden">
                      <StoneVisual hue={p.hue} className="absolute inset-0 p-10 transition-transform duration-[1.4s] ease-luxe group-hover:scale-[1.03]" />
                      <div className="absolute left-6 top-6 overline text-graphite">{p.category}</div>
                    </div>
                  </Link>
                </Reveal>

                <div className={cn("md:col-span-5", flip ? "md:order-1 md:col-start-1" : "md:order-2 md:col-start-8")}>
                  <Reveal delay={0.12}>
                    <div className="eyebrow">{p.category}</div>
                    <h3 className="mt-5 font-serif text-display-sm text-ivory leading-[0.98]">{p.name}</h3>
                    <p className="mt-5 text-ash text-lg leading-relaxed max-w-md">{p.line}</p>

                    <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 max-w-md">
                      <Spec k="Metal" v={p.metal} />
                      <Spec k="Total carat" v={p.lab.carat} />
                      <Spec k="Clarity" v={p.lab.clarity} />
                      <Spec k="Colour" v={p.lab.color} />
                    </dl>

                    <div className="mt-8 flex items-center gap-8 flex-wrap">
                      <div>
                        <div className="overline text-graphite">From</div>
                        <div className="font-serif text-3xl text-ivory tabular mt-1">{formatAED(p.lab.price)}</div>
                      </div>
                      <LinkCTA href={`/showcase/${p.slug}`}>View piece</LinkCTA>
                    </div>
                  </Reveal>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div className="hairline-t pt-3">
      <dt className="overline text-graphite">{k}</dt>
      <dd className="text-ivory-dim text-sm mt-1 tracking-wide">{v}</dd>
    </div>
  );
}
