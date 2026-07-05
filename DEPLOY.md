# Deploying OrgDev to Coolify

## Prerequisites

- A Coolify instance with access to this Git repository.
- The Supabase project already provisioned (URL, anon key, service role
  key, DB URL — see the project's `.env.local` for actual values, which
  are never committed to this repo).

## Steps

1. In Coolify, create a new **Application** resource, pointing at this
   repository and the `master` branch.
2. Set the build pack to **Dockerfile** (Coolify auto-detects the
   `Dockerfile` in the repo root).
3. Set the exposed port to `3000`.
4. Add the following environment variables in Coolify's app settings,
   using the real values from `.env.local` (do not paste them into any
   file in this repo):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAILS`
   - `NEXT_PUBLIC_SITE_URL` — the deployed site's public URL (e.g.
     `https://orgdev.co`), used for SEO metadata, the sitemap, and
     robots.txt generation (added in Task 12).
5. Set the health check path to `/api/health`.
6. Deploy. Coolify builds the Dockerfile and starts the container on the
   configured port.

## Database migrations

Schema changes live in `supabase/migrations/`. Apply them to the linked
Supabase project with:

```bash
npx supabase db push
```

This is a manual step run from a developer machine (or a CI step with the
Supabase access token as a secret) — Coolify does not run migrations
automatically in this phase.
