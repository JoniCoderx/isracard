import { Reveal } from "@/components/motion/Reveal";
import { SectionLabel } from "@/components/ui/LinkCTA";

const TRUST = [
  { t: "GIA & IGI", d: "Every stone independently graded and certified. Papers travel with the piece." },
  { t: "18K gold · Platinum", d: "Hallmarked precious metals only. Nothing plated, nothing filled." },
  { t: "Provenance", d: "Traceable origin for every diamond we set, natural or grown." },
  { t: "Insured delivery", d: "Fully insured, discreet, hand-carried where it matters." },
  { t: "Lifetime service", d: "Cleaning, re-sizing and re-certification, for as long as you own it." },
  { t: "Dubai concierge", d: "One relationship. One line. Answered personally." },
];

export default function TrustEditorial() {
  return (
    <section className="relative bg-ink px-6 md:px-12 py-28 md:py-40">
      <div className="mx-auto max-w-editorial">
        <Reveal>
          <SectionLabel index="VI">Assurance</SectionLabel>
        </Reveal>
        <h2 className="mt-8 font-serif text-display-sm text-ivory max-w-3xl">
          Credibility, stated plainly.
        </h2>

        <div className="mt-16 grid gap-x-12 gap-y-2 md:grid-cols-3">
          {TRUST.map((x, i) => (
            <Reveal key={x.t} delay={(i % 3) * 0.08}>
              <div className="hairline-t py-8">
                <div className="flex items-baseline gap-4">
                  <span className="text-champagne text-xs tabular">0{i + 1}</span>
                  <h3 className="font-serif text-3xl text-ivory">{x.t}</h3>
                </div>
                <p className="mt-4 text-ash text-sm leading-relaxed tracking-wide max-w-xs">{x.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
