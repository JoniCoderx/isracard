import { Reveal, MaskReveal } from "@/components/motion/Reveal";

export default function PageHeader({
  eyebrow,
  title,
  titleItalic,
  intro,
}: {
  eyebrow: string;
  title: string;
  titleItalic?: string;
  intro?: string;
}) {
  return (
    <header className="mx-auto max-w-editorial px-6 md:px-12 pt-40 md:pt-52 pb-16 md:pb-24">
      <Reveal>
        <div className="eyebrow">{eyebrow}</div>
      </Reveal>
      <h1 className="mt-8 font-serif text-display-md text-ivory leading-[0.92] max-w-5xl">
        <MaskReveal>{title}</MaskReveal>
        {titleItalic && (
          <MaskReveal delay={0.07}>
            <span className="italic text-ivory-dim">{titleItalic}</span>
          </MaskReveal>
        )}
      </h1>
      {intro && (
        <Reveal delay={0.15}>
          <p className="mt-10 max-w-xl text-ash text-lg leading-relaxed">{intro}</p>
        </Reveal>
      )}
    </header>
  );
}
