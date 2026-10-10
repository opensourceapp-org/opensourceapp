# Admin application management

Admins can manage directory listings at **`/admin/applications`** (link from **Admin → Manage applications**).

## Access

- Requires **ADMIN** role (moderators use the submission queue at `/admin` only).
- All server actions reject non-admins with `Admin access required`.
- **Restore** and **hard delete** are enforced server-side for **ADMIN** only (same gate as other application actions).

## Routes

| Route | Purpose |
|-------|---------|
| `/admin/applications` | Active list, trash tab, search/filter, bulk actions |
| `/admin/applications?view=deleted` | Soft-deleted listings (trash) |
| `/admin/applications/[id]` | Full listing detail (active or trash) |
| `/admin/applications/[id]/edit` | Edit fields and taxonomy (active or trash) |

## List tabs

- **Active** — non-deleted applications (default).
- **Deleted (trash)** — soft-deleted rows with **Deleted at** and **Deleted by** (name/email when available).

## Delete behavior

Single and bulk delete dialogs offer:

1. **Soft delete** (default) — sets `deletedAt` / `deletedById`; hidden from `/apps`, search, sitemap, and bulk-import duplicate checks; appears under trash.
2. **Hard delete** — permanently removes the `Application` row and cascaded relations in a transaction; unlinks any linked `Submission.applicationId` first. Requires checking **Permanently delete** in the UI.

Trash actions per row or in bulk:

- **Restore** — clears `deletedAt` / `deletedById`; published apps reappear on the public site when `publishedAt` is set.
- **Hard delete** — same safeguards as above.

Audit log actions: `application.deleted`, `application.restored`, `application.hard_deleted`, `application.updated`, `application.published`, `application.unpublished`.

## Publish and unpublish

On the **Active** tab, each row shows a **Published** or **Draft** badge and a **Publish** / **Unpublish** control (toggle `publishedAt`).

- **Publish** — sets `publishedAt` to now if unset, otherwise keeps the existing timestamp.
- **Unpublish** — sets `publishedAt` to `null` (draft stays in admin but is hidden on the public site).

Bulk actions **Publish selected** and **Unpublish selected** use the same rules with a confirmation dialog. Soft-deleted rows in trash cannot be published until **Restore** clears `deletedAt`.

Server actions (ADMIN only): `publishApplicationsAction(ids)`, `unpublishApplicationsAction(ids)`, plus single-row `publishApplicationAction` / `unpublishApplicationAction`. Successful changes revalidate `/apps`, `/sitemap.xml`, and admin application routes.

Public visibility uses `publishedApplicationWhere()` (`publishedAt` set and not soft-deleted) for directory search, app detail pages, and the sitemap.

## Edit validation

- Zod schema in `src/lib/validation/admin-application.ts` (max 3 categories, max 10 alternatives, GitHub/GitLab repository URL, etc.).
