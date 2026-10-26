# Anonymous identity (Sprint 5A)

## Why it exists

littlewins stays usable without any account. An invisible anonymous identity
lets us attach personal actions — starting with the upcoming favorites
("petits cœurs") — to the same person across visits, without exposing who they
are. Later, that same identity can be upgraded to a permanent account while
keeping the same `user_id` and the data already attached to it.

## What it contains

- A technical Supabase user id (an `auth.users` row with `is_anonymous = true`).

## What it does not contain

- No public name, no nickname, no profile, no avatar.
- No email or password required.
- No personal data is requested, stored, or displayed anywhere in the UI.

## How it works in the app

`src/lib/anon-identity.ts` exposes `ensureAnonymousIdentity()` and the
`useAnonymousIdentity()` hook. On first load it reuses the existing Supabase
session, or calls `supabase.auth.signInAnonymously()` if there is none. It uses
the project's existing Supabase configuration (`src/integrations/supabase/client.ts`,
which persists the session in the browser).

Failure is non-blocking by design: any error resolves to `null`, is logged to
the console only, and the wall loads and works exactly as before. No technical
error and no credential is ever shown to the visitor.

## Prerequisite (manual)

Anonymous sign-ins must be enabled in the project's authentication settings.
This has not been changed by Lovable. Until it is enabled, the app runs
normally but no anonymous id is issued.

## Important limitation

An anonymous identity lives in the browser/device session. If local data is
cleared, or the person switches browser or device before creating a permanent
account, the anonymous data may not be recoverable. This must also be explained
later in the public littlewins FAQ.

## Favorites ("petits cœurs", Sprint 5B)

Each win shows a small ♡ that becomes ♥ when kept. A favorite is a row in
`public.favorites` (`user_id`, `win_id`), unique per pair at the database
level, readable/creatable/deletable only by its owner (`auth.uid() = user_id`).
No count is ever shown or exposed. Favorites are reloaded from the database for
the current identity on every visit; there is no local copy. When an anonymous
identity is later linked to a permanent account, Supabase keeps the same user
id, so favorites follow without migration. SQL lives in `queries.sql`
(run manually). Until anonymous sign-ins are enabled, the heart stays inert.
