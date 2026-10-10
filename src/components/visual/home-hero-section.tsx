"use client";

import { HeroVisual } from "@/components/visual/hero-visual";

type HomeHeroSectionProps = {
  children: React.ReactNode;
};

export function HomeHeroSection({ children }: HomeHeroSectionProps) {
  return (
    <section className="relative space-y-6 pb-2 pt-2 md:pb-4 md:pt-4">
      <HeroVisual variant="home" />
      <div className="relative z-10 space-y-6 hero-scroll-parallax">{children}</div>
    </section>
  );
}
