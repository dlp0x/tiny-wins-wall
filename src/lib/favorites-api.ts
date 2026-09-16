import { supabase } from "@/integrations/supabase/client";

/**
 * Sprint 5B — "petits cœurs".
 *
 * A favorite links the current Supabase identity (anonymous today, possibly a
 * permanent account later — same user_id) to a win. Personal and private:
 * never displayed publicly, never counted in the UI.
 *
 * The table `public.favorites` is created manually from queries.sql.
 * Uniqueness of (user_id, win_id) is enforced by the database.
 */

// The generated Supabase types are auto-generated and do not know about
// `favorites` until the manual migration is run, so this table is accessed
// through a narrow untyped view of the same single browser client.
type LooseClient = {
  from: (table: string) => any;
};

const db = supabase as unknown as LooseClient;

/** Win ids the current identity has favorited. Empty when no identity. */
export async function fetchMyFavorites(userId: string | null): Promise<Set<string>> {
  if (!userId) return new Set();
  const { data, error } = await db.from("favorites").select("win_id").eq("user_id", userId);
  if (error) throw error;
  return new Set(((data ?? []) as { win_id: string }[]).map((row) => row.win_id));
}

export async function addFavorite(userId: string, winId: string): Promise<void> {
  const { error } = await db
    .from("favorites")
    .upsert({ user_id: userId, win_id: winId }, { onConflict: "user_id,win_id" });
  if (error) throw error;
}

export async function removeFavorite(userId: string, winId: string): Promise<void> {
  const { error } = await db
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("win_id", winId);
  if (error) throw error;
}
