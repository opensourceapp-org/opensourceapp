import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { LicenseBadge } from "@/components/badges/license-badge";
import { PlatformBadge } from "@/components/badges/platform-badge";
import { VerificationBadge } from "@/components/badges/verification-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AppCardProps = {
  slug: string;
  name: string;
  tagline?: string | null;
  logoUrl?: string | null;
  primaryLanguage?: string | null;
  stars?: number | null;
  categories?: { category: { name: string } }[];
  platforms?: { platform: { name: string } }[];
  licenses?: { license: { name: string; spdxId?: string | null } }[];
  verified?: boolean;
  className?: string;
};

export function AppCard({
  slug,
  name,
  tagline,
  logoUrl,
  primaryLanguage,
  stars,
  categories = [],
  platforms = [],
  licenses = [],
  verified = false,
  className,
}: AppCardProps) {
  return (
    <Link
      href={`/apps/${slug}`}
      className={cn(
        "group flex h-full flex-col rounded-xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-primary/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="flex gap-4">
        <AppIcon name={name} logoUrl={logoUrl} size="md" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium leading-snug group-hover:text-primary">
              {name}
            </h3>
            <VerificationBadge verified={verified} />
          </div>
          {tagline && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {tagline}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col justify-end gap-3">
        <div className="flex flex-wrap gap-1.5">
          {categories.slice(0, 2).map((c) => (
            <Badge key={c.category.name} variant="secondary" className="font-normal">
              {c.category.name}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {platforms.slice(0, 3).map((p) => (
            <PlatformBadge key={p.platform.name} name={p.platform.name} />
          ))}
          {licenses[0] && (
            <LicenseBadge
              name={licenses[0].license.name}
              spdxId={licenses[0].license.spdxId}
            />
          )}
          {primaryLanguage && (
            <Badge variant="outline" className="font-normal">
              {primaryLanguage}
            </Badge>
          )}
          {typeof stars === "number" && stars > 0 && (
            <span className="ml-auto font-mono text-xs">
              ★ {stars.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
