import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Verifies a Cloudflare Turnstile token server-side before account creation.
 * Fails closed: without the TURNSTILE_SECRET_KEY secret, creation is refused.
 */
export const verifyCaptcha = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
    return { ok: json.success === true };
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
    const admin = supabaseAdmin as unknown as { from: (t: string) => any; auth: typeof supabaseAdmin.auth };

    const steps: [string, string][] = [
      ["favorites", "user_id"],
      ["wins", "user_id"], // other people's favorites on these wins cascade
      ["account_status", "user_id"],
    ];
    for (const [table, col] of steps) {
      const { error } = await admin.from(table).delete().eq(col, userId);
      if (error) {
        console.error(`littlewins: delete ${table} failed`, error);
        return { ok: false };
      }
    }
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("littlewins: delete auth user failed", error);
      return { ok: false };
    }
    return { ok: true };
  });
