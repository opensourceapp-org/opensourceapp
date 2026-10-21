import { filterScreenshotFilenames } from "@/lib/validation/screenshot-urls";
import { parseGitHubRepoPath, parseGitLabRepoPath } from "./repo-path";

export type RepoFileFetchResult =
  | { ok: true; content: string }
  | { ok: false; reason: string };

export type RepoVerificationProvider = {
  id: "github" | "gitlab";
  fetchTextFile(
    repositoryUrl: string,
    relativePath: string,
  ): Promise<RepoFileFetchResult>;
  listScreenshotFiles(repositoryUrl: string): Promise<string[]>;
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

type GitHubContentEntry = {
  name?: string;
  type?: string;
  download_url?: string | null;
};

async function listGitHubDirectory(
  owner: string,
  repo: string,
  relativePath: string,
): Promise<string[]> {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${relativePath}`;
  const res = await fetch(apiUrl, { headers: githubHeaders() });
  if (res.status === 404) {
    return [];
  }
  if (!res.ok) {
    return [];
  }
  const data = (await res.json()) as GitHubContentEntry[] | GitHubContentEntry;
  const entries = Array.isArray(data) ? data : [];
  const names = filterScreenshotFilenames(
    entries
      .filter((e) => e.type === "file" && e.name)
      .map((e) => e.name as string),
  );
  const urls: string[] = [];
  for (const name of names) {
    const entry = entries.find((e) => e.name === name);
    if (entry?.download_url) {
      urls.push(entry.download_url);
    } else {
      urls.push(
        `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${relativePath}/${name}`,
      );
    }
    if (urls.length >= 20) break;
  }
  return urls;
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

type GitLabTreeEntry = {
  name?: string;
  type?: string;
  path?: string;
};

async function listGitLabDirectory(
  projectPath: string,
  relativePath: string,
): Promise<string[]> {
  const encodedProject = encodeURIComponent(projectPath);
  const pathParam = encodeURIComponent(relativePath);
  const url = `https://gitlab.com/api/v4/projects/${encodedProject}/repository/tree?path=${pathParam}&ref=HEAD&per_page=20`;
  const res = await fetch(url);
  if (res.status === 404 || !res.ok) {
    return [];
  }
  const entries = (await res.json()) as GitLabTreeEntry[];
  const names = filterScreenshotFilenames(
    entries
      .filter((e) => e.type === "blob" && e.name)
      .map((e) => e.name as string),
  );
  const urls: string[] = [];
  for (const name of names) {
    const filePath = `${relativePath}/${name}`;
    const rawUrl = `https://gitlab.com/${projectPath}/-/raw/HEAD/${filePath}`;
    urls.push(rawUrl);
    if (urls.length >= 20) break;
  }
  return urls;
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
  async listScreenshotFiles(repositoryUrl) {
    const parsed = parseGitHubRepoPath(repositoryUrl);
    if (!parsed) return [];
    return listGitHubDirectory(
      parsed.owner,
      parsed.repo,
      SCREENSHOTS_DIR_PATH,
    );
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
  async listScreenshotFiles(repositoryUrl) {
    const parsed = parseGitLabRepoPath(repositoryUrl);
    if (!parsed) return [];
    return listGitLabDirectory(parsed.projectPath, SCREENSHOTS_DIR_PATH);
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
export const SCREENSHOTS_DIR_PATH = ".opensourceapp/screenshots";
