import { repoMetadataSchema } from "@/lib/validation/submission";

export type RepoMetadata = ReturnType<typeof repoMetadataSchema.parse>;

function parseGitHubRepoUrl(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.replace("www.", "").endsWith("github.com")) {
      return null;
    }
    const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
    if (!owner || !repo) return null;
    return { owner, repo: repo.replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

export async function fetchRepositoryMetadata(
  repositoryUrl: string,
): Promise<RepoMetadata> {
  const gh = parseGitHubRepoUrl(repositoryUrl);
  if (!gh) {
    return repoMetadataSchema.parse({
      name: "Unknown",
      description: null,
      homepageUrl: null,
      defaultBranch: null,
      stars: null,
      forks: null,
      primaryLanguage: null,
      lastCommitAt: null,
      host: "unknown",
    });
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(
    `https://api.github.com/repos/${gh.owner}/${gh.repo}`,
    { headers, next: { revalidate: 300 } },
  );

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const data = (await res.json()) as {
    name: string;
    description: string | null;
    homepage: string | null;
    default_branch: string;
    stargazers_count: number;
    forks_count: number;
    language: string | null;
    pushed_at: string | null;
  };

  return repoMetadataSchema.parse({
    name: data.name,
    description: data.description,
    homepageUrl: data.homepage || null,
    defaultBranch: data.default_branch,
    stars: data.stargazers_count,
    forks: data.forks_count,
    primaryLanguage: data.language,
    lastCommitAt: data.pushed_at,
    host: "github",
    raw: { owner: gh.owner, repo: gh.repo },
  });
}
