# Changelog

## 2026-07-05

- Wrote the Phase 1 design spec (landing page, Supabase auth, consultant/organization profiles, Coolify deployment).
- Wrote the Phase 1 implementation plan (13 tasks, TDD, subagent-driven execution).
- Found an existing `.env.local` with live Supabase credentials and revised the architecture from a fresh Prisma/Postgres stack to Supabase (Postgres + Auth), reusing those credentials.
- Scaffolded the Next.js 15 + TypeScript + Tailwind + Vitest project.
- Added Supabase client helpers (`lib/supabase/client.ts`, `lib/supabase/server.ts`) and the `ADMIN_EMAILS` allowlist check (`lib/admin.ts`).
- Added the `profiles`, `consultant_profiles`, and `organization_profiles` schema with Row Level Security policies.
- Added the health check endpoint and the Docker/Coolify deployment setup.
- Added Zod validation schemas for signup, login, and both profile types.
- Added signup/login pages and role-gating middleware for `/dashboard/*`.
- Added consultant and organization dashboard profile forms.
- Added public `/consultants` and `/organizations` directories.
- Added the admin dashboard with profile activation controls and this changelog panel.
