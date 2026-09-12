import { supabase } from "@/lib/supabase";

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
  return data ?? [];
}

export async function createWin(content: string, language: "en" | "fr"): Promise<DbWin> {
  const { data, error } = await supabase
    .from("wins")
    .insert({ content, language, status: "published" })
    .select("id, content, language, created_at")
    .single();

  if (error) throw error;
  return data;
}
