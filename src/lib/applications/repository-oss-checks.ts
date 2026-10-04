import type { RepoMetadata } from "@/lib/applications/repo-metadata";

export type OssCheckStatus = "pass" | "warn" | "fail" | "unknown";

export type OssCheckLine = {
  id: "public" | "license" | "archived";
  label: string;
  status: OssCheckStatus;
  detail: string;
};

type GithubRepoFlags = {
  private?: boolean;
  archived?: boolean;
};

export function ossChecksFromMetadata(
  metadata: RepoMetadata | null,
  repoMetadataJson: unknown,
): OssCheckLine[] {
  const raw =
    metadata?.raw ??
    (repoMetadataJson &&
    typeof repoMetadataJson === "object" &&
    !Array.isArray(repoMetadataJson)
      ? (repoMetadataJson as { raw?: unknown }).raw
      : undefined);

  const flags =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as GithubRepoFlags)
      : {};

  const hasLicense =
    Boolean(metadata?.licenseSpdxId) ||
    Boolean(metadata?.licenseKey) ||
    Boolean(metadata?.licenseName) ||
    (repoMetadataJson &&
      typeof repoMetadataJson === "object" &&
      Boolean(
        (repoMetadataJson as { licenseSlug?: string }).licenseSlug?.length,
      ));

  const isPrivate = flags.private === true;
  const isArchived = flags.archived === true;

  return [
    {
      id: "public",
      label: "Public repository",
      status: isPrivate ? "fail" : metadata ? "pass" : "unknown",
      detail: isPrivate
        ? "Repository appears to be private"
        : metadata
          ? "Repository is reachable via the host API"
          : "Could not load repository metadata",
    },
    {
      id: "license",
      label: "Open-source license",
      status: hasLicense ? "pass" : metadata ? "warn" : "unknown",
      detail: hasLicense
        ? "A license was detected on the repository"
        : "No license detected — add one before publishing",
    },
    {
      id: "archived",
      label: "Not archived",
      status: isArchived ? "warn" : metadata ? "pass" : "unknown",
      detail: isArchived
        ? "Repository is marked archived on the host"
        : "Repository is not archived",
    },
  ];
}
