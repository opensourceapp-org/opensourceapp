# Admin application management

Admins can manage directory listings at **`/admin/applications`** (link from **Admin → Manage applications**).

## Access

- Requires **ADMIN** role (moderators use the submission queue at `/admin` only).
- All server actions reject non-admins with `Admin access required`.

## Routes

| Route | Purpose |
|-------|---------|
| `/admin/applications` | Search/filter list, bulk delete |
| `/admin/applications/[id]` | Full listing detail |
| `/admin/applications/[id]/edit` | Edit fields and taxonomy |

## Delete behavior

- **Single** and **bulk** delete are **soft deletes**: `deletedAt` / `deletedById` on `Application`.
- Soft-deleted apps are hidden from `/apps`, search, sitemap, and bulk-import duplicate checks.
- Actions are recorded in `AuditLog` as `application.deleted` or `application.updated`.

## Edit validation

- Zod schema in `src/lib/validation/admin-application.ts` (max 3 categories, max 10 alternatives, GitHub/GitLab repository URL, etc.).
