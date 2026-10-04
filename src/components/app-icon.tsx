import Image from "next/image";
import { cn } from "@/lib/utils";

type AppIconProps = {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl",
};

export function AppIcon({
  name,
  logoUrl,
  size = "md",
  className,
}: AppIconProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={`${name} icon`}
        width={64}
        height={64}
        className={cn(
          "rounded-xl border border-border bg-surface object-cover",
          sizeMap[size],
          className,
        )}
        unoptimized
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl border border-border bg-surface-muted font-semibold text-foreground",
        sizeMap[size],
        className,
      )}
      role="img"
      aria-label={`${name} icon`}
    >
      {initial}
    </div>
  );
}
