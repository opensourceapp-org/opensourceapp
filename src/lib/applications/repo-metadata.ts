import { suggestHomepageIconUrl } from "@/lib/applications/site-icon-suggest";
import { repoMetadataSchema } from "@/lib/validation/submission";

export type RepoMetadata = ReturnType<typeof repoMetadataSchema.parse>;

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

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

function parseGitLabRepoUrl(url: string): { projectPath: string } | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "gitlab.com" && !host.endsWith(".gitlab.com")) {
      return null;
    }
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return null;
    const last = segments[segments.length - 1].replace(/\.git$/, "");
    const projectPath = [...segments.slice(0, -1), last].join("/");
    return { projectPath: decodeURIComponent(projectPath) };
  } catch {
    return null;
  }
}

type LicenseFields = {
  licenseSpdxId: string | null;
  licenseKey: string | null;
  licenseName: string | null;
};

function emptyMetadata(host: "github" | "gitlab" | "unknown"): RepoMetadata {
  return repoMetadataSchema.parse({
    name: "Unknown",
    description: null,
    homepageUrl: null,
    defaultBranch: null,
    stars: null,
    forks: null,
    primaryLanguage: null,
    lastCommitAt: null,
    host,
    licenseSpdxId: null,
    licenseKey: null,
    licenseName: null,
    suggestedLogoUrl: null,
  });
}

async function resolveSuggestedLogoUrl(
  hostAvatarUrl: string | null,
  homepageUrl: string | null,
): Promise<string | null> {
  if (hostAvatarUrl) return hostAvatarUrl;
  return suggestHomepageIconUrl(homepageUrl);
}

async function fetchGitHubMetadata(
  owner: string,
  repo: string,
): Promise<RepoMetadata> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers: githubHeaders(), next: { revalidate: 300 } },
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
    private?: boolean;
    archived?: boolean;
    owner?: { avatar_url?: string | null };
    license?: {
      key: string;
      name: string;
      spdx_id: string | null;
    } | null;
  };

  const license: LicenseFields = {
    licenseSpdxId: data.license?.spdx_id ?? null,
    licenseKey: data.license?.key ?? null,
    licenseName: data.license?.name ?? null,
  };

  const homepageUrl = data.homepage || null;
  const suggestedLogoUrl = await resolveSuggestedLogoUrl(
    data.owner?.avatar_url ?? null,
    homepageUrl,
  );

  return repoMetadataSchema.parse({
    name: data.name,
    description: data.description,
    homepageUrl,
    defaultBranch: data.default_branch,
    stars: data.stargazers_count,
    forks: data.forks_count,
    primaryLanguage: data.language,
    lastCommitAt: data.pushed_at,
    host: "github",
    suggestedLogoUrl,
    ...license,
    raw: { owner, repo, private: data.private ?? false, archived: data.archived ?? false },
  });
}

async function fetchGitLabMetadata(projectPath: string): Promise<RepoMetadata> {
  const encoded = encodeURIComponent(projectPath);
  const res = await fetch(`https://gitlab.com/api/v4/projects/${encoded}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`GitLab API error: ${res.status}`);
  }

  const data = (await res.json()) as {
    name: string;
    description: string | null;
    web_url: string;
    default_branch: string;
    star_count: number;
    forks_count: number;
    last_activity_at: string | null;
    avatar_url?: string | null;
    license?: {
      key: string;
      name: string;
      nickname?: string | null;
    } | null;
  };

  const license: LicenseFields = {
    licenseSpdxId: data.license?.nickname ?? null,
    licenseKey: data.license?.key ?? null,
    licenseName: data.license?.name ?? null,
  };

  const homepageUrl = data.web_url || null;
  const suggestedLogoUrl = await resolveSuggestedLogoUrl(
    data.avatar_url ?? null,
    homepageUrl,
  );

  return repoMetadataSchema.parse({
    name: data.name,
    description: data.description,
    homepageUrl,
    defaultBranch: data.default_branch,
    stars: data.star_count,
    forks: data.forks_count,
    primaryLanguage: null,
    lastCommitAt: data.last_activity_at,
    host: "gitlab",
    suggestedLogoUrl,
    ...license,
    raw: { projectPath },
  });
}

export async function fetchRepositoryMetadata(
  repositoryUrl: string,
): Promise<RepoMetadata> {
  const gh = parseGitHubRepoUrl(repositoryUrl);
  if (gh) {
    return fetchGitHubMetadata(gh.owner, gh.repo);
  }

  const gl = parseGitLabRepoUrl(repositoryUrl);
  if (gl) {
    return fetchGitLabMetadata(gl.projectPath);
  }

  return emptyMetadata("unknown");
}

export function licenseSlugFromRepoMetadataJson(
  repoMetadataJson: unknown,
): string | null {
  if (!repoMetadataJson || typeof repoMetadataJson !== "object") return null;
  const slug = (repoMetadataJson as { licenseSlug?: unknown }).licenseSlug;
  return typeof slug === "string" && slug.length > 0 ? slug : null;
}
