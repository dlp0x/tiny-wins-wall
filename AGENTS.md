<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Auth state comes only from `src/lib/auth.tsx` (AuthProvider) over the single generated browser client — no second client or listener, so identity stays consistent.
- Anonymous → permanent uses `updateUser` on the current anonymous user, never `signUp` — keeps the same user_id.
- Lovable never runs SQL or changes backend settings here; all backend changes go to `queries.sql` for the owner to run — owner requirement.
- Account access lives only in the footer; no public identity anywhere — product rule.
