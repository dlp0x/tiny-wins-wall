import { supabase } from "@/integrations/supabase/client";

export type DbWin = {
  id: string;
  content: string;
  language: "en" | "fr";
  created_at: string;
};

export async function fetchWins(language: "en" | "fr"): Promise<DbWin[]> {
  const { data, error } = await supabase
    .from("wins")
    .select("id, content, language, created_at")
    .eq("status", "published")
    .eq("language", language)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as DbWin[];
}

export const MAX_WIN_LENGTH = 200;

/** A win must have real content: at least one letter or digit, within the length limit. */
export function isValidWin(raw: string): boolean {
  const content = raw.trim();
  if (content.length === 0 || content.length > MAX_WIN_LENGTH) return false;
  return /[\p{L}\p{N}]/u.test(content);
}

export async function createWin(raw: string, language: "en" | "fr"): Promise<DbWin> {
  const content = raw.trim();
  if (!isValidWin(content)) throw new Error("invalid_win");

  const { data, error } = await supabase
    .from("wins")
    .insert({ content, language, status: "published" })
    .select("id, content, language, created_at")
    .single();

  if (error) throw error;
  return data;
}
