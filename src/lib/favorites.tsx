import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAnonymousIdentity } from "@/lib/anon-identity";
import { addFavorite, fetchMyFavorites, removeFavorite } from "@/lib/favorites-api";

type Ctx = {
  /** True when the current identity has favorited this win. */
  isFavorite: (winId: string) => boolean;
  /** Toggles the favorite. No-op when no identity is available yet. */
  toggle: (winId: string) => void;
  /** False while no Supabase identity is available (heart stays inert). */
  ready: boolean;
};

const FavoritesContext = createContext<Ctx | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const userId = useAnonymousIdentity();
  const [ids, setIds] = useState<Set<string>>(new Set());

  // Restore favorites for this identity after every reload / identity change.
  useEffect(() => {
    let active = true;
    if (!userId) {
      setIds(new Set());
      return;
    }
    fetchMyFavorites(userId)
      .then((set) => {
        if (active) setIds(set);
      })
      .catch((err) => {
        // Never blocks the wall.
        console.warn("littlewins: favorites unavailable", err);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const toggle = useCallback(
    (winId: string) => {
      if (!userId) return;
      const wasFavorite = ids.has(winId);
      // Optimistic: the database stays the single source of truth; on failure
      // we simply roll back.
      setIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.delete(winId);
        else next.add(winId);
        return next;
      });
      const op = wasFavorite ? removeFavorite(userId, winId) : addFavorite(userId, winId);
      op.catch((err) => {
        console.warn("littlewins: favorite not saved", err);
        setIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(winId);
          else next.delete(winId);
          return next;
        });
      });
    },
    [ids, userId],
  );

  const isFavorite = useCallback((winId: string) => ids.has(winId), [ids]);

  return (
    <FavoritesContext.Provider value={{ isFavorite, toggle, ready: Boolean(userId) }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): Ctx {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
