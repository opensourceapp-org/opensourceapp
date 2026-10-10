"use client";

import { HeroVisual } from "@/components/visual/hero-visual";
import { cn } from "@/lib/utils";

type HomeHeroSectionProps = {
  children: React.ReactNode;
  className?: string;
};

export function HomeHeroSection({ children, className }: HomeHeroSectionProps) {
  return (
    <section
      className={cn(
        "relative min-h-[28rem] overflow-hidden py-12 md:min-h-[32rem] md:py-16",
        className,
      )}
    >
      <HeroVisual variant="home" />
      <div className="relative z-10 flex min-h-[20rem] flex-col justify-center gap-6 md:min-h-[24rem]">
        {children}
      </div>
    </section>
  );
}
