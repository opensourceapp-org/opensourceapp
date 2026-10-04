export function parseGitHubRepoPath(
  url: string,
): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.replace(/^www\./i, "").endsWith("github.com")) {
      return null;
    }
    const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
    if (!owner || !repo) return null;
    return { owner, repo: repo.replace(/\.git$/i, "") };
  } catch {
    return null;
  }
}

export function parseGitLabRepoPath(
  url: string,
): { projectPath: string } | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (host !== "gitlab.com" && !host.endsWith(".gitlab.com")) {
      return null;
    }
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return null;
    const last = segments[segments.length - 1].replace(/\.git$/i, "");
    const projectPath = [...segments.slice(0, -1), last].join("/");
    return { projectPath: decodeURIComponent(projectPath) };
  } catch {
    return null;
  }
}
