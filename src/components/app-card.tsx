import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { LicenseBadge } from "@/components/badges/license-badge";
import { PlatformBadge } from "@/components/badges/platform-badge";
import { VerificationBadge } from "@/components/badges/verification-badge";
import { Badge } from "@/components/ui/badge";
import { hasActiveLicenseSignal } from "@/lib/applications/verification-display";
import { getUpdateHighlight } from "@/lib/applications/update-highlight";
import type { VerificationSignalType } from "@/generated/prisma";
import { cn } from "@/lib/utils";

type AppCardProps = {
  slug: string;
  name: string;
  tagline?: string | null;
  logoUrl?: string | null;
  primaryLanguage?: string | null;
  stars?: number | null;
  updatedAt?: Date;
  latestReleaseTag?: string | null;
  latestReleaseAt?: Date | null;
  lastCommitAt?: Date | null;
  categories?: { category: { name: string } }[];
  platforms?: { platform: { name: string } }[];
  licenses?: { license: { name: string; spdxId?: string | null } }[];
  signals?: { type: VerificationSignalType; status: string }[];
  className?: string;
};

export function AppCard({
  slug,
  name,
  tagline,
  logoUrl,
  primaryLanguage,
  stars,
  updatedAt,
  latestReleaseTag,
  latestReleaseAt,
  lastCommitAt,
  categories = [],
  platforms = [],
  licenses = [],
  signals = [],
  className,
}: AppCardProps) {
  const activeSignals = signals.filter((s) => s.status === "ACTIVE");
  const licenseVerified = hasActiveLicenseSignal(activeSignals);
  const highlight =
    updatedAt &&
    getUpdateHighlight({
      name,
      slug,
      updatedAt,
      latestReleaseTag,
      latestReleaseAt,
      lastCommitAt,
    });

  const releaseLine =
    latestReleaseTag && latestReleaseAt
      ? `${latestReleaseTag} · ${highlight?.detail ?? ""}`
      : null;

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
            <VerificationBadge
              verified={activeSignals.length > 0}
              label="Verified"
            />
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
          {licenses[0] && (
            <span className="inline-flex flex-wrap items-center gap-1">
              <LicenseBadge
                name={licenses[0].license.name}
                spdxId={licenses[0].license.spdxId}
              />
              {!licenseVerified && (
                <span className="text-[10px] uppercase tracking-wide">
                  Declared
                </span>
              )}
            </span>
          )}
          {platforms.slice(0, 3).map((p) => (
            <PlatformBadge key={p.platform.name} name={p.platform.name} />
          ))}
          {primaryLanguage && (
            <Badge variant="outline" className="font-normal">
              {primaryLanguage}
            </Badge>
          )}
          {typeof stars === "number" && stars > 0 && (
            <span className="font-mono">★ {stars.toLocaleString()}</span>
          )}
        </div>
        {(releaseLine || highlight) && (
          <p className="text-xs text-muted-foreground">
            {releaseLine ?? `${highlight?.reason} · ${highlight?.detail}`}
          </p>
        )}
      </div>
    </Link>
  );
}
