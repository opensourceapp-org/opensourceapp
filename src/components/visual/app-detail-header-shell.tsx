"use client";

import { BrowseAtmosphere } from "@/components/visual/browse-atmosphere";
import { HeroVisualFallback } from "@/components/visual/hero-visual-fallback";
import { cn } from "@/lib/utils";

type AppDetailHeaderShellProps = {
  children: React.ReactNode;
  className?: string;
  /** Breadcrumbs (rendered above main row). */
  top?: React.ReactNode;
};

/**
 * App detail hero band: pulls into &lt;main&gt; top padding so grid/3D meets the site header.
 */
export function AppDetailHeaderShell({
  children,
  className,
  top,
}: AppDetailHeaderShellProps) {
  return (
    <div className="relative -mx-4 -mt-8 md:-mt-10">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 top-0 z-0 overflow-hidden md:top-0"
        aria-hidden="true"
      >
        <HeroVisualFallback
          variant="compact"
          className="h-full min-h-full opacity-100 [&>div:first-child]:opacity-100"
        />
        <BrowseAtmosphere className="h-full min-h-full" />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 top-0 z-[1] bg-gradient-to-b from-background/5 via-background/15 to-background"
        aria-hidden="true"
      />
      <header
        className={cn(
          "relative z-10 border-b border-border/80 px-4 pb-8 pt-5 md:px-4 md:pt-6",
          className,
        )}
      >
        <div className="space-y-5">
          {top}
          {children}
        </div>
      </header>
    </div>
  );
}
