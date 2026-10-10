# Admin bulk import (Excel)

Admins can create directory listings in bulk from a spreadsheet at **`/admin/bulk-import`**.

## Access

- Requires **ADMIN** role (moderators use the normal submission queue at `/admin`).
- Link: **Admin → Bulk import apps** (visible only to admins).

## Workflow

1. Download the **`.xlsx` template** from the bulk import page.
2. Fill one row per application (delete the example row).
3. Upload the file and **Preview** — valid and invalid rows are shown with per-row errors.
4. **Confirm import** creates `Application` records and relations; published rows get `publishedAt` set immediately (no fake submission flow).

## Spreadsheet columns

| Column | Required | Notes |
|--------|----------|--------|
| `name` | yes | 2–120 characters |
| `slug` | no | Auto-generated from `name` when blank |
| `tagline` | no | Max 200 characters |
| `description` | yes | 20–10,000 characters |
| `homepage_url` | no | HTTPS URL |
| `repository_url` | yes | GitHub or GitLab |
| `repository_host` | no | `github` or `gitlab`; inferred from URL |
| `default_branch` | no | e.g. `main` |
| `primary_language` | no | |
| `stars` | no | Non-negative integer |
| `forks` | no | Non-negative integer |
| `open_issues_count` | no | Non-negative integer |
| `last_commit_at` | no | ISO 8601 datetime |
| `logo_url` | no | Image URL |
| `latest_release_tag` | no | |
| `latest_release_at` | no | ISO 8601 datetime |
| `latest_release_url` | no | URL |
| `category_slugs` | no | Comma-separated, max 3 (approved category slugs) |
| `license_slug` | no | Catalog slug (e.g. `mit`) |
| `platform_slugs` | no | Comma-separated platform slugs |
| `tag_slugs` | no | Comma-separated tag slugs |
| `alternative_software_slugs` | no | Comma-separated software slugs (max 10) |
| `publish` | no | `true`/`yes`/`1` to publish; `false`/`no`/`0` for draft. Defaults to **true** when blank |

Row 1 of the **Applications** sheet must be the header row. Row 2 documents each column; data starts on row 3.

## Validation rules

- Repository URLs are normalized for duplicate detection against existing applications and active submissions.
- Duplicate `repository_url` or `slug` within the file is rejected.
- Unknown category, license, platform, tag, or alternative slugs produce row errors.

## Valid slug reference

Allowed **license**, **platform**, **tag**, and **category** slugs (from seed data), plus common spreadsheet mistakes: **[bulk-import-valid-values.md](./bulk-import-valid-values.md)**.
