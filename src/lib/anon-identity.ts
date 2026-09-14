import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Sprint 5A — Anonymous identity foundation.
 *
 * Gives the visitor a Supabase anonymous user id, silently.
 * No UI, no account, no personal data. Never blocks the wall:
 * every failure resolves to `null` and is only logged to the console.
 *
 * Requires anonymous sign-ins to be enabled in the project's auth settings
 * (see docs/anonymous-identity.md). Until then, this resolves to `null`.
 */
export async function ensureAnonymousIdentity(): Promise<string | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const existing = sessionData.session?.user?.id;
    if (existing) return existing;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn("littlewins: anonymous identity unavailable", error.message);
      return null;
    }
    return data.user?.id ?? null;
  } catch (err) {
    console.warn("littlewins: anonymous identity unavailable", err);
    return null;
  }
}

/** Resolves the anonymous user id once per mount. Never throws. */
export function useAnonymousIdentity(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    ensureAnonymousIdentity().then((id) => {
      if (active) setUserId(id);
    });
    return () => {
      active = false;
    };
  }, []);

  return userId;
}
