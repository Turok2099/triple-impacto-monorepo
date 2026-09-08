# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo shape

Turborepo monorepo with two apps under `apps/`:
- `apps/backend` — NestJS API (TypeScript, Express adapter)
- `apps/frontend` — Next.js 16 (App Router, React 19, Tailwind v4)

There is no shared `packages/` code yet. The apps are **not** wired together as npm workspaces (the root `package.json` has no `workspaces` field, and each app has its own `package-lock.json`/`node_modules`) — they're two independent npm projects that Turborepo orchestrates for `dev`/`build`/`lint`/`test`, tied together only by that orchestration and by the backend's HTTP API. Run `npm install` inside each app directory, not just at the root.

## Commands

Run from the repo root (fans out via Turborepo) or from inside `apps/backend` / `apps/frontend`.

```bash
npm run dev      # both apps: backend on :3000, frontend on :3001
npm run build    # turbo run build (backend depends on ^build)
npm run lint     # turbo run lint
npm run test     # turbo run test
```

Backend-only (`cd apps/backend`):

```bash
npm run dev              # nest start --watch
npm run test              # jest unit tests (spec files live next to source, rootDir: src)
npm run test -- <pattern> # run a single test file/suite, e.g. npm run test -- auth.service
npm run test:watch
npm run test:cov
npm run lint               # eslint --fix
npm run format             # prettier --write
```

Frontend-only (`cd apps/frontend`):

```bash
npm run dev     # next dev -p 3001
npm run build
npm run lint
```

The frontend has no `test` script configured — there's no test runner set up in `apps/frontend/package.json`. `npm run test` from the repo root effectively only runs backend tests via Turborepo.

There are also standalone debugging scripts in the backend (`npm run analizar-bonda`, `npm run test:fiserv-declined`, `npm run test:fiserv-connect`) used to manually probe the Bonda and Fiserv integrations outside of Jest.

## Architecture

### Backend (`apps/backend/src`)

Standard NestJS modular structure, one folder per domain under `modules/`, wired together in `app.module.ts`:

- `modules/auth` — JWT-based auth (Passport), registration/login/password reset.
- `modules/supabase` — **global module** wrapping the Supabase client (Postgres). `SupabaseService` is the single point of DB access for the rest of the app (user CRUD, donation records, Bonda operation logs, organization queries). It's marked `@Global()` so any module can inject it without importing `SupabaseModule` directly. Uses the `service_role_key` (full DB access, bypasses RLS) — this key must never reach the frontend.
- `modules/bonda` — integration with Bonda's coupon/loyalty platform (external SaaS for ONG coupons). Two logically separate external APIs are involved (Nóminas = user/affiliate management, Cuponera = coupon queries) — see `modules/bonda/README.md` and `.agents/knowledge/apis/Bonda/` for the credential/endpoint split; mixing up the two API keys is the most common integration bug here.
- `modules/payments` — Fiserv payment gateway integration (webhooks, subscription cron via `subscriptions.cron.ts`). Deep integration notes (REST manual, 3DS homologation, QR) live in `.agents/knowledge/apis/Fiserv/` and `.agents/knowledge/fiservqr/`.
- `modules/sync` — sync jobs (`ScheduleModule.forRoot()` cron infrastructure) that reconcile Supabase state with Bonda.
- `modules/admin` — super-admin panel endpoints.
- `modules/mail` — transactional email via Resend.
- `modules/newsletter`, `modules/public` — public-facing endpoints (organizations list, categories, newsletter signup) that don't require auth.
- `modules/example` exists on disk (generic CRUD controller/service scaffold) but is **not imported in `app.module.ts`** — it's unregistered boilerplate, not a live part of the app. Safe to ignore or remove; don't treat it as a domain module.
- `config/configuration.ts` — single source of typed env-var access (`ConfigService`), covering DB, JWT, Bonda, Supabase, Resend, and Fiserv (including Fiserv QR fields). New env vars should be added here rather than read via `process.env` ad hoc.

Data flow for the Bonda/coupon domain: frontend → backend `BondaModule` → external Bonda API, with results persisted to Supabase and read back through `SupabaseService`; `SyncModule` keeps Supabase in sync with Bonda state on a schedule. See `.agents/knowledge/database/INTEGRACION-BONDA.md` for the full picture of how this is wired.

### Frontend (`apps/frontend`)

Next.js App Router. Notable structure beyond the standard `app/`:

- `app/api/payments/fiserv/{success,error}/route.ts` — Next.js route handlers acting as Fiserv redirect/callback endpoints (separate from the backend's own payments webhook handling).
- `app/donar/[ongSlug]/` — dynamic donation flow per-organization.
- `app/dashboard/` — authenticated user area (profile, coupons).
- `contexts/AuthContext.tsx` — client-side auth/session state, backed by Supabase auth.
- `lib/` — one file per backend domain the frontend talks to (`bonda.ts`, `payments.ts`, `organizations.ts`, `admin.ts`, `dashboard.ts`, `partners.ts`) plus `supabaseClient.ts` for direct (anon-key) Supabase access from the client. Prefer adding new backend calls here rather than inlining `fetch` in components.
- `components/` is organized by feature area (`dashboard/`, `donar/`, `ong-landing-template/`, `sections/`, `pages/`, `shared/`).
- `docs/FLUJO-REGISTRO-BONDA.md` documents the registration flow that spans frontend → backend → Bonda/Supabase.

The frontend talks to the backend over HTTP (`NEXT_PUBLIC_API_URL`), and to Supabase directly for some reads/auth via the anon key — it never uses the service-role key.

### `.agents/` (local, gitignored)

Not part of the deployed app. Holds integration knowledge under `.agents/knowledge/` (subfolders confirmed on disk: `apis/{Bonda,Fiserv}`, `fiservqr`, `database`, plus others) and Claude Code skills under `.agents/skills/`. These are gitignored, so their exact content isn't verifiable from the repo's tracked history — treat them as living notes to check directly rather than as documented-and-confirmed facts. Worth checking `.agents/knowledge/apis/{Bonda,Fiserv}/` before touching those integrations, since they're reported to document non-obvious gotchas (e.g., Bonda's two separate API keys) not visible from the code alone.

## Git workflow

Two long-lived integration branches, matched to app: `dev-frontend` and `dev-backend`. Feature branches are cut from the relevant one (`feature/nombre-descriptivo`) and PR back into it. Commit messages use conventional prefixes (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`).
