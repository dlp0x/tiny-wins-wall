-- littlewins
-- Sprint 5A — Anonymous Identity
-- IMPORTANT:
-- This file is intentionally NOT executed by Lovable.
-- Run manually in the Supabase SQL Editor.
--
-- Summary: Sprint 5A requires NO schema change and NO change to the existing
-- `wins` table, its grants, or its RLS policies. Anonymous identity is provided
-- by Supabase Auth itself (auth.users rows with is_anonymous = true).
--
-- The only required action is a settings change, not SQL:
--   Authentication → Sign In / Providers → enable "Anonymous sign-ins".
-- Without it, the app keeps working, but no anonymous user id is issued.
--
-- The statements below are verification only. They read; they change nothing.

-- 1) Confirm anonymous users are being created.
select id, created_at, is_anonymous
from auth.users
where is_anonymous is true
order by created_at desc
limit 20;

-- 2) Confirm the existing wins policies are unchanged (read published,
--    anonymous insert of published wins). Expected: the two Sprint 4 policies.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'wins'
order by policyname;

-- 3) Confirm grants on public.wins are unchanged (select, insert for
--    anon and authenticated).
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'wins'
order by grantee, privilege_type;

-- Nothing to run for Sprint 5B (favorites / "petits cœurs") yet. The favorites
-- table and its RLS policies referencing auth.uid() will be added to this file
-- in that sprint.
