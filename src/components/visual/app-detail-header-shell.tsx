"use client";

import { HeroVisualFallback } from "@/components/visual/hero-visual-fallback";
import { cn } from "@/lib/utils";

type AppDetailHeaderShellProps = {
  children: React.ReactNode;
  className?: string;
  /** Breadcrumbs + title block (rendered above main row). */
  top?: React.ReactNode;
};

/** Full-width ambient header backdrop — no boxed 3D card. */
export function AppDetailHeaderShell({
  children,
  className,
  top,
}: AppDetailHeaderShellProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden border-b border-border pb-8 pt-5 md:pt-6",
        className,
      )}
    >
      <HeroVisualFallback
        variant="compact"
        className="opacity-100 [&>div:first-child]:opacity-100"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background"
        aria-hidden="true"
      />
      <div className="relative z-10 space-y-5">
        {top}
        {children}
      </div>
    </header>
  );
}
