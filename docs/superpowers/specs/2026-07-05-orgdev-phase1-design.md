# OrgDev Platform — Phase 1 Design

**Date:** 2026-07-05
**Status:** Approved (revised: Supabase backend)
**Repo:** https://github.com/ubterzioglu/orgdevco (public)

## Background

OrgDev (org-dev.co) is an AI-powered organizational and career development
marketplace connecting organizations with vetted coaches/consultants. The
production site features a marketplace, an "AI Digital Twin" per consultant,
intelligent org-to-expert matching, and commerce (session booking, digital
products).

Building the full platform in one pass is too large for a single spec. This
document scopes **Phase 1**: the skeleton the rest of the platform will be
built on — landing page, auth, and consultant/organization profiles.
Later phases (not in this spec): Digital Twin AI chat, marketplace
search/matching, payments/booking.

An existing `.env.local` in the project directory already contains live
Supabase credentials (URL, anon key, service role key, DB URL, admin
access token, admin emails/password), indicating the project's backend
was already decided as Supabase before this spec was written. This
revision aligns the architecture to that reality instead of standing up a
parallel Prisma + self-hosted Postgres stack. `.env.local` is treated as
existing, external configuration: it is not modified, and its values are
never committed.

## Goals

- Stand up a deployable Next.js application on Supabase (Postgres + Auth)
  with a public landing page inspired by org-dev.co's structure and
  messaging.
- Support three roles — Consultant, Organization, Admin — via Supabase Auth
  (email/password), with role stored on the user's profile row.
- Admin access is additionally gated by the `ADMIN_EMAILS` allowlist already
  defined in `.env.local`.
- CRUD for Consultant profiles and Organization profiles with the core
  fields needed for a directory-style listing.
- A minimal Admin view to list and activate/deactivate profiles.
- Ship Docker artifacts so the app can be deployed on Coolify.

## Non-Goals (future phases)

- Digital Twin AI assistant / chat.
- Marketplace search, filtering, and intelligent matching.
- Payments, session booking, digital product sales.
- OAuth providers (Google, etc.) — email/password via Supabase Auth only
  for now.

## Architecture

- **Framework:** Next.js 15 (App Router), TypeScript.
- **Backend:** Supabase (Postgres + Auth), via `@supabase/supabase-js` and
  `@supabase/ssr` for server/client helpers.
- **Styling:** Tailwind CSS (matches "modern/premium SaaS" look requested).
- **Deployment target:** Coolify (self-hosted), via Docker. The Next.js app
  is the only container Coolify manages; Postgres is Supabase-hosted, not
  a Coolify-managed service.

Single repo, single deployable app. No separate backend service — Next.js
route handlers / server actions call Supabase directly.

## Data Model (Supabase Postgres)

Managed via SQL migrations in `supabase/migrations/`, with Row Level
Security (RLS) enabled on every table.

```sql
create type user_role as enum ('CONSULTANT', 'ORGANIZATION', 'ADMIN');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  role user_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table consultant_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references profiles(id) on delete cascade,
  photo_url text,
  title text not null,
  bio text not null,
  expertise text[] not null default '{}',
  location text,
  languages text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table organization_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references profiles(id) on delete cascade,
  logo_url text,
  industry text not null,
  description text not null,
  location text,
  updated_at timestamptz not null default now()
);
```

RLS policies: a user can read/write their own `profiles` row and their own
`consultant_profiles`/`organization_profiles` row; anyone (including
anonymous) can read profiles where `is_active = true` (for the public
directories); only `ADMIN`-role users can update `is_active` on other
users' rows.

## Auth (Supabase)

- Supabase Auth handles signup/login with email + password (no OAuth yet).
- On signup, a Postgres trigger (or a server action right after signup)
  creates the matching `profiles` row with the role the user picked
  (Consultant / Organization) at signup time. Role is fixed after creation.
- Admin accounts are not self-service: a user is treated as Admin only if
  their email is in the `ADMIN_EMAILS` allowlist (from `.env.local`),
  checked server-side on every request to `/dashboard/admin`. This reuses
  the existing `ADMIN_EMAILS`/`ADMIN_PASS` values already present in
  `.env.local` rather than introducing a new admin mechanism.
- Session: handled by `@supabase/ssr` cookie-based sessions (standard
  Supabase Next.js App Router pattern). Middleware reads the session to
  gate `/dashboard/*` routes by role.

## Pages / Routes

- `/` — public landing page: hero, "For Consultants" section, "For
  Organizations" section, Digital Twin teaser card (marketing copy only,
  not functional), CTA to register.
- `/login` — role picker + name/email mock login form.
- `/consultants` — public directory listing of active consultant profiles.
- `/organizations` — public directory listing of active organization
  profiles.
- `/dashboard/consultant` — consultant's own profile edit form (auth
  required, role=CONSULTANT).
- `/dashboard/organization` — organization's own profile edit form (auth
  required, role=ORGANIZATION).
- `/dashboard/admin` — table of all consultants/organizations with an
  active/inactive toggle (auth required, role=ADMIN).

## Error Handling

- Server actions/route handlers validate input with Zod before touching the
  database; validation failures return field-level error messages to the
  form.
- Unauthenticated access to `/dashboard/*` redirects to `/login`.
- Wrong-role access to a dashboard route (e.g. consultant hitting
  `/dashboard/admin`) returns a 403 page.

## Testing

- Unit tests for Zod schemas and role/allowlist helper functions.
- Integration tests for the profile CRUD route handlers against a Supabase
  local dev stack (`supabase start`) or a test project.
- No E2E in this phase (deferred until UI stabilizes past Phase 1).

## Deployment (Coolify)

- `Dockerfile` — multi-stage build (deps → build → runtime), Next.js
  standalone output. Single service; no bundled Postgres container since
  Supabase hosts the database.
- `.env.example` — documents the variable names the app reads
  (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`) without real values.
  `.env.local`'s actual values are never copied into the repo or into this
  file.
- `DEPLOY.md` — Coolify setup notes: required env vars (set directly in
  Coolify's environment variable UI from the existing Supabase project),
  exposed port, health check endpoint (`/api/health`).

## Out of Scope Confirmation

Digital Twin, marketplace matching, payments, and OAuth are explicitly
deferred to later phases, each of which will get its own
brainstorm → spec → plan cycle.
