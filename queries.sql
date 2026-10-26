-- littlewins
-- IMPORTANT:
-- This file is intentionally NOT executed by Lovable.
-- Run manually in the Supabase SQL Editor.

-- =====================================================================
-- Sprint 5A — Anonymous Identity (verification only, no schema change)
-- =====================================================================
-- Anonymous identity is provided by Supabase Auth itself (auth.users rows
-- with is_anonymous = true). The only required action is a settings change:
--   Authentication → Sign In / Providers → enable "Anonymous sign-ins".
-- Without it, the app keeps working, but no anonymous user id is issued,
-- and therefore no favorite can be persisted.

-- 1) Confirm anonymous users are being created.
select id, created_at, is_anonymous
from auth.users
where is_anonymous is true
order by created_at desc
limit 20;

-- 2) Confirm the existing wins policies are unchanged.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'wins'
order by policyname;

-- 3) Confirm grants on public.wins are unchanged.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'wins'
order by grantee, privilege_type;


-- =====================================================================
-- Sprint 5B — Favorites ("petits cœurs")
-- =====================================================================
-- Model: user_id ── favorite ── win_id
-- - user_id references the current Supabase identity (anonymous today,
--   possibly a permanent account later). Converting an anonymous user to a
--   permanent account keeps the same auth.users id, so favorites follow the
--   user with no data migration.
-- - One favorite per (user_id, win_id), enforced by the database.
-- - Private by design: a user can only read/create/delete their own rows.
--   No public counter, no aggregate exposed through the Data API.

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, -- auth.uid() of the current identity (no FK to auth.users by convention)
  win_id uuid not null references public.wins(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_user_win_unique unique (user_id, win_id)
);

-- Fast lookup of "my favorites" on page load.
create index if not exists favorites_user_id_idx on public.favorites (user_id);
-- Internal-only future usage (popularity); never exposed publicly.
create index if not exists favorites_win_id_idx on public.favorites (win_id);

-- Data API access. Anonymous auth users are the `authenticated` role, so no
-- anon grant is needed: every policy is scoped to auth.uid().
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;

alter table public.favorites enable row level security;

drop policy if exists "Users can read their own favorites" on public.favorites;
create policy "Users can read their own favorites"
  on public.favorites for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own favorites" on public.favorites;
create policy "Users can create their own favorites"
  on public.favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own favorites" on public.favorites;
create policy "Users can delete their own favorites"
  on public.favorites for delete
  to authenticated
  using (auth.uid() = user_id);

-- No update policy on purpose: a favorite is created or removed, never edited.
-- public.wins is intentionally left untouched by this sprint.

-- Verification (read only):
-- select policyname, cmd, roles, qual, with_check
-- from pg_policies where schemaname = 'public' and tablename = 'favorites';
-- select count(*) from public.favorites;
