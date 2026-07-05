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
