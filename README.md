# OpenSourceApp.org

Modern directory and discovery platform for open-source software.

## Stack

Next.js (App Router), TypeScript, PostgreSQL, Prisma, Tailwind CSS, shadcn/ui, Auth.js, Zod.

## Getting started

1. Copy `.env.example` to `.env` and fill in values.
2. Start PostgreSQL: `docker compose up -d db`
3. Apply schema: `npm run db:push` (or `npm run db:migrate`)
4. Seed reference data: `npm run db:seed`
5. Run dev server: `npm run dev`

## Scripts

- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript
- `npm run test` — Vitest unit tests

Architecture overview for the MVP lives in the project docs (`mvp-architecture.md`).
