# Sprint 5A.1 — Une seule connexion à la base côté navigateur

## Audit (fait, sans rien modifier)

Deux connexions sont créées dans le navigateur :

1. `src/integrations/supabase/client.ts` — connexion officielle générée par la plateforme. Elle garde la session (persistance, rafraîchissement auto) et est utilisée par l'identité anonyme (`src/lib/anon-identity.ts`).
2. `src/lib/supabase.ts` — connexion écrite à la main lors des premiers sprints, sans persistance de session. Elle est utilisée uniquement par la lecture/création des petites victoires (`src/lib/wins-api.ts`).

C'est ce doublon qui déclenche l'avertissement « Multiple GoTrueClient instances » : deux systèmes d'authentification vivent en parallèle dans la même page.

Les deux autres connexions trouvées (`client.server.ts`, `auth-middleware.ts`) tournent uniquement côté serveur et ne comptent pas dans l'avertissement — elles ne sont pas touchées.

Aucune raison architecturale ne justifie le doublon : la connexion officielle sait tout faire, avec en plus la session persistée.

## Changements prévus (2 fichiers, aucun effet visuel)

- `src/lib/wins-api.ts` : remplacer l'import de `@/lib/supabase` par `@/integrations/supabase/client`. Le reste du fichier ne bouge pas.
- `src/lib/supabase.ts` : supprimé (plus aucun autre fichier ne l'utilise).

Rien d'autre : pas de SQL, pas de `queries.sql`, pas de `.env`, pas de réglages du backend, pas de design.

## Vérification

- Console du navigateur : l'avertissement « Multiple GoTrueClient instances » doit avoir disparu.
- L'identité anonyme est toujours créée et conservée après rechargement (même identifiant).
- Le mur charge les victoires, en FR et en EN séparément, dans le bon ordre.
- Une nouvelle victoire peut être publiée et apparaît en tête.
- Une panne d'authentification ne bloque toujours pas le mur.

## Détail technique

Les victoires passeront désormais par un client typé (`Database`), ce qui peut révéler des écarts de typage sur la table des victoires ; ils seront corrigés dans `wins-api.ts` sans changer le comportement.
