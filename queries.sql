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


-- =====================================================================
-- Sprint — Block URLs in wins (GitHub issue #5) — PROPOSAL, NOT EXECUTED
-- =====================================================================
-- Today the link rule is enforced in the browser only. A direct request to
-- the database API can still insert a win containing a link. This adds the
-- same rule server-side as a CHECK constraint (applies to every insert/update,
-- whatever the client). Mirrors src/lib/url-detect.ts — keep both in sync.
-- NOT VALID: existing rows are not re-checked; only new writes are.
-- Includes spaced-dot domains only when they end like a URL, plus bare IPv4 addresses.

create or replace function public.win_contains_url(t text)
returns boolean language sql immutable as $$
  select
    t ~* '[a-z][a-z0-9+.-]*:\s*//'
    or t ~* '(^|[^[:alnum:]])(javascript|data|mailto)\s*:'
    or t ~* '(^|[^[:alnum:]])www\s*([.。．]|\s*[\[(]\s*(\.|dot|point)\s*[\])]\s*|\s+(dot|point)\s+)\s*[[:alnum:]]'
    or t ~* '[[:alnum:]-]+([.。．]|\s*[\[(]\s*(\.|dot|point)\s*[\])]\s*|\s+(dot|point)\s+)(com|net|org|ca|fr|io|co|uk|de|be|ch|eu|us|info|biz|app|dev|me|ly|gg|tv|xyz|site|online|shop|store|link|page|ai|qc|quebec|art|blog|news|live|club|top|to|sh|so|fm|cc|ru|cn|es|it|nl)([^[:alnum:]]|$)'
    or t ~* '(^|[^[:alnum:]])[[:alnum:]-]+[[:space:]]+[.][[:space:]]+(com|net|org|ca|fr|io|co|uk|de|be|ch|eu|us|info|biz|app|dev|me|ly|gg|tv|xyz|site|online|shop|store|link|page|ai|qc|quebec|art|blog|news|live|club|top|to|sh|so|fm|cc|ru|cn|es|it|nl)([[:space:]]*$|[/#?]|[.][[:space:]]*$|[!;:)]([[:space:]]|$))'
    or t ~* '(^|[^[:digit:]])([0-9]{1,3}[.]){3}[0-9]{1,3}([^[:digit:]]|$)'
$$;

alter table public.wins
  add constraint wins_no_url check (not public.win_contains_url(content)) not valid;

-- Verify after running (should fail with a check violation):
-- insert into public.wins (content, language) values ('see example.com', 'en');
-- Rollback if needed:
-- alter table public.wins drop constraint wins_no_url;
-- drop function public.win_contains_url(text);


-- =====================================================================
-- Sprint 6 — Permanent accounts, no public identity — PROPOSAL, NOT EXECUTED
-- =====================================================================
-- Run manually, in order, in the SQL editor. Lovable executed nothing.
--
-- Manual AUTH settings (not SQL) also required:
--   * Anonymous sign-ins: ON (already required since Sprint 5A).
--   * Email provider: ON, "Confirm email": ON (verification link).
--   * Site URL / redirect URLs: add the site origin and <origin>/reset-password.
--   * Do NOT enable the built-in auth CAPTCHA: it would also require a CAPTCHA
--     for the silent anonymous sign-in and break the wall. Turnstile is
--     verified by the app server (secret TURNSTILE_SECRET_KEY) instead.

-- 6.1 Link wins to their author (private, never exposed on the wall).
-- WHY: wins have no owner today, so they cannot follow an account, be hidden
-- on deactivation, or be deleted with the account.
-- RISK: existing wins stay user_id = NULL (author unknowable) → they are never
-- hidden/deleted by account actions. Nullable + default = no app breakage.
alter table public.wins add column if not exists user_id uuid default auth.uid();
create index if not exists wins_user_id_idx on public.wins (user_id);
-- The app never selects user_id. To guarantee it is never readable through the
-- public API, restrict column privileges:
revoke select on public.wins from anon, authenticated;
grant select (id, content, language, status, created_at, published_at) on public.wins to anon, authenticated;
-- Insert: user_id may only be your own id (or null for no identity).
drop policy if exists "Anyone can submit a win" on public.wins;
create policy "Anyone can submit a win" on public.wins for insert to anon, authenticated
  with check (
    status = 'published'
    and char_length(trim(content)) between 1 and 200
    and language = any (array['en','fr'])
    and (user_id is null or user_id = auth.uid())
  );

-- 6.2 Reversible deactivation. A row here = account deactivated. Nothing deleted.
create table if not exists public.account_status (
  user_id uuid primary key, -- auth.uid(); no FK to auth.users by convention
  deactivated_at timestamptz not null default now()
);
grant select, insert, delete on public.account_status to authenticated;
grant all on public.account_status to service_role;
alter table public.account_status enable row level security;
create policy "Read own status" on public.account_status for select to authenticated
  using (auth.uid() = user_id);
-- Only permanent (non-anonymous) accounts can deactivate.
create policy "Deactivate own account" on public.account_status for insert to authenticated
  with check (auth.uid() = user_id and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
create policy "Reactivate own account" on public.account_status for delete to authenticated
  using (auth.uid() = user_id);

-- Hide wins of deactivated accounts from the wall (security definer avoids
-- exposing account_status to visitors).
create or replace function public.is_deactivated(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.account_status where user_id = _user_id)
$$;
revoke all on function public.is_deactivated(uuid) from public;
grant execute on function public.is_deactivated(uuid) to anon, authenticated;

drop policy if exists "Anyone can read published wins" on public.wins;
create policy "Anyone can read published wins" on public.wins for select to anon, authenticated
  using (status = 'published' and (user_id is null or not public.is_deactivated(user_id)));

-- 6.3 Permanent deletion — one atomic database transaction.
-- The app server calls this function with the service-role client. The function
-- deletes the caller's private data, their wins (which cascade-delete ALL hearts
-- on those wins, including hearts from other visitors), their status row, and
-- finally the auth user. If any statement fails, PostgreSQL rolls back the
-- entire operation; there can be no half-deleted account.
--
-- SECURITY: executable only by service_role. Never grant this function to
-- anon/authenticated. The server endpoint separately verifies that the
-- authenticated caller is a permanent (non-anonymous) account.
create or replace function public.delete_account_data(_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'service_role_required';
  end if;

  delete from public.favorites where user_id = _user_id;
  delete from public.wins where user_id = _user_id;
  delete from public.account_status where user_id = _user_id;
  delete from auth.users where id = _user_id;
end;
$function$;

revoke all on function public.delete_account_data(uuid) from public, anon, authenticated;
grant execute on function public.delete_account_data(uuid) to service_role;

-- Validation (read only):
-- select proname, prosecdef from pg_proc
-- where proname = 'delete_account_data' and pronamespace = 'public'::regnamespace;
-- After a deletion: select count(*) from public.wins where user_id = '<id>';       -- 0
--                   select count(*) from public.favorites where user_id = '<id>';  -- 0
--                   select count(*) from auth.users where id = '<id>';             -- 0

-- Validation (read only):
-- select column_name from information_schema.columns where table_name='wins';
-- select policyname, cmd, qual, with_check from pg_policies where tablename in ('wins','account_status');
-- After a deletion:  select count(*) from public.wins where user_id = '<id>';      -- 0
--                    select count(*) from public.favorites where user_id = '<id>'; -- 0
--                    select count(*) from auth.users where id = '<id>';            -- 0
-- Rollback 6.2 read policy: recreate the Sprint 4 policy (status = 'published').
