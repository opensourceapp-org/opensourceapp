import { cn } from "@/lib/utils";

type SectionRevealProps = {
  children: React.ReactNode;
  className?: string;
};

/** Lightweight scroll-driven fade-in (CSS only, respects reduced motion). */
export function SectionReveal({ children, className }: SectionRevealProps) {
  return (
    <div
      className={cn(
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700",
        className,
      )}
    >
      {children}
    </div>
  );
}
