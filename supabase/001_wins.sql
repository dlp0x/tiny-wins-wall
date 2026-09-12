-- littlewins — Sprint 4A
-- Run this once in the Supabase SQL Editor.

create table if not exists public.wins (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(trim(content)) between 1 and 200),
  language text not null check (language in ('en', 'fr')),
  status text not null default 'published' check (status in ('published', 'pending', 'rejected')),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists wins_published_created_at_idx
  on public.wins (created_at desc)
  where status = 'published';

alter table public.wins enable row level security;

revoke all on table public.wins from anon, authenticated;
grant select, insert on table public.wins to anon, authenticated;

-- Public wall: visitors can only read published wins.
drop policy if exists "Anyone can read published wins" on public.wins;
create policy "Anyone can read published wins"
  on public.wins
  for select
  to anon, authenticated
  using (status = 'published');

-- Sprint 4A intentionally allows anonymous publishing so the end-to-end
-- connection can be tested. Moderation/anti-spam will tighten this in 4B.
drop policy if exists "Anyone can submit a win" on public.wins;
create policy "Anyone can submit a win"
  on public.wins
  for insert
  to anon, authenticated
  with check (
    status = 'published'
    and char_length(trim(content)) between 1 and 200
    and language in ('en', 'fr')
  );

-- Seed the current demo wall so the new backend does not start empty.
insert into public.wins (content, language, status, published_at, created_at)
select * from (values
  ('Finally answered the email I''d been carrying around for a month.', 'en', 'published', now(), now() - interval '2 hours'),
  ('Made the bed before the alarm went off. Twice.', 'en', 'published', now(), now() - interval '3 hours'),
  ('Said the thing out loud. It came out better than I was afraid it would.', 'en', 'published', now(), now() - interval '5 hours'),
  ('Took out the recycling on a Tuesday.', 'en', 'published', now(), now() - interval '8 hours'),
  ('Walked instead of scrolling. The sky was weirdly pink and I just stood there for a while.', 'en', 'published', now(), now() - interval '12 hours'),
  ('Drank the whole glass of water before the coffee.', 'en', 'published', now(), now() - interval '14 hours'),
  ('Finished the chapter I kept putting off.', 'en', 'published', now(), now() - interval '24 hours'),
  ('Watered the plant and remembered its name.', 'en', 'published', now(), now() - interval '48 hours'),
  ('Bought the flowers on purpose, for me.', 'en', 'published', now(), now() - interval '52 hours'),
  ('Didn''t check my phone for the first full hour of the day.', 'en', 'published', now(), now() - interval '72 hours')
) as seed(content, language, status, published_at, created_at)
where not exists (select 1 from public.wins);
