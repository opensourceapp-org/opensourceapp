export type RepoHost = "github" | "gitlab" | "codeberg" | "other";

export function detectRepoHost(url: string): RepoHost {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "github.com") return "github";
    if (host === "gitlab.com" || host.endsWith(".gitlab.com")) return "gitlab";
    if (host === "codeberg.org") return "codeberg";
    return "other";
  } catch {
    return "other";
  }
}

export function repoHostLabel(host: RepoHost): string {
  switch (host) {
    case "github":
      return "GitHub";
    case "gitlab":
      return "GitLab";
    case "codeberg":
      return "Codeberg";
    default:
      return "Repository";
  }
}
