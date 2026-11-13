import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { MIN_PASSWORD_LENGTH, mapAuthError } from "@/lib/account-api";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password · littlewins" },
      { name: "description", content: "Choose a new password for your littlewins account." },
      { property: "og:title", content: "Reset password · littlewins" },
      { property: "og:description", content: "Choose a new password for your littlewins account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setRecovery(true);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    if (busy || password.length < MIN_PASSWORD_LENGTH) return;
    setBusy(true);
    setError(false);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      console.warn("littlewins: reset failed", mapAuthError(err));
      setError(true);
    } else setDone(true);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background p-5">
      <div className="w-full max-w-md border border-line bg-surface p-7 sm:p-10">
        <p className="text-[10px] font-medium text-muted-foreground">littlewins</p>
        <h1 className="mt-3 font-display text-3xl leading-tight">
          Nouveau mot de passe · New password
        </h1>
        {done ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Mot de passe mis à jour. · Password updated.
          </p>
        ) : !recovery ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Ouvrez le lien reçu par courriel. · Open the link from your email.
          </p>
        ) : (
          <>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              disabled={busy}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={`≥ ${MIN_PASSWORD_LENGTH}`}
              aria-label="Mot de passe · Password"
              className="mt-6 w-full border-0 border-b border-line bg-transparent px-0 py-3 text-base outline-none focus:border-ink"
            />
            {error ? (
              <p role="alert" className="mt-4 text-[11px] text-muted-foreground">
                Le lien a peut-être expiré. Réessayez. · The link may have expired. Try again.
              </p>
            ) : null}
            <Button
              className="mt-6 h-10 w-full rounded-none bg-ink text-sm text-background shadow-none hover:bg-accent-ink disabled:opacity-40"
              disabled={busy || password.length < MIN_PASSWORD_LENGTH}
              onClick={submit}
            >
              {busy ? "…" : "Enregistrer · Save"}
            </Button>
          </>
        )}
        <Link to="/" className="mt-6 inline-block text-[11px] text-muted-foreground hover:text-ink">
          ← littlewins
        </Link>
      </div>
    </main>
  );
}
