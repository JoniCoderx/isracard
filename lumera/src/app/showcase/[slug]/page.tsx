import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { PIECES, getPiece } from "@/lib/data/pieces";
import ProductDetail from "@/components/product/ProductDetail";
import FinalSection from "@/components/sections/FinalSection";
import StoneVisual from "@/components/visual/StoneVisual";
import { Reveal } from "@/components/motion/Reveal";
import { SectionLabel } from "@/components/ui/LinkCTA";

export function generateStaticParams() {
  return PIECES.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getPiece(params.slug);
  if (!p) return {};
  return {
    title: `${p.name} — ${p.category}`,
    description: `${p.line} ${p.metal}. From ${p.lab.carat}, ${p.lab.clarity}, ${p.lab.color}.`,
  };
}

export default function PiecePage({ params }: { params: { slug: string } }) {
  const piece = getPiece(params.slug);
  if (!piece) notFound();

  const related = PIECES.filter((p) => p.slug !== piece.slug).slice(0, 3);

  return (
    <>
      <ProductDetail piece={piece} />

      {/* related */}
      <section className="bg-ink px-6 md:px-12 py-24 md:py-32">
        <div className="mx-auto max-w-editorial">
          <Reveal>
            <SectionLabel>More from the house</SectionLabel>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {related.map((p) => (
              <Reveal key={p.slug}>
                <Link href={`/showcase/${p.slug}`} className="block group" data-diamond>
                  <div className="relative aspect-[4/5] overflow-hidden border hairline bg-gradient-to-b from-white/[0.03] to-transparent">
                    <StoneVisual hue={p.hue} className="absolute inset-0 p-10 transition-transform duration-[1.4s] ease-luxe group-hover:scale-105" />
                  </div>
                  <div className="mt-5 flex items-baseline justify-between">
                    <span className="font-serif text-2xl text-ivory">{p.name}</span>
                    <span className="overline text-graphite">{p.category}</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <FinalSection />
    </>
  );
}
