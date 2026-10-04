import { parseGitHubRepoPath, parseGitLabRepoPath } from "./repo-path";

export type RepoFileFetchResult =
  | { ok: true; content: string }
  | { ok: false; reason: string };

export type RepoVerificationProvider = {
  id: "github" | "gitlab";
  fetchTextFile(repositoryUrl: string, relativePath: string): Promise<RepoFileFetchResult>;
};

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

async function fetchGitHubRaw(
  owner: string,
  repo: string,
  relativePath: string,
): Promise<RepoFileFetchResult> {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${relativePath}`;
  const res = await fetch(apiUrl, { headers: githubHeaders() });
  if (res.status === 404) {
    return { ok: false, reason: "File not found in repository" };
  }
  if (!res.ok) {
    return { ok: false, reason: `GitHub API error (${res.status})` };
  }
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (data.encoding !== "base64" || !data.content) {
    return { ok: false, reason: "Unexpected GitHub contents response" };
  }
  const content = Buffer.from(data.content, "base64").toString("utf8");
  return { ok: true, content };
}

async function fetchGitLabRaw(
  projectPath: string,
  relativePath: string,
): Promise<RepoFileFetchResult> {
  const encodedProject = encodeURIComponent(projectPath);
  const filePath = encodeURIComponent(relativePath);
  const url = `https://gitlab.com/api/v4/projects/${encodedProject}/repository/files/${filePath}/raw?ref=HEAD`;
  const res = await fetch(url);
  if (res.status === 404) {
    return { ok: false, reason: "File not found in repository" };
  }
  if (!res.ok) {
    return { ok: false, reason: `GitLab API error (${res.status})` };
  }
  const content = await res.text();
  return { ok: true, content };
}

export const githubVerificationProvider: RepoVerificationProvider = {
  id: "github",
  async fetchTextFile(repositoryUrl, relativePath) {
    const parsed = parseGitHubRepoPath(repositoryUrl);
    if (!parsed) {
      return { ok: false, reason: "Not a GitHub repository URL" };
    }
    return fetchGitHubRaw(parsed.owner, parsed.repo, relativePath);
  },
};

export const gitlabVerificationProvider: RepoVerificationProvider = {
  id: "gitlab",
  async fetchTextFile(repositoryUrl, relativePath) {
    const parsed = parseGitLabRepoPath(repositoryUrl);
    if (!parsed) {
      return { ok: false, reason: "Not a GitLab repository URL" };
    }
    return fetchGitLabRaw(parsed.projectPath, relativePath);
  },
};

export function resolveVerificationProvider(
  repositoryUrl: string,
): RepoVerificationProvider | null {
  if (parseGitHubRepoPath(repositoryUrl)) return githubVerificationProvider;
  if (parseGitLabRepoPath(repositoryUrl)) return gitlabVerificationProvider;
  return null;
}

export const VERIFICATION_FILE_PATH = ".opensourceapp/verification";
export const APP_SVG_PATH = ".opensourceapp/app.svg";
