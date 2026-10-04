export type ApplicationUpdateFields = {
  name: string;
  slug: string;
  updatedAt: Date;
  latestReleaseTag?: string | null;
  latestReleaseAt?: Date | null;
  lastCommitAt?: Date | null;
};

export type UpdateHighlight = {
  reason: string;
  detail: string;
  occurredAt: Date;
};

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}

/** Pick the most meaningful public update reason for homepage lists. */
export function getUpdateHighlight(
  app: ApplicationUpdateFields,
): UpdateHighlight {
  if (app.latestReleaseTag && app.latestReleaseAt) {
    return {
      reason: `${app.latestReleaseTag} released`,
      detail: formatRelative(app.latestReleaseAt),
      occurredAt: app.latestReleaseAt,
    };
  }
  if (app.lastCommitAt) {
    return {
      reason: "Repository activity detected",
      detail: formatRelative(app.lastCommitAt),
      occurredAt: app.lastCommitAt,
    };
  }
  return {
    reason: "Listing updated",
    detail: formatRelative(app.updatedAt),
    occurredAt: app.updatedAt,
  };
}
