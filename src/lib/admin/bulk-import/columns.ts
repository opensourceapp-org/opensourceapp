/** Spreadsheet column keys (row 1 headers) and human documentation for the template. */
export const BULK_IMPORT_COLUMNS = [
  {
    key: "name",
    header: "name",
    required: true,
    description: "Application display name (2–120 characters).",
  },
  {
    key: "slug",
    header: "slug",
    required: false,
    description: "URL slug; leave blank to auto-generate from name.",
  },
  {
    key: "tagline",
    header: "tagline",
    required: false,
    description: "Short subtitle (max 200 characters).",
  },
  {
    key: "description",
    header: "description",
    required: true,
    description: "Full listing description (20–10,000 characters).",
  },
  {
    key: "homepage_url",
    header: "homepage_url",
    required: false,
    description: "Project homepage (https URL).",
  },
  {
    key: "repository_url",
    header: "repository_url",
    required: true,
    description: "GitHub or GitLab repository URL.",
  },
  {
    key: "repository_host",
    header: "repository_host",
    required: false,
    description: "github or gitlab; inferred from URL when blank.",
  },
  {
    key: "default_branch",
    header: "default_branch",
    required: false,
    description: "Default git branch (e.g. main).",
  },
  {
    key: "primary_language",
    header: "primary_language",
    required: false,
    description: "Primary programming language.",
  },
  {
    key: "stars",
    header: "stars",
    required: false,
    description: "GitHub/GitLab star count (non-negative integer).",
  },
  {
    key: "forks",
    header: "forks",
    required: false,
    description: "Fork count (non-negative integer).",
  },
  {
    key: "open_issues_count",
    header: "open_issues_count",
    required: false,
    description: "Open issues count (non-negative integer).",
  },
  {
    key: "last_commit_at",
    header: "last_commit_at",
    required: false,
    description: "Last commit timestamp (ISO 8601, e.g. 2025-01-15T12:00:00Z).",
  },
  {
    key: "logo_url",
    header: "logo_url",
    required: false,
    description: "Logo image URL when not using repo icon.",
  },
  {
    key: "latest_release_tag",
    header: "latest_release_tag",
    required: false,
    description: "Latest release tag name.",
  },
  {
    key: "latest_release_at",
    header: "latest_release_at",
    required: false,
    description: "Latest release date (ISO 8601).",
  },
  {
    key: "latest_release_url",
    header: "latest_release_url",
    required: false,
    description: "URL to latest release page.",
  },
  {
    key: "category_slugs",
    header: "category_slugs",
    required: false,
    description: "Comma-separated category slugs (max 3, at least 1 recommended).",
  },
  {
    key: "license_slug",
    header: "license_slug",
    required: false,
    description: "License slug from directory catalog (e.g. mit, apache-2).",
  },
  {
    key: "platform_slugs",
    header: "platform_slugs",
    required: false,
    description: "Comma-separated platform slugs (e.g. web, linux, docker).",
  },
  {
    key: "tag_slugs",
    header: "tag_slugs",
    required: false,
    description: "Comma-separated tag slugs (e.g. self-hosted, cli).",
  },
  {
    key: "alternative_software_slugs",
    header: "alternative_software_slugs",
    required: false,
    description: "Comma-separated software slugs listed as alternatives.",
  },
  {
    key: "publish",
    header: "publish",
    required: false,
    description: "true/yes/1 to publish immediately; false/no/0 for draft (unpublished). Defaults to true when blank.",
  },
] as const;

export const BULK_IMPORT_HEADER_ROW = BULK_IMPORT_COLUMNS.map((c) => c.header);

export type BulkImportColumnKey = (typeof BULK_IMPORT_COLUMNS)[number]["key"];
