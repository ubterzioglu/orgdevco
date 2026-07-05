# OrgDev Platform Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the OrgDev platform skeleton — public landing page, Supabase-backed auth (Consultant/Organization/Admin roles), consultant and organization profile CRUD with public directories, and a Coolify-ready Docker deployment.

**Architecture:** Next.js 15 App Router (TypeScript) as a single deployable service. Supabase provides Postgres + Auth; the app talks to it via `@supabase/supabase-js` and `@supabase/ssr`. Route-level middleware gates `/dashboard/*` by role read from the user's `profiles` row (Admin additionally checked against an email allowlist). Tailwind CSS for styling. Vitest for unit/integration tests.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Zod, Vitest, Docker.

## Global Constraints

- Backend is Supabase — never Prisma or a separately hosted Postgres. (spec: Architecture)
- `.env.local` already exists with live credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `SUPABASE_ACCESS_TOKEN`, `ADMIN_EMAILS`, `ADMIN_PASS`) — it must never be modified, deleted, or committed. (user directive)
- No OAuth providers in this phase — Supabase Auth email/password only. (spec: Non-Goals)
- No Digital Twin, marketplace matching, or payments in this phase. (spec: Non-Goals)
- Admin role is not self-service signup — gated by the `ADMIN_EMAILS` allowlist. (spec: Auth)
- RLS must be enabled on every table; a user can read/write only their own profile rows, active profiles are publicly readable. (spec: Data Model)
- Deployment target is Coolify via a single Next.js Docker container; Supabase hosts the DB, so no bundled Postgres container. (spec: Deployment)
- Every task ends with a passing test run before moving to the next task. (writing-plans requirement)

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx` (placeholder)
- Create: `.dockerignore`, `.env.example`
- Create: `vitest.config.ts`
- Modify: `.gitignore` (already exists — verify `.next/`, `node_modules/`, `.env*.local` are present; they are)

**Interfaces:**
- Produces: a running `npm run dev` Next.js app on port 3000, and `npm test` running Vitest.

- [ ] **Step 1: Scaffold Next.js app**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*" --use-npm --no-turbopack --yes
```

Expected: creates `package.json`, `app/`, `tsconfig.json`, `tailwind.config.ts` (or `postcss` v4 config), `next.config.ts`, `.eslintrc` in the current directory. If the CLI complains the directory isn't empty (it has `docs/`, `.gitignore`, `.env.local`), that's fine — it scaffolds alongside existing files.

- [ ] **Step 2: Install test tooling**

Run:
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Add Vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 4: Add test script to package.json**

Modify `package.json` scripts block to include:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Write a smoke test**

Create `__tests__/smoke.test.ts`:
```typescript
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 1 test passed.

- [ ] **Step 7: Verify dev server boots**

Run: `npm run dev` in background, then `curl http://localhost:3000` (or check output), then stop the server.
Expected: HTTP 200 with the default Next.js page HTML.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Vitest"
```

---

## Task 2: Supabase client helpers and env wiring

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/admin.ts`
- Test: `__tests__/lib/admin.test.ts`
- Modify: `.env.example` (document required vars, no real values)

**Interfaces:**
- Produces:
  - `createBrowserClient(): SupabaseClient` from `lib/supabase/client.ts`
  - `createServerClient(): Promise<SupabaseClient>` from `lib/supabase/server.ts` (async because it reads Next.js cookies)
  - `isAdminEmail(email: string): boolean` from `lib/admin.ts`
- Consumes: `process.env.NEXT_PUBLIC_SUPABASE_URL`, `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`, `process.env.ADMIN_EMAILS` (all already defined in `.env.local`, comma-separated for `ADMIN_EMAILS`).

- [ ] **Step 1: Install Supabase packages**

Run:
```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Write failing test for isAdminEmail**

Create `__tests__/lib/admin.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isAdminEmail } from "@/lib/admin";

describe("isAdminEmail", () => {
  const original = process.env.ADMIN_EMAILS;

  beforeEach(() => {
    process.env.ADMIN_EMAILS = "admin@orgdev.co, owner@orgdev.co";
  });

  afterEach(() => {
    process.env.ADMIN_EMAILS = original;
  });

  it("returns true for an allowlisted email", () => {
    expect(isAdminEmail("admin@orgdev.co")).toBe(true);
  });

  it("is case-insensitive and trims whitespace in the allowlist", () => {
    expect(isAdminEmail("Owner@orgdev.co")).toBe(true);
  });

  it("returns false for an email not on the allowlist", () => {
    expect(isAdminEmail("nobody@example.com")).toBe(false);
  });

  it("returns false when ADMIN_EMAILS is unset", () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdminEmail("admin@orgdev.co")).toBe(false);
  });
});
```

- [ ] **Step 2b: Run test to verify it fails**

Run: `npm test -- admin.test.ts`
Expected: FAIL with "Cannot find module '@/lib/admin'" or similar.

- [ ] **Step 3: Implement isAdminEmail**

Create `lib/admin.ts`:
```typescript
export function isAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw) return false;

  const allowlist = raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return allowlist.includes(email.trim().toLowerCase());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- admin.test.ts`
Expected: PASS, 4 tests passed.

- [ ] **Step 5: Implement Supabase browser client**

Create `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 6: Implement Supabase server client**

Create `lib/supabase/server.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component; ignore if middleware
            // is refreshing the session.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 7: Document env vars without real values**

Create `.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAILS=
```

- [ ] **Step 8: Run full test suite**

Run: `npm test`
Expected: PASS, all tests passed (smoke + admin).

- [ ] **Step 9: Commit**

```bash
git add lib/ __tests__/lib .env.example package.json package-lock.json
git commit -m "feat: add Supabase client helpers and admin allowlist check"
```

---

## Task 3: Database schema and RLS migration

**Files:**
- Create: `supabase/migrations/0001_init.sql`

**Interfaces:**
- Produces: tables `profiles`, `consultant_profiles`, `organization_profiles`, enum `user_role`, and RLS policies, as specified in the design doc's Data Model section.
- Consumes: nothing (raw SQL migration).

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0001_init.sql`:
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

alter table profiles enable row level security;
alter table consultant_profiles enable row level security;
alter table organization_profiles enable row level security;

-- profiles: a user can read/update their own row; anyone can read active rows
create policy "profiles_select_own_or_active"
  on profiles for select
  using (auth.uid() = id or is_active = true);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = id);

-- consultant_profiles: owner can read/write own; anyone can read if the
-- owning profile is active
create policy "consultant_profiles_select"
  on consultant_profiles for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from profiles
      where profiles.id = consultant_profiles.user_id
      and profiles.is_active = true
    )
  );

create policy "consultant_profiles_insert_own"
  on consultant_profiles for insert
  with check (auth.uid() = user_id);

create policy "consultant_profiles_update_own"
  on consultant_profiles for update
  using (auth.uid() = user_id);

-- organization_profiles: same pattern as consultant_profiles
create policy "organization_profiles_select"
  on organization_profiles for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from profiles
      where profiles.id = organization_profiles.user_id
      and profiles.is_active = true
    )
  );

create policy "organization_profiles_insert_own"
  on organization_profiles for insert
  with check (auth.uid() = user_id);

create policy "organization_profiles_update_own"
  on organization_profiles for update
  using (auth.uid() = user_id);
```

- [ ] **Step 2: Install Supabase CLI as a dev dependency**

Run:
```bash
npm install -D supabase
```

- [ ] **Step 3: Link to the existing Supabase project**

Run: `npx supabase login` (only if not already authenticated), then:
```bash
npx supabase link --project-ref <ref-from-NEXT_PUBLIC_SUPABASE_URL>
```
Expected: links successfully. The `<ref>` is the subdomain segment of `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` (e.g. `https://<ref>.supabase.co`); read it from `.env.local` but do not print or commit the value.

- [ ] **Step 4: Push the migration to the linked Supabase project**

Run:
```bash
npx supabase db push
```
Expected: reports migration `0001_init.sql` applied successfully.

- [ ] **Step 5: Verify tables exist**

Run:
```bash
npx supabase db diff --schema public
```
Expected: no diff (schema matches migration — confirms it applied cleanly).

- [ ] **Step 6: Commit**

```bash
git add supabase/ package.json package-lock.json
git commit -m "feat: add profiles schema and RLS policies migration"
```

---

## Task 4: Zod validation schemas

**Files:**
- Create: `lib/validation/auth.ts`
- Create: `lib/validation/profile.ts`
- Test: `__tests__/lib/validation/auth.test.ts`
- Test: `__tests__/lib/validation/profile.test.ts`

**Interfaces:**
- Produces:
  - `signupSchema: z.ZodType` (fields: `email`, `password`, `name`, `role: "CONSULTANT" | "ORGANIZATION"`) from `lib/validation/auth.ts`
  - `loginSchema: z.ZodType` (fields: `email`, `password`) from `lib/validation/auth.ts`
  - `consultantProfileSchema: z.ZodType` (fields: `title`, `bio`, `expertise: string[]`, `location?`, `languages: string[]`, `photoUrl?`) from `lib/validation/profile.ts`
  - `organizationProfileSchema: z.ZodType` (fields: `industry`, `description`, `location?`, `logoUrl?`) from `lib/validation/profile.ts`

- [ ] **Step 1: Install Zod**

Run:
```bash
npm install zod
```

- [ ] **Step 2: Write failing tests for auth schemas**

Create `__tests__/lib/validation/auth.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { signupSchema, loginSchema } from "@/lib/validation/auth";

describe("signupSchema", () => {
  it("accepts a valid consultant signup", () => {
    const result = signupSchema.safeParse({
      email: "jane@example.com",
      password: "supersecret1",
      name: "Jane Doe",
      role: "CONSULTANT",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid role", () => {
    const result = signupSchema.safeParse({
      email: "jane@example.com",
      password: "supersecret1",
      name: "Jane Doe",
      role: "ADMIN",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password under 8 characters", () => {
    const result = signupSchema.safeParse({
      email: "jane@example.com",
      password: "short",
      name: "Jane Doe",
      role: "CONSULTANT",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signupSchema.safeParse({
      email: "not-an-email",
      password: "supersecret1",
      name: "Jane Doe",
      role: "CONSULTANT",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a valid login", () => {
    const result = loginSchema.safeParse({
      email: "jane@example.com",
      password: "supersecret1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing password", () => {
    const result = loginSchema.safeParse({ email: "jane@example.com" });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test -- validation/auth.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement auth schemas**

Create `lib/validation/auth.ts`:
```typescript
import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["CONSULTANT", "ORGANIZATION"]),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 5: Run to verify pass**

Run: `npm test -- validation/auth.test.ts`
Expected: PASS, 6 tests passed.

- [ ] **Step 6: Write failing tests for profile schemas**

Create `__tests__/lib/validation/profile.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import {
  consultantProfileSchema,
  organizationProfileSchema,
} from "@/lib/validation/profile";

describe("consultantProfileSchema", () => {
  it("accepts a valid consultant profile", () => {
    const result = consultantProfileSchema.safeParse({
      title: "Lean Transformation Coach",
      bio: "15 years helping manufacturers cut waste.",
      expertise: ["Lean", "Six Sigma"],
      languages: ["English", "Turkish"],
      location: "Istanbul, Turkey",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty bio", () => {
    const result = consultantProfileSchema.safeParse({
      title: "Coach",
      bio: "",
      expertise: ["Lean"],
      languages: ["English"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-array expertise field", () => {
    const result = consultantProfileSchema.safeParse({
      title: "Coach",
      bio: "Bio text",
      expertise: "Lean",
      languages: ["English"],
    });
    expect(result.success).toBe(false);
  });

  it("allows omitting optional photoUrl and location", () => {
    const result = consultantProfileSchema.safeParse({
      title: "Coach",
      bio: "Bio text",
      expertise: ["Lean"],
      languages: ["English"],
    });
    expect(result.success).toBe(true);
  });
});

describe("organizationProfileSchema", () => {
  it("accepts a valid organization profile", () => {
    const result = organizationProfileSchema.safeParse({
      industry: "Manufacturing",
      description: "A mid-size auto parts manufacturer.",
      location: "Bursa, Turkey",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty industry", () => {
    const result = organizationProfileSchema.safeParse({
      industry: "",
      description: "Description text",
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 7: Run to verify failure**

Run: `npm test -- validation/profile.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 8: Implement profile schemas**

Create `lib/validation/profile.ts`:
```typescript
import { z } from "zod";

export const consultantProfileSchema = z.object({
  title: z.string().min(1),
  bio: z.string().min(1),
  expertise: z.array(z.string()).min(1),
  languages: z.array(z.string()).min(1),
  location: z.string().optional(),
  photoUrl: z.string().url().optional(),
});

export type ConsultantProfileInput = z.infer<typeof consultantProfileSchema>;

export const organizationProfileSchema = z.object({
  industry: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

export type OrganizationProfileInput = z.infer<
  typeof organizationProfileSchema
>;
```

- [ ] **Step 9: Run to verify pass**

Run: `npm test -- validation/profile.test.ts`
Expected: PASS, 6 tests passed.

- [ ] **Step 10: Run full suite**

Run: `npm test`
Expected: PASS, all tests passed.

- [ ] **Step 11: Commit**

```bash
git add lib/validation __tests__/lib/validation package.json package-lock.json
git commit -m "feat: add Zod validation schemas for auth and profiles"
```

---

## Task 5: Signup, login, and route-gating middleware

**Files:**
- Create: `app/signup/page.tsx`
- Create: `app/signup/actions.ts`
- Create: `app/login/page.tsx`
- Create: `app/login/actions.ts`
- Create: `middleware.ts`
- Test: `__tests__/app/signup-actions.test.ts` (schema-validation branch only; live Supabase calls are exercised manually per Step 8, since a real project has no safe way to unit-test signup without hitting the network)

**Interfaces:**
- Consumes: `signupSchema`, `loginSchema` from Task 4; `createClient` (server) from Task 2; `isAdminEmail` from Task 2.
- Produces: `signup(formData: FormData): Promise<{ error?: string }>` from `app/signup/actions.ts`; `login(formData: FormData): Promise<{ error?: string }>` from `app/login/actions.ts`. Both redirect on success instead of returning.

- [ ] **Step 1: Write the failing test for signup action validation**

Create `__tests__/app/signup-actions.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { validateSignupForm } from "@/app/signup/actions";

describe("validateSignupForm", () => {
  it("returns parsed data for valid input", () => {
    const form = new FormData();
    form.set("email", "jane@example.com");
    form.set("password", "supersecret1");
    form.set("name", "Jane Doe");
    form.set("role", "CONSULTANT");

    const result = validateSignupForm(form);
    expect(result.success).toBe(true);
  });

  it("returns an error for a missing name", () => {
    const form = new FormData();
    form.set("email", "jane@example.com");
    form.set("password", "supersecret1");
    form.set("role", "CONSULTANT");

    const result = validateSignupForm(form);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- signup-actions.test.ts`
Expected: FAIL — `validateSignupForm` not exported.

- [ ] **Step 3: Implement the signup server action**

Create `app/signup/actions.ts`:
```typescript
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validation/auth";

export function validateSignupForm(formData: FormData) {
  return signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    role: formData.get("role"),
  });
}

export async function signup(formData: FormData): Promise<{ error?: string }> {
  const parsed = validateSignupForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password, name, role } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) {
    return { error: error?.message ?? "Signup failed" };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    email,
    name,
    role,
  });
  if (profileError) {
    return { error: profileError.message };
  }

  redirect(role === "CONSULTANT" ? "/dashboard/consultant" : "/dashboard/organization");
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- signup-actions.test.ts`
Expected: PASS, 2 tests passed.

- [ ] **Step 5: Implement the signup page**

Create `app/signup/page.tsx`:
```tsx
import { signup } from "./actions";

export default function SignupPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">Create your OrgDev account</h1>
      <form action={signup} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <fieldset>
          <legend className="block text-sm font-medium">I am a...</legend>
          <label className="mr-4">
            <input type="radio" name="role" value="CONSULTANT" defaultChecked /> Consultant
          </label>
          <label>
            <input type="radio" name="role" value="ORGANIZATION" /> Organization
          </label>
        </fieldset>
        <button
          type="submit"
          className="w-full rounded bg-slate-900 px-4 py-2 text-white"
        >
          Sign up
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 6: Implement the login action and page**

Create `app/login/actions.ts`:
```typescript
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";

export function validateLoginForm(formData: FormData) {
  return loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function login(formData: FormData): Promise<{ error?: string }> {
  const parsed = validateLoginForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: error.message };
  }

  redirect("/");
}
```

Create `app/login/page.tsx`:
```tsx
import { login } from "./actions";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">Log in to OrgDev</h1>
      <form action={login} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-slate-900 px-4 py-2 text-white"
        >
          Log in
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 7: Implement route-gating middleware**

Create `middleware.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/admin";

const DASHBOARD_ROLE_PREFIX: Record<string, string> = {
  consultant: "CONSULTANT",
  organization: "ORGANIZATION",
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (!path.startsWith("/dashboard")) {
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const segment = path.split("/")[2]; // dashboard/<segment>

  if (segment === "admin") {
    if (!isAdminEmail(user.email ?? "")) {
      return NextResponse.redirect(new URL("/403", request.url));
    }
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const expectedRole = DASHBOARD_ROLE_PREFIX[segment];
  if (!expectedRole || profile?.role !== expectedRole) {
    return NextResponse.redirect(new URL("/403", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

- [ ] **Step 8: Manual verification against the real Supabase project**

Run: `npm run dev`, then in a browser: visit `/signup`, create a Consultant account, confirm redirect to `/dashboard/consultant` (expect a 404 for now — the page doesn't exist until Task 6 — that 404, not a `/403` or `/login` redirect, confirms middleware let an authenticated Consultant through). Then log out, visit `/dashboard/admin` unauthenticated, confirm redirect to `/login`.

- [ ] **Step 9: Run full automated test suite**

Run: `npm test`
Expected: PASS, all tests passed.

- [ ] **Step 10: Commit**

```bash
git add app/signup app/login middleware.ts __tests__/app package.json package-lock.json
git commit -m "feat: add signup/login and role-gating middleware"
```

---

## Task 6: Dashboard profile forms (Consultant, Organization)

**Files:**
- Create: `app/dashboard/consultant/page.tsx`
- Create: `app/dashboard/consultant/actions.ts`
- Create: `app/dashboard/organization/page.tsx`
- Create: `app/dashboard/organization/actions.ts`
- Create: `app/403/page.tsx`
- Test: `__tests__/app/consultant-actions.test.ts`
- Test: `__tests__/app/organization-actions.test.ts`

**Interfaces:**
- Consumes: `consultantProfileSchema`, `organizationProfileSchema` from Task 4; `createClient` (server) from Task 2.
- Produces: `validateConsultantProfileForm(formData: FormData)`, `saveConsultantProfile(formData: FormData): Promise<{ error?: string }>`, and the organization equivalents.

- [ ] **Step 1: Write failing test for consultant profile validation**

Create `__tests__/app/consultant-actions.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { validateConsultantProfileForm } from "@/app/dashboard/consultant/actions";

describe("validateConsultantProfileForm", () => {
  it("parses expertise and languages as comma-separated lists", () => {
    const form = new FormData();
    form.set("title", "Lean Coach");
    form.set("bio", "15 years of experience.");
    form.set("expertise", "Lean, Six Sigma");
    form.set("languages", "English, Turkish");
    form.set("location", "Istanbul");

    const result = validateConsultantProfileForm(form);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expertise).toEqual(["Lean", "Six Sigma"]);
      expect(result.data.languages).toEqual(["English", "Turkish"]);
    }
  });

  it("rejects an empty title", () => {
    const form = new FormData();
    form.set("title", "");
    form.set("bio", "Bio");
    form.set("expertise", "Lean");
    form.set("languages", "English");

    const result = validateConsultantProfileForm(form);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- consultant-actions.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement consultant profile actions**

Create `app/dashboard/consultant/actions.ts`:
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { consultantProfileSchema } from "@/lib/validation/profile";

function splitList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateConsultantProfileForm(formData: FormData) {
  return consultantProfileSchema.safeParse({
    title: formData.get("title"),
    bio: formData.get("bio"),
    expertise: splitList(formData.get("expertise")),
    languages: splitList(formData.get("languages")),
    location: formData.get("location") || undefined,
    photoUrl: formData.get("photoUrl") || undefined,
  });
}

export async function saveConsultantProfile(
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = validateConsultantProfileForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("consultant_profiles")
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id" });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/consultant");
  revalidatePath("/consultants");
  return {};
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- consultant-actions.test.ts`
Expected: PASS, 2 tests passed.

- [ ] **Step 5: Implement the consultant dashboard page**

Create `app/dashboard/consultant/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { saveConsultantProfile } from "./actions";

export default async function ConsultantDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("consultant_profiles")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">Your consultant profile</h1>
      <form action={saveConsultantProfile} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            defaultValue={profile?.title ?? ""}
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            defaultValue={profile?.bio ?? ""}
            required
            rows={4}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="expertise" className="block text-sm font-medium">
            Expertise (comma-separated)
          </label>
          <input
            id="expertise"
            name="expertise"
            defaultValue={profile?.expertise?.join(", ") ?? ""}
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="languages" className="block text-sm font-medium">
            Languages (comma-separated)
          </label>
          <input
            id="languages"
            name="languages"
            defaultValue={profile?.languages?.join(", ") ?? ""}
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium">
            Location
          </label>
          <input
            id="location"
            name="location"
            defaultValue={profile?.location ?? ""}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="photoUrl" className="block text-sm font-medium">
            Photo URL
          </label>
          <input
            id="photoUrl"
            name="photoUrl"
            defaultValue={profile?.photo_url ?? ""}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-slate-900 px-4 py-2 text-white"
        >
          Save profile
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 6: Write failing test for organization profile validation**

Create `__tests__/app/organization-actions.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { validateOrganizationProfileForm } from "@/app/dashboard/organization/actions";

describe("validateOrganizationProfileForm", () => {
  it("accepts a valid organization profile submission", () => {
    const form = new FormData();
    form.set("industry", "Manufacturing");
    form.set("description", "A mid-size auto parts manufacturer.");
    form.set("location", "Bursa");

    const result = validateOrganizationProfileForm(form);
    expect(result.success).toBe(true);
  });

  it("rejects an empty description", () => {
    const form = new FormData();
    form.set("industry", "Manufacturing");
    form.set("description", "");

    const result = validateOrganizationProfileForm(form);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 7: Run to verify failure**

Run: `npm test -- organization-actions.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 8: Implement organization profile actions**

Create `app/dashboard/organization/actions.ts`:
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { organizationProfileSchema } from "@/lib/validation/profile";

export function validateOrganizationProfileForm(formData: FormData) {
  return organizationProfileSchema.safeParse({
    industry: formData.get("industry"),
    description: formData.get("description"),
    location: formData.get("location") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
  });
}

export async function saveOrganizationProfile(
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = validateOrganizationProfileForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("organization_profiles")
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id" });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/organization");
  revalidatePath("/organizations");
  return {};
}
```

- [ ] **Step 9: Run to verify pass**

Run: `npm test -- organization-actions.test.ts`
Expected: PASS, 2 tests passed.

- [ ] **Step 10: Implement the organization dashboard page**

Create `app/dashboard/organization/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { saveOrganizationProfile } from "./actions";

export default async function OrganizationDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("organization_profiles")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">Your organization profile</h1>
      <form action={saveOrganizationProfile} className="space-y-4">
        <div>
          <label htmlFor="industry" className="block text-sm font-medium">
            Industry
          </label>
          <input
            id="industry"
            name="industry"
            defaultValue={profile?.industry ?? ""}
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={profile?.description ?? ""}
            required
            rows={4}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium">
            Location
          </label>
          <input
            id="location"
            name="location"
            defaultValue={profile?.location ?? ""}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="logoUrl" className="block text-sm font-medium">
            Logo URL
          </label>
          <input
            id="logoUrl"
            name="logoUrl"
            defaultValue={profile?.logo_url ?? ""}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-slate-900 px-4 py-2 text-white"
        >
          Save profile
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 11: Add the 403 page**

Create `app/403/page.tsx`:
```tsx
export default function ForbiddenPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-2">403 — Access denied</h1>
      <p className="text-slate-600">
        You don&apos;t have permission to view this page.
      </p>
    </main>
  );
}
```

- [ ] **Step 12: Manual verification**

Run: `npm run dev`. Sign up as a Consultant, go to `/dashboard/consultant`, fill and save the form, confirm no error is shown and reloading the page shows the saved values. Repeat for an Organization account at `/dashboard/organization`.

- [ ] **Step 13: Run full automated test suite**

Run: `npm test`
Expected: PASS, all tests passed.

- [ ] **Step 14: Commit**

```bash
git add app/dashboard app/403 __tests__/app package.json package-lock.json
git commit -m "feat: add consultant and organization dashboard profile forms"
```

---

## Task 7: Public directories (consultants, organizations) and shared cards

**Files:**
- Create: `components/profile/ConsultantCard.tsx`
- Create: `components/profile/OrganizationCard.tsx`
- Create: `app/consultants/page.tsx`
- Create: `app/organizations/page.tsx`
- Test: `__tests__/components/ConsultantCard.test.tsx`
- Test: `__tests__/components/OrganizationCard.test.tsx`

**Interfaces:**
- Produces: `ConsultantCard({ title, bio, expertise, location }: ConsultantCardProps)`, `OrganizationCard({ industry, description, location }: OrganizationCardProps)`, both default exports.
- Consumes: `createClient` (server) from Task 2, reading from `consultant_profiles` / `organization_profiles` joined with `profiles` for `name`.

- [ ] **Step 1: Write failing test for ConsultantCard**

Create `__tests__/components/ConsultantCard.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ConsultantCard from "@/components/profile/ConsultantCard";

describe("ConsultantCard", () => {
  it("renders name, title, and expertise tags", () => {
    render(
      <ConsultantCard
        name="Jane Doe"
        title="Lean Transformation Coach"
        bio="15 years of experience."
        expertise={["Lean", "Six Sigma"]}
        location="Istanbul, Turkey"
      />
    );

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Lean Transformation Coach")).toBeInTheDocument();
    expect(screen.getByText("Lean")).toBeInTheDocument();
    expect(screen.getByText("Six Sigma")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- ConsultantCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement ConsultantCard**

Create `components/profile/ConsultantCard.tsx`:
```tsx
type ConsultantCardProps = {
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  location?: string | null;
};

export default function ConsultantCard({
  name,
  title,
  bio,
  expertise,
  location,
}: ConsultantCardProps) {
  return (
    <div className="rounded-lg border p-6 shadow-sm">
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-sm text-slate-600">{title}</p>
      {location && <p className="text-xs text-slate-400">{location}</p>}
      <p className="mt-3 text-sm">{bio}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {expertise.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- ConsultantCard.test.tsx`
Expected: PASS, 1 test passed.

- [ ] **Step 5: Write failing test for OrganizationCard**

Create `__tests__/components/OrganizationCard.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import OrganizationCard from "@/components/profile/OrganizationCard";

describe("OrganizationCard", () => {
  it("renders name, industry, and description", () => {
    render(
      <OrganizationCard
        name="Acme Manufacturing"
        industry="Manufacturing"
        description="A mid-size auto parts manufacturer."
        location="Bursa, Turkey"
      />
    );

    expect(screen.getByText("Acme Manufacturing")).toBeInTheDocument();
    expect(screen.getByText("Manufacturing")).toBeInTheDocument();
    expect(
      screen.getByText("A mid-size auto parts manufacturer.")
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run to verify failure**

Run: `npm test -- OrganizationCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement OrganizationCard**

Create `components/profile/OrganizationCard.tsx`:
```tsx
type OrganizationCardProps = {
  name: string;
  industry: string;
  description: string;
  location?: string | null;
};

export default function OrganizationCard({
  name,
  industry,
  description,
  location,
}: OrganizationCardProps) {
  return (
    <div className="rounded-lg border p-6 shadow-sm">
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-sm text-slate-600">{industry}</p>
      {location && <p className="text-xs text-slate-400">{location}</p>}
      <p className="mt-3 text-sm">{description}</p>
    </div>
  );
}
```

- [ ] **Step 8: Run to verify pass**

Run: `npm test -- OrganizationCard.test.tsx`
Expected: PASS, 1 test passed.

- [ ] **Step 9: Implement the consultants directory page**

Create `app/consultants/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import ConsultantCard from "@/components/profile/ConsultantCard";

export default async function ConsultantsPage() {
  const supabase = await createClient();
  const { data: consultants } = await supabase
    .from("consultant_profiles")
    .select("title, bio, expertise, location, profiles(name)")
    .order("updated_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-2xl font-semibold mb-8">Consultants & Coaches</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(consultants ?? []).map((c, i) => (
          <ConsultantCard
            key={i}
            name={(c.profiles as unknown as { name: string })?.name ?? "Unknown"}
            title={c.title}
            bio={c.bio}
            expertise={c.expertise}
            location={c.location}
          />
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 10: Implement the organizations directory page**

Create `app/organizations/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import OrganizationCard from "@/components/profile/OrganizationCard";

export default async function OrganizationsPage() {
  const supabase = await createClient();
  const { data: organizations } = await supabase
    .from("organization_profiles")
    .select("industry, description, location, profiles(name)")
    .order("updated_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-2xl font-semibold mb-8">Organizations</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(organizations ?? []).map((o, i) => (
          <OrganizationCard
            key={i}
            name={(o.profiles as unknown as { name: string })?.name ?? "Unknown"}
            industry={o.industry}
            description={o.description}
            location={o.location}
          />
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 11: Manual verification**

Run: `npm run dev`, visit `/consultants` and `/organizations`. Confirm the profiles saved in Task 6 appear as cards.

- [ ] **Step 12: Run full automated test suite**

Run: `npm test`
Expected: PASS, all tests passed.

- [ ] **Step 13: Commit**

```bash
git add components/ app/consultants app/organizations __tests__/components
git commit -m "feat: add public consultant and organization directories"
```

---

## Task 8: Admin dashboard

**Files:**
- Create: `app/dashboard/admin/page.tsx`
- Create: `app/dashboard/admin/actions.ts`
- Create: `CHANGELOG.md` (repo root)
- Create: `lib/changelog.ts`
- Test: `__tests__/app/admin-actions.test.ts`
- Test: `__tests__/lib/changelog.test.ts`

**Interfaces:**
- Consumes: `isAdminEmail` from Task 2, `createClient` (server) from Task 2.
- Produces: `toggleProfileActive(userId: string, isActive: boolean): Promise<{ error?: string }>`; `getChangelogEntries(): ChangelogEntry[]` from `lib/changelog.ts`, where `ChangelogEntry = { date: string; items: string[] }`.

- [ ] **Step 1: Write failing test for the admin guard in the action**

Create `__tests__/app/admin-actions.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "u1", email: "not-admin@example.com" } },
      })),
    },
    from: vi.fn(),
  })),
}));

import { toggleProfileActive } from "@/app/dashboard/admin/actions";

describe("toggleProfileActive", () => {
  it("rejects a non-admin caller", async () => {
    const result = await toggleProfileActive("target-user-id", false);
    expect(result.error).toBe("Not authorized");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- admin-actions.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the admin action**

Create `app/dashboard/admin/actions.ts`:
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

export async function toggleProfileActive(
  userId: string,
  isActive: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email ?? "")) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/consultants");
  revalidatePath("/organizations");
  return {};
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- admin-actions.test.ts`
Expected: PASS, 1 test passed.

- [ ] **Step 5: Write failing test for the changelog parser**

Create `__tests__/lib/changelog.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(
    () => "# Changelog\n\n## 2026-07-05\n\n- First item\n- Second item\n\n## 2026-07-04\n\n- Older item\n"
  ),
}));

import { getChangelogEntries } from "@/lib/changelog";

describe("getChangelogEntries", () => {
  it("parses dated sections into entries, newest first", () => {
    const entries = getChangelogEntries();
    expect(entries).toEqual([
      { date: "2026-07-05", items: ["First item", "Second item"] },
      { date: "2026-07-04", items: ["Older item"] },
    ]);
  });
});
```

- [ ] **Step 6: Run to verify failure**

Run: `npm test -- changelog.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement the changelog parser**

Create `lib/changelog.ts`:
```typescript
import { readFileSync } from "node:fs";
import path from "node:path";

export type ChangelogEntry = {
  date: string;
  items: string[];
};

export function getChangelogEntries(): ChangelogEntry[] {
  const filePath = path.join(process.cwd(), "CHANGELOG.md");
  const raw = readFileSync(filePath, "utf-8");

  const sections = raw.split(/^## /m).slice(1);

  return sections.map((section) => {
    const [dateLine, ...rest] = section.split("\n");
    const items = rest
      .filter((line) => line.trim().startsWith("- "))
      .map((line) => line.trim().slice(2).trim());

    return { date: dateLine.trim(), items };
  });
}
```

- [ ] **Step 8: Run to verify pass**

Run: `npm test -- changelog.test.ts`
Expected: PASS, 1 test passed.

- [ ] **Step 9: Write today's changelog entry**

Create `CHANGELOG.md` at the repo root:
```markdown
# Changelog

## 2026-07-05

- Wrote the Phase 1 design spec (landing page, Supabase auth, consultant/organization profiles, Coolify deployment).
- Wrote the Phase 1 implementation plan (12 tasks, TDD, subagent-driven execution).
- Found an existing `.env.local` with live Supabase credentials and revised the architecture from a fresh Prisma/Postgres stack to Supabase (Postgres + Auth), reusing those credentials.
- Scaffolded the Next.js 15 + TypeScript + Tailwind + Vitest project.
- Added Supabase client helpers (`lib/supabase/client.ts`, `lib/supabase/server.ts`) and the `ADMIN_EMAILS` allowlist check (`lib/admin.ts`).
- Added the `profiles`, `consultant_profiles`, and `organization_profiles` schema with Row Level Security policies.
- Added Zod validation schemas for signup, login, and both profile types.
- Added signup/login pages and role-gating middleware for `/dashboard/*`.
- Added consultant and organization dashboard profile forms.
- Added public `/consultants` and `/organizations` directories.
- Added the admin dashboard with profile activation controls and this changelog panel.
```

- [ ] **Step 10: Implement the admin dashboard page (profile table + changelog panel)**

Create `app/dashboard/admin/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { toggleProfileActive } from "./actions";
import { getChangelogEntries } from "@/lib/changelog";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email, role, is_active")
    .order("created_at", { ascending: false });

  const changelog = getChangelogEntries();

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-semibold mb-8">Admin: all profiles</h1>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Role</th>
            <th className="py-2">Active</th>
            <th className="py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {(profiles ?? []).map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">{p.name}</td>
              <td className="py-2">{p.email}</td>
              <td className="py-2">{p.role}</td>
              <td className="py-2">{p.is_active ? "Yes" : "No"}</td>
              <td className="py-2">
                <form
                  action={toggleProfileActive.bind(null, p.id, !p.is_active)}
                >
                  <button type="submit" className="underline">
                    {p.is_active ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Recent updates</h2>
        {changelog.map((entry) => (
          <div key={entry.date} className="mb-6">
            <h3 className="text-sm font-medium text-slate-500">
              {entry.date}
            </h3>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {entry.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
```

- [ ] **Step 11: Manual verification**

Run: `npm run dev`. Log in with an email present in `ADMIN_EMAILS` (from `.env.local`), visit `/dashboard/admin`, confirm the profile table renders, clicking "Deactivate" on a test profile flips its status and removes it from `/consultants` or `/organizations`, and the "Recent updates" section below the table lists the `CHANGELOG.md` entries grouped by date.

- [ ] **Step 12: Run full automated test suite**

Run: `npm test`
Expected: PASS, all tests passed.

- [ ] **Step 13: Commit**

```bash
git add app/dashboard/admin lib/changelog.ts CHANGELOG.md __tests__/app/admin-actions.test.ts __tests__/lib/changelog.test.ts
git commit -m "feat: add admin dashboard with profile activation and changelog panel"
```

---

## Task 9: Landing page

**Files:**
- Modify: `app/page.tsx`
- Create: `components/layout/NavBar.tsx`
- Modify: `app/layout.tsx` (include NavBar)

**Interfaces:**
- Produces: `NavBar()` default export rendering links to `/`, `/consultants`, `/organizations`, `/login`, `/signup`.
- Consumes: nothing beyond Next.js `Link`.

- [ ] **Step 1: Implement NavBar**

Create `components/layout/NavBar.tsx`:
```tsx
import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold">
          OrgDev
        </Link>
        <div className="flex gap-6 text-sm">
          <Link href="/consultants">Consultants</Link>
          <Link href="/organizations">Organizations</Link>
          <Link href="/login">Log in</Link>
          <Link
            href="/signup"
            className="rounded bg-slate-900 px-4 py-2 text-white"
          >
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Wire NavBar into the root layout**

Modify `app/layout.tsx` to render `<NavBar />` immediately inside `<body>`, before `{children}`. Read the current file first, then add the import and the `<NavBar />` element without removing the existing font/className setup `create-next-app` generated.

- [ ] **Step 3: Implement the landing page**

Modify `app/page.tsx` to replace the `create-next-app` placeholder content with:
```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          OrgDev — the AI-powered organizational and career development
          platform
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">
          Connecting organizations with vetted coaches and consultants
          worldwide, backed by intelligent matching.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded bg-slate-900 px-6 py-3 text-white"
          >
            Get started
          </Link>
          <Link href="/consultants" className="rounded border px-6 py-3">
            Browse consultants
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-16 sm:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold">For Consultants & Coaches</h2>
          <p className="mt-2 text-sm text-slate-600">
            Build your profile, offer one-on-one sessions, and reach
            organizations looking for your expertise.
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold">For Organizations</h2>
          <p className="mt-2 text-sm text-slate-600">
            Post your development needs — from leadership training to
            cultural change — and get matched with the right expertise.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="rounded-lg border-2 border-dashed p-8 text-center">
          <h2 className="text-xl font-semibold">
            Coming soon: your AI Digital Twin
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
            A future release will let consultants activate an AI assistant
            that understands their methods and style, available to clients
            around the clock.
          </p>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Run full automated test suite**

Run: `npm test`
Expected: PASS, all tests passed (no new tests added here — this task is UI copy/layout only, verified manually next).

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, visit `/`, confirm the nav bar and all three landing sections render, and that "Get started" and "Browse consultants" links navigate correctly.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/layout.tsx components/layout
git commit -m "feat: build OrgDev landing page"
```

---

## Task 10: Health check endpoint

**Files:**
- Create: `app/api/health/route.ts`
- Test: `__tests__/app/health.test.ts`

**Interfaces:**
- Produces: `GET` handler returning `{ status: "ok" }` with HTTP 200.

- [ ] **Step 1: Write failing test**

Create `__tests__/app/health.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns status ok", async () => {
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "ok" });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- health.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the health route**

Create `app/api/health/route.ts`:
```typescript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- health.test.ts`
Expected: PASS, 1 test passed.

- [ ] **Step 5: Commit**

```bash
git add app/api/health __tests__/app/health.test.ts
git commit -m "feat: add health check endpoint for Coolify"
```

---

## Task 11: Docker and Coolify deployment

**Files:**
- Create: `Dockerfile`
- Modify: `.dockerignore` (created in Task 1 — verify it excludes `node_modules`, `.next`, `.env*.local`, `.git`)
- Modify: `next.config.ts` (set `output: "standalone"`)
- Create: `DEPLOY.md`

**Interfaces:**
- Produces: a Docker image that runs `node server.js` on port 3000, exposing `/api/health`.

- [ ] **Step 1: Enable standalone output**

Modify `next.config.ts` to add `output: "standalone"` to the exported config object (read the existing file first — `create-next-app` generates a minimal `NextConfig` object to extend, not replace).

- [ ] **Step 2: Write the Dockerfile**

Create `Dockerfile`:
```dockerfile
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

- [ ] **Step 3: Verify .dockerignore covers secrets and build junk**

Read `.dockerignore` (created in Task 1 by `create-next-app`); ensure it contains `node_modules`, `.next`, `.git`, `.env*.local`. If any are missing, add them.

- [ ] **Step 4: Build the image locally**

Run:
```bash
docker build -t orgdevco:phase1 .
```
Expected: build completes successfully with no errors.

- [ ] **Step 5: Run the image locally with real env vars**

Run (values sourced from `.env.local`, not typed into shell history or committed anywhere):
```bash
docker run --rm -p 3000:3000 --env-file .env.local -e ADMIN_EMAILS="$ADMIN_EMAILS" orgdevco:phase1
```
Then in another terminal: `curl http://localhost:3000/api/health`
Expected: `{"status":"ok"}`. Stop the container after confirming.

- [ ] **Step 6: Write Coolify deployment notes**

Create `DEPLOY.md`:
```markdown
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
```

- [ ] **Step 7: Commit**

```bash
git add Dockerfile .dockerignore next.config.ts DEPLOY.md
git commit -m "feat: add Docker build and Coolify deployment docs"
```

---

## Task 12: Push to GitHub

**Files:** none (git operations only)

**Interfaces:** none

- [ ] **Step 1: Review everything staged for the remote**

Run:
```bash
git log --oneline
git remote -v
```
Expected: shows all commits from Tasks 1–11 in order; if no remote is configured yet, add one:
```bash
git remote add origin https://github.com/ubterzioglu/orgdevco.git
```

- [ ] **Step 2: Confirm no secrets are anywhere in history**

Run:
```bash
git log --all -p | grep -iE "supabase.*key|service_role|SUPABASE_DB_URL|ADMIN_PASS" || echo "clean"
```
Expected: `clean` (no matches). If anything matches, STOP — do not push. Investigate and remove the offending commit before proceeding (this is a stop-and-ask situation, not one to resolve unilaterally).

- [ ] **Step 3: Push to the remote**

Run:
```bash
git push -u origin master
```
Expected: pushes successfully; `github.com/ubterzioglu/orgdevco` now shows the full Phase 1 commit history.

- [ ] **Step 4: Verify on GitHub**

Run: `gh repo view ubterzioglu/orgdevco --web` (or check via `gh api repos/ubterzioglu/orgdevco/commits` for the commit list).
Expected: the repository's default branch and commit list match local `git log`.

---

## Self-Review Notes

- **Spec coverage:** landing page (Task 9), Supabase auth (Task 5), consultant/organization CRUD (Tasks 4, 6, 7), admin view (Task 8), Coolify Docker deployment (Task 11), health check (Task 10) — all present. RLS and data model (Task 3) covered. `.env.local` never modified — enforced explicitly in Tasks 2, 11, and 12.
- **Type consistency:** `consultantProfileSchema`/`organizationProfileSchema` field names (Task 4) match the form field names read in Task 6's actions and the columns in Task 3's migration (`photo_url`/`photoUrl` mapped explicitly in the upsert calls since Postgres uses snake_case and the schema uses camelCase — this is intentional, not a bug, since Supabase column names are snake_case by convention).
- **No placeholders:** every step has literal code or an exact command with expected output.
