import { supabase } from "@/integrations/supabase/client";
import { containsUrl } from "@/lib/url-detect";

export type DbWin = {
  id: string;
  content: string;
  language: "en" | "fr";
  created_at: string;
};

export async function fetchWins(): Promise<DbWin[]> {
  const { data, error } = await supabase
    .from("wins")
    .select("id, content, language, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as DbWin[];
}

export const MAX_WIN_LENGTH = 200;

/** A win must have real content (a letter or digit), fit the length limit, and contain no link. */
export function isValidWin(raw: string): boolean {
  const content = raw.trim();
  if (content.length === 0 || content.length > MAX_WIN_LENGTH) return false;
  if (containsUrl(content)) return false;
  return /[\p{L}\p{N}]/u.test(content);
}

export async function createWin(raw: string, language: "en" | "fr"): Promise<DbWin> {
  const content = raw.trim();
  if (containsUrl(content)) throw new Error("contains_link");
  if (!isValidWin(content)) throw new Error("invalid_win");

  const { data, error } = await supabase
    .from("wins")
    .insert({ content, language, status: "published" })
    .select("id, content, language, created_at")
    .single();

  if (error) throw error;
  return data as DbWin;
}
