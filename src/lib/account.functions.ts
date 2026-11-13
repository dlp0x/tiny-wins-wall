import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Verifies a Cloudflare Turnstile token server-side before account creation.
 * This endpoint intentionally does not require a Supabase session: it is called
 * while the visitor is still anonymous, and Turnstile is the proof checked here.
 * It does not create or modify an account. Fails closed without the secret.
 */
export const verifyCaptcha = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => {
    if (typeof input?.token !== "string" || input.token.length < 10 || input.token.length > 4096)
      throw new Error("invalid_token");
    return input;
  })
  .handler(async ({ data }) => {
    const secret = process.env["TURNSTILE_SECRET_KEY"];
    if (!secret) {
      console.error("littlewins: TURNSTILE_SECRET_KEY missing");
      return { ok: false };
    }
    const body = new URLSearchParams({ secret, response: data.token });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const json = (await res.json().catch(() => ({}))) as { success?: boolean };
    return { ok: res.ok && json.success === true };
  });

/**
 * Permanent deletion of the CALLER's own permanent account and all its data.
 * Order: private data first, then the auth user. Anonymous identities are refused.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const claims = context.claims as { is_anonymous?: boolean };
    if (claims.is_anonymous) throw new Error("Forbidden");
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as unknown as {
      rpc: (fn: string, args: Record<string, string>) => Promise<{ error: unknown | null }>;
    };

    // A single SECURITY DEFINER RPC keeps every deletion in one PostgreSQL
    // transaction. If any step fails, the whole operation is rolled back.
    const { error } = await admin.rpc("delete_account_data", { _user_id: userId });
    if (error) {
      console.error("littlewins: atomic account deletion failed", error);
      return { ok: false };
    }
    return { ok: true };
  });
