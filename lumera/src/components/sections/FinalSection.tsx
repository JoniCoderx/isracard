import { Reveal, MaskReveal } from "@/components/motion/Reveal";
import { LinkCTA } from "@/components/ui/LinkCTA";
import { BRAND, whatsappLink } from "@/lib/brand";

export default function FinalSection() {
  return (
    <footer className="relative overflow-hidden bg-obsidian px-6 md:px-12 pt-32 md:pt-48">
      <div className="mx-auto max-w-editorial">
        <Reveal>
          <div className="overline text-champagne">{BRAND.city}</div>
        </Reveal>
        <h2 className="mt-8 font-serif text-display-lg text-ivory leading-[0.9]">
          <MaskReveal>Private viewings</MaskReveal>
          <MaskReveal delay={0.07}>
            <span className="italic text-ivory-dim">by appointment.</span>
          </MaskReveal>
        </h2>

        <Reveal delay={0.15}>
          <div className="mt-12">
            <LinkCTA href="/private-viewing" ghost>
              Book a Private Viewing
            </LinkCTA>
          </div>
        </Reveal>

        <div className="mt-24 flex flex-wrap items-end justify-between gap-8 hairline-t pt-10">
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            <a href={whatsappLink(`Hello ${BRAND.name}.`)} target="_blank" rel="noopener noreferrer" className="overline text-ivory-dim hover:text-champagne transition-colors" data-diamond>
              WhatsApp
            </a>
            <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="overline text-ivory-dim hover:text-champagne transition-colors" data-diamond>
              Instagram
            </a>
            <span className="overline text-graphite">{BRAND.city}, {BRAND.country}</span>
          </div>
          <div className="overline text-graphite">© {new Date().getFullYear()} {BRAND.name}</div>
        </div>
      </div>

      {/* monogram dissolving into black */}
      <div
        className="pointer-events-none mt-10 flex justify-center"
        style={{
          maskImage: "linear-gradient(to bottom, #000 0%, #000 42%, transparent 96%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 42%, transparent 96%)",
        }}
      >
        <span className="font-serif leading-none text-ivory/8 select-none" style={{ fontSize: "min(38vw, 34rem)" }}>
          {BRAND.name}
        </span>
      </div>
    </footer>
  );
}
