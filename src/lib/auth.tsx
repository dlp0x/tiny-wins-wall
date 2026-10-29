import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureAnonymousIdentity } from "@/lib/anon-identity";

/**
 * Sprint 6 — single source of truth for the current Supabase identity
 * (anonymous or permanent). Reuses the one browser client. Never blocks the
 * wall: with no identity, everything keeps working with `userId = null`.
 */
export type AuthState = {
  ready: boolean;
  userId: string | null;
  /** Private: only ever shown inside the account panel, never on the wall. */
  email: string | null;
  isPermanent: boolean;
  /** Email address change still waiting for confirmation (conversion pending). */
  pendingEmail: string | null;
};

const empty: AuthState = { ready: false, userId: null, email: null, isPermanent: false, pendingEmail: null };

// eslint-disable-next-line react-refresh/only-export-components
export function toAuthState(user: User | null | undefined): AuthState {
  if (!user) return { ...empty, ready: true };
  const isPermanent = !user.is_anonymous && Boolean(user.email);
  return {
    ready: true,
    userId: user.id,
    email: isPermanent ? (user.email ?? null) : null,
    isPermanent,
    pendingEmail: user.new_email ?? null,
  };
}

const AuthContext = createContext<AuthState>(empty);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(empty);

  useEffect(() => {
    let active = true;
    // Initial: reuse session or silently create the anonymous identity.
    ensureAnonymousIdentity().then(async () => {
      const { data } = await supabase.auth.getSession();
      if (active) setState(toAuthState(data.session?.user));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT") {
        setState({ ...empty, ready: true });
        // Back to being a visitor: a fresh anonymous identity (never merged).
        ensureAnonymousIdentity().then(async () => {
          const { data } = await supabase.auth.getSession();
          if (active) setState(toAuthState(data.session?.user));
        });
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setState(toAuthState(session?.user));
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  return useContext(AuthContext);
}
