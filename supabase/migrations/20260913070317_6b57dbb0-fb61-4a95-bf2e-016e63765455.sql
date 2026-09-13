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

grant select, insert on table public.wins to anon, authenticated;
grant all on table public.wins to service_role;

alter table public.wins enable row level security;

drop policy if exists "Anyone can read published wins" on public.wins;
create policy "Anyone can read published wins"
  on public.wins
  for select
  to anon, authenticated
  using (status = 'published');

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
  ('Didn''t check my phone for the first full hour of the day.', 'en', 'published', now(), now() - interval '72 hours'),
  ('J''ai enfin répondu à ce courriel que je repoussais depuis des semaines.', 'fr', 'published', now(), now() - interval '1 hour'),
  ('J''ai pris une vraie pause sans culpabiliser.', 'fr', 'published', now(), now() - interval '4 hours'),
  ('J''ai marché un peu plus longtemps juste parce que la soirée était belle.', 'fr', 'published', now(), now() - interval '7 hours'),
  ('J''ai rangé un coin qui me dérangeait depuis trop longtemps.', 'fr', 'published', now(), now() - interval '10 hours'),
  ('J''ai appelé quelqu''un que je n''avais pas pris le temps de contacter.', 'fr', 'published', now(), now() - interval '16 hours'),
  ('J''ai dit non sans avoir besoin de me justifier.', 'fr', 'published', now(), now() - interval '20 hours'),
  ('J''ai terminé quelque chose que je repoussais depuis longtemps.', 'fr', 'published', now(), now() - interval '30 hours'),
  ('J''ai acheté les fleurs juste parce qu''elles me faisaient sourire.', 'fr', 'published', now(), now() - interval '44 hours'),
  ('J''ai pris le temps de regarder le ciel au lieu de regarder mon téléphone.', 'fr', 'published', now(), now() - interval '60 hours'),
  ('Aujourd''hui, je me suis couché un peu plus fier de moi qu''hier.', 'fr', 'published', now(), now() - interval '84 hours')
) as seed(content, language, status, published_at, created_at)
where not exists (select 1 from public.wins);