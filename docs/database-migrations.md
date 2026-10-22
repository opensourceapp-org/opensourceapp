# Database migrations

## Commands

| Command | When to use |
|--------|-------------|
| `npm run db:migrate:deploy` | **Production / shared Postgres** (e.g. Prisma Data Platform). Applies pending migrations to your real database. Does **not** use a shadow database. |
| `npm run db:migrate` | **Local development** only (`prisma migrate dev`). Creates/applies migrations and uses a shadow DB to replay history. |
| `npm run db:push` | Quick local sync when you do not need migration history (prototyping). |

Do **not** pass a migration folder name to `npm run db:migrate` — that is not how you apply a single migration.

## Existing database (schema already created via `db push` or an older deploy)

If tables already exist and you only need Prisma Migrate to track state:

```bash
npx prisma migrate resolve --applied 20251023000000_init
```

Then use `npm run db:migrate:deploy` for any **new** migrations added after the squash.

## Fresh database

```bash
npm run db:migrate:deploy
npm run db:seed
```

## Shadow database error (P3006 / `SubmissionStatus` does not exist)

Older incremental migrations assumed a schema created outside Migrate. The repo now uses a single baseline migration `20251023000000_init`. Historical SQL files live under `prisma/migrations_legacy/` for reference only.

If `migrate dev` still fails locally, use `db:push` or point `SHADOW_DATABASE_URL` at a disposable Postgres database.

## One-off column (emergency)

If you only need `videoUrl` before running resolve/deploy:

```sql
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
```

Then mark the baseline as applied (see above).
