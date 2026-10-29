import { supabase } from "@/integrations/supabase/client";

/**
 * Sprint 6 — permanent accounts, no public identity.
 * All calls go through the single browser client.
 */

export type AccountError =
  | "email_exists"
  | "weak_password"
  | "invalid_email"
  | "invalid_credentials"
  | "email_not_confirmed"
  | "captcha"
  | "rate_limited"
  | "no_identity"
  | "unknown";

/** Maps provider errors to calm, non-revealing codes. Never echoes raw messages. */
export function mapAuthError(err: unknown): AccountError {
  const e = (err ?? {}) as { code?: string; message?: string; status?: number };
  const code = e.code ?? "";
  const msg = (e.message ?? "").toLowerCase();
  if (code === "email_exists" || code === "user_already_exists" || msg.includes("already been registered"))
    return "email_exists";
  if (code === "weak_password" || msg.includes("password should")) return "weak_password";
  if (code === "email_address_invalid" || code === "validation_failed" || msg.includes("invalid format"))
    return "invalid_email";
  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) return "invalid_credentials";
  if (code === "email_not_confirmed") return "email_not_confirmed";
  if (code === "captcha_failed" || msg === "captcha") return "captcha";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || e.status === 429)
    return "rate_limited";
  if (msg === "no_identity") return "no_identity";
  return "unknown";
}

export const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

/**
 * Converts the CURRENT anonymous identity into a permanent account.
 * Uses Supabase's official linking path (updateUser on the anonymous user):
 * the auth.users row and its id are kept; no new user is created, no data copied.
 * If the email belongs to another account, Supabase refuses and nothing changes.
 */
export async function convertAnonymousToPermanent(email: string, password: string): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user || !user.is_anonymous) throw new Error("no_identity");
  const redirect = typeof window === "undefined" ? undefined : window.location.origin;
  // Step 1: attach the email (sends the verification link).
  const { error: emailErr } = await supabase.auth.updateUser(
    { email: email.trim() },
    { emailRedirectTo: redirect },
  );
  if (emailErr) throw emailErr;
  // Step 2: set the password on the same user id.
  const { error: pwErr } = await supabase.auth.updateUser({ password });
  if (pwErr) throw pwErr;
}

export async function signInPermanent(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data.user.id;
}

export async function signOutAccount(): Promise<void> {
  await supabase.auth.signOut();
}

export async function sendPasswordReset(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) throw error;
}

// `account_status` comes from queries.sql (run manually); not in generated types yet.
type LooseClient = { from: (table: string) => any };
const db = supabase as unknown as LooseClient;

/** True when this account is deactivated. Errors resolve to false (never blocks). */
export async function isDeactivated(userId: string): Promise<boolean> {
  try {
    const { data, error } = await db
      .from("account_status")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  } catch (err) {
    console.warn("littlewins: account status unavailable", err);
    return false;
  }
}

/** Reversible: hides this account's wins from the wall, deletes nothing. */
export async function deactivateAccount(userId: string): Promise<void> {
  const { error } = await db.from("account_status").insert({ user_id: userId });
  if (error && error.code !== "23505") throw error;
}

export async function reactivateAccount(userId: string): Promise<void> {
  const { error } = await db.from("account_status").delete().eq("user_id", userId);
  if (error) throw error;
}
