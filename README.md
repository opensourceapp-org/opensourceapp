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

## Newsletter sign-ups

Footer subscriptions are stored in PostgreSQL (`NewsletterSubscriber`). No email provider is required for the MVP — run migrations after pulling (`npm run db:migrate` or `npm run db:push`).

To send campaigns later, export subscribers from the database or sync to an ESP (Resend, Postmark, Mailchimp, etc.) using your provider’s API key in environment variables; that integration is not wired in this repo yet.

Architecture overview for the MVP lives in the project docs (`mvp-architecture.md`).
