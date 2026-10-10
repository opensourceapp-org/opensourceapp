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

const pixelMap = {
  sm: 36,
  md: 48,
  lg: 64,
};

function shouldUseNativeImageTag(src: string): boolean {
  if (src.startsWith("data:")) return true;
  try {
    const { hostname, protocol } = new URL(src);
    if (protocol !== "https:" && protocol !== "http:") return true;
    const allowedHosts = [
      "avatars.githubusercontent.com",
      "raw.githubusercontent.com",
      "gitlab.com",
      "codeberg.org",
    ];
    if (allowedHosts.some((h) => hostname === h || hostname.endsWith(`.${h}`))) {
      return false;
    }
    if (hostname.endsWith(".githubusercontent.com")) return false;
    if (hostname.endsWith(".gitlab.io")) return false;
    return true;
  } catch {
    return true;
  }
}

export function AppIcon({
  name,
  logoUrl,
  size = "md",
  className,
}: AppIconProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const sizeClass = sizeMap[size];
  const pixels = pixelMap[size];

  if (logoUrl) {
    const imageClass = cn(
      "rounded-xl border border-border bg-surface object-cover",
      sizeClass,
      className,
    );

    if (shouldUseNativeImageTag(logoUrl)) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-provided icon URLs
        <img
          src={logoUrl}
          alt={`${name} icon`}
          width={pixels}
          height={pixels}
          className={imageClass}
          loading="lazy"
          decoding="async"
        />
      );
    }

    return (
      <Image
        src={logoUrl}
        alt={`${name} icon`}
        width={pixels}
        height={pixels}
        className={imageClass}
        unoptimized
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl border border-border bg-surface-muted font-semibold text-foreground",
        sizeClass,
        className,
      )}
      role="img"
      aria-label={`${name} icon`}
    >
      {initial}
    </div>
  );
}
