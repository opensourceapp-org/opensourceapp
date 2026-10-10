import { cn } from "@/lib/utils";

type HeroVisualFallbackProps = {
  variant: "home" | "compact";
  className?: string;
};

/** Static decorative backdrop when WebGL is off or unavailable. */
export function HeroVisualFallback({
  variant,
  className,
}: HeroVisualFallbackProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "absolute inset-0 opacity-90",
          variant === "home"
            ? "bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.42_0.11_168/0.12),transparent_70%)]"
            : "bg-[radial-gradient(ellipse_70%_80%_at_50%_0%,oklch(0.42_0.11_168/0.08),transparent_65%)]",
        )}
      />
      <div
        className="absolute inset-0 opacity-[0.4] dark:opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.42 0.11 168 / 6%) 1px, transparent 1px), linear-gradient(90deg, oklch(0.42 0.11 168 / 6%) 1px, transparent 1px)",
          backgroundSize: variant === "home" ? "48px 48px" : "40px 40px",
          backgroundPosition: variant === "home" ? "center top" : undefined,
        }}
      />
      {variant === "home" ? (
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
      ) : null}
    </div>
  );
}
