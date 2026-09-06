import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function Arrow() {
  return (
    <svg className="cta-arrow" width="26" height="8" viewBox="0 0 26 8" fill="none" aria-hidden>
      <path d="M0 4h24M20 1l4 3-4 3" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function LinkCTA({
  href,
  children,
  className,
  arrow = true,
  ghost = false,
  external = false,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  arrow?: boolean;
  ghost?: boolean;
  external?: boolean;
}) {
  const cls = cn(ghost ? "cta cta-ghost" : "cta", "group", className);
  const inner = (
    <>
      <span>{children}</span>
      {arrow && !ghost && <Arrow />}
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} data-diamond>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} data-diamond>
      {inner}
    </Link>
  );
}

export function SectionLabel({ index, children }: { index?: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 overline">
      {index && <span className="text-champagne">{index}</span>}
      <span className="h-px w-8 bg-white/20" />
      <span>{children}</span>
    </div>
  );
}
