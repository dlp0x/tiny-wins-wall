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

## Permanent accounts (Sprint 6)

> You can have an account without having an identity here.

- **Why an anonymous identity:** so your hearts (and, once `queries.sql` 6.1 is
  run, your wins) belong to the same invisible id across visits.
- **Why an account is optional:** it only adds continuity across browsers and
  devices plus control over your data. The wall works without it.
- **Conversion keeps the same id:** "Create my account" (footer → Account)
  attaches an email + password to the *current* anonymous user with Supabase's
  official linking (`updateUser`). No new user, no copy. A verification email
  is sent. If the email already belongs to an account, Supabase refuses and
  nothing is created or changed; the user is invited to sign in.
- **CAPTCHA:** Cloudflare Turnstile, verified by the app server before the
  conversion. (Auth's built-in CAPTCHA would also block the silent anonymous
  sign-in, so it stays off.)
- **What can be linked to an account:** your email (private), your hearts, your
  wins written after 6.1. Nothing else.
- **What others see:** wins only, never an email, name or owner.
- **Browser data cleared before creating an account:** the anonymous identity
  and its hearts are lost for you (wins stay on the wall, unowned).
- **Another device:** signing in makes the permanent account the source of
  truth. The device's temporary anonymous identity is *not* merged; its hearts
  stay with that abandoned identity. Signing out gives a fresh anonymous visitor.
- **Deactivate vs delete:** deactivation is reversible — data kept, your wins
  hidden from the wall, you're signed out; on next sign-in you're asked to
  reactivate (or delete). Deletion is permanent and runs as one database
  transaction: account, your wins, your hearts and your account status row are
  erased. Other visitors' hearts on your wins are also erased because those
  hearts belong to the deleted wins. If any deletion step fails, the whole
  transaction rolls back.
- **Wins written before 6.1** have no owner and cannot be hidden or deleted
  with an account.
