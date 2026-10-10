# Bulk import — valid Excel values

Import checks every slug against what exists in the database after `npm run db:seed`. Unknown slugs produce per-row errors in **Preview**.

See also: [Admin bulk import](./admin-bulk-import.md) (workflow and column list).

## Required columns (every row)

| Column | Rule |
|--------|------|
| `name` | 2–120 characters |
| `description` | At least 20 characters |
| `repository_url` | Full `https://github.com/...` or GitLab URL |

## Optional — leave blank or use exact slugs

### `license_slug` (one value)

- `mit`
- `apache-2`
- `gpl-3`

**Not in seed (will fail):** `mpl-2.0`, `agpl-3.0`, `gpl-2.0`, `gpl-3.0`, `bsd-3-clause`, `lgpl-2.1`, `unlicense`, `postgresql`, `public-domain`

### `platform_slugs` (comma-separated)

- `web`
- `linux`
- `macos`
- `windows`
- `docker`

**Not in seed:** `android`, `ios`

### `tag_slugs` (comma-separated)

- `self-hosted`
- `cli`

**Recommendation:** leave `tag_slugs` empty for large imports until more tags are added to seed.

### `category_slugs` (comma-separated, max 3)

Must match seeded categories (`prisma/data/categories.json`). Slugs are lowercase with hyphens (`slugify` of the category name).

| Common mistake in spreadsheets | Use this slug |
|--------------------------------|---------------|
| browsers | `browser` |
| design-tools | `design` |
| productivity | `notetaking`, `project-management` |
| media | `video`, `streaming`, `music` |
| security | `cybersecurity`, `password-managers` |
| networking | `vpn` |
| social | `social-media` |
| web-development | `developer-tools`, `cms` |
| backend | `backend-service` |
| games | `gaming` |
| monitoring | `observability-and-monitoring` |
| databases | `database`, `graph-database` |
| data-tools | `elt-etl`, `analytics` |
| ai-tools | `ml-ops` |
| file-sync / file-sharing | `cloud-storage`, `file-hosting` |

#### Full category slug list (63)

```
developer-tools
communication
database
cybersecurity
automation
e-commerce
documentation
video
notetaking
design
analytics
cms
project-management
social-media
auth-sso
password-managers
internal-tool
product-management
api-platform
crm
enterprise-search
observability-and-monitoring
community
music
platform-as-a-service
gaming
deployment
backend-service
cloud
utilities
finances
scheduling
visual-database
metric-store
email-marketing
streaming
remote-desktop
ml-ops
cloud-storage
elt-etl
3d-modelling
vpn
file-hosting
blogging
form-builder
customer-data
browser
customer-engagement
link-shortener
erp
log-management
kyc
accounting
robotic-process-automation-rpa
reverse-etl
smart-home
voicechat
food
os
business-intelligence
web-mapping-platform
virtual-space
graph-database
```

### `alternative_software_slugs`

Only works if that software record already exists in the database. Usually leave empty.

## Fastest way to pass validation

1. Set `name`, `description`, `repository_url` on every row.
2. Set `license_slug` to `mit`, `apache-2`, or `gpl-3`, or leave blank.
3. Set `platform_slugs` to e.g. `web,linux`, or leave blank.
4. Leave `tag_slugs` blank unless using `self-hosted` or `cli`.
5. Set `category_slugs` from the list above (≤3), or leave blank.

Then **Preview** → **Confirm import** on `/admin/bulk-import`.

## Extending the catalog

To accept values such as `android`, `ios`, MPL/AGPL licenses, or custom tags without editing spreadsheets, extend `prisma/seed.ts` (idempotent upserts) and re-run `npm run db:seed`.
