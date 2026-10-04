export type RepositoryHealthInput = {
  repositoryUrl: string;
  repositoryHost?: string | null;
  stars?: number | null;
  forks?: number | null;
  openIssuesCount?: number | null;
  lastCommitAt?: Date | null;
  defaultBranch?: string | null;
};

export function repositoryActivityLabel(
  lastCommitAt?: Date | null,
): "Active" | "Quiet" | "Unknown" {
  if (!lastCommitAt) return "Unknown";
  const days = (Date.now() - lastCommitAt.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 90) return "Active";
  if (days <= 365) return "Quiet";
  return "Quiet";
}

export function formatRepositoryHealth(app: RepositoryHealthInput) {
  return {
    activity: repositoryActivityLabel(app.lastCommitAt),
    stars: app.stars ?? null,
    forks: app.forks ?? null,
    openIssues: app.openIssuesCount ?? null,
    lastCommitAt: app.lastCommitAt ?? null,
    defaultBranch: app.defaultBranch ?? null,
  };
}
