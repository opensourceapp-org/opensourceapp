"use client";

import { BrowseAtmosphere } from "@/components/visual/browse-atmosphere";
import { cn } from "@/lib/utils";

type BrowseHeroSectionProps = {
  children: React.ReactNode;
  className?: string;
};

/** /apps header: full-width atmosphere with title + filters in one block. */
export function BrowseHeroSection({
  children,
  className,
}: BrowseHeroSectionProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden pb-8 pt-6 md:pb-10 md:pt-8",
        className,
      )}
    >
      <BrowseAtmosphere />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-24 bg-gradient-to-b from-transparent to-background"
        aria-hidden="true"
      />
      <div className="relative z-10 space-y-6">{children}</div>
    </section>
  );
}
