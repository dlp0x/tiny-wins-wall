import { useCallback, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { Turnstile } from "@/components/Turnstile";
import {
  MIN_PASSWORD_LENGTH,
  convertAnonymousToPermanent,
  deactivateAccount,
  isDeactivated,
  isValidEmail,
  mapAuthError,
  reactivateAccount,
  sendPasswordReset,
  signInPermanent,
  signOutAccount,
  type AccountError,
} from "@/lib/account-api";
import { deleteMyAccount, verifyCaptcha } from "@/lib/account.functions";

export type AccountView =
  | "menu"
  | "create"
  | "signin"
  | "forgot"
  | "dashboard"
  | "reactivate"
  | "offerDelete"
  | "confirmDelete";

const S = {
  en: {
    account: "Account",
    tagline: "You can have an account without having an identity here.",
    menuBody:
      "Optional. An account only keeps your little wins and hearts safe across devices. Nothing about you is ever shown on the wall.",
    create: "Create my account",
    signin: "Sign in",
    email: "Email",
    password: "Password",
    passwordHint: `At least ${MIN_PASSWORD_LENGTH} characters`,
    createSubmit: "Create my account",
    signinSubmit: "Sign in",
    forgot: "Forgot password?",
    forgotTitle: "Reset your password",
    forgotSubmit: "Send the link",
    forgotSent: "If an account exists for this address, a reset link is on its way.",
    back: "Back",
    close: "Close",
    created:
      "Almost there. Check your inbox and confirm your address. Your little wins and hearts stay with you.",
    otherDevice:
      "Signing in replaces this browser's temporary identity. Hearts kept here before signing in aren't merged into your account.",
    dashTitle: "My account",
    pending: (e: string) => `Waiting for confirmation of ${e}. Check your inbox.`,
    dashBody: "Your little wins and hearts are kept with this account. They stay anonymous on the wall.",
    signout: "Sign out",
    deactivate: "Deactivate my account",
    deactivateBody:
      "Reversible. Your little wins disappear from the wall while it's deactivated. Nothing is deleted.",
    deleteLink: "Delete my account permanently",
    reactivateTitle: "You already activated your account on littlewins.",
    reactivateQ: "Do you want to reactivate it?",
    yesReactivate: "Yes, reactivate my account",
    no: "No",
    offerDeleteTitle: "Do you want to delete the account permanently?",
    offerDeleteBody:
      "This will delete your account, your little wins, your hearts and all associated data.",
    cancel: "Cancel",
    deleteForever: "Delete permanently",
    dangerTitle: "⚠️ Delete your account",
    dangerBody1: "This action is permanent.",
    dangerBody2:
      "Your account will be deleted, along with your little wins, your hearts and all associated data.",
    dangerBody3: "This action cannot be undone.",
    deleted: "Your account and all its data have been deleted.",
    deactivated: "Your account is deactivated. Sign in any time to reactivate it.",
    errors: {
      email_exists:
        "An account already exists with this address. Sign in to it instead — nothing was created or changed.",
      weak_password: `Choose a stronger password (at least ${MIN_PASSWORD_LENGTH} characters).`,
      invalid_email: "This email address doesn't look right.",
      invalid_credentials: "Email or password is incorrect.",
      email_not_confirmed: "Confirm your address first — check your inbox.",
      captcha: "The verification didn't go through. Try again.",
      rate_limited: "Too many attempts. Wait a moment and try again.",
      no_identity: "Your temporary identity isn't available right now. Try again in a moment.",
      unknown: "Something went wrong. Nothing was changed. Try again.",
    } satisfies Record<AccountError, string>,
  },
  fr: {
    account: "Compte",
    tagline: "Tu peux avoir un compte sans avoir une identité ici.",
    menuBody:
      "Facultatif. Un compte sert seulement à garder vos petites victoires et vos cœurs d'un appareil à l'autre. Rien de vous n'est jamais affiché sur le mur.",
    create: "Créer mon compte",
    signin: "Se connecter",
    email: "Courriel",
    password: "Mot de passe",
    passwordHint: `Au moins ${MIN_PASSWORD_LENGTH} caractères`,
    createSubmit: "Créer mon compte",
    signinSubmit: "Se connecter",
    forgot: "Mot de passe oublié ?",
    forgotTitle: "Réinitialiser le mot de passe",
    forgotSubmit: "Envoyer le lien",
    forgotSent: "Si un compte existe pour cette adresse, un lien de réinitialisation est en route.",
    back: "Retour",
    close: "Fermer",
    created:
      "Presque terminé. Vérifiez votre boîte de réception et confirmez votre adresse. Vos petites victoires et vos cœurs restent avec vous.",
    otherDevice:
      "Se connecter remplace l'identité temporaire de ce navigateur. Les cœurs gardés ici avant la connexion ne sont pas fusionnés avec votre compte.",
    dashTitle: "Mon compte",
    pending: (e: string) => `En attente de confirmation de ${e}. Vérifiez votre boîte de réception.`,
    dashBody: "Vos petites victoires et vos cœurs sont gardés avec ce compte. Ils restent anonymes sur le mur.",
    signout: "Se déconnecter",
    deactivate: "Désactiver mon compte",
    deactivateBody:
      "Réversible. Vos petites victoires disparaissent du mur pendant la désactivation. Rien n'est supprimé.",
    deleteLink: "Supprimer mon compte définitivement",
    reactivateTitle: "Vous avez déjà activé votre compte sur littlewins.",
    reactivateQ: "Voulez-vous le réactiver ?",
    yesReactivate: "Oui, réactiver mon compte",
    no: "Non",
    offerDeleteTitle: "Voulez-vous supprimer le compte définitivement ?",
    offerDeleteBody:
      "Cette action supprimera votre compte, vos petites victoires, vos cœurs et toutes les données associées.",
    cancel: "Annuler",
    deleteForever: "Supprimer définitivement",
    dangerTitle: "⚠️ Supprimer votre compte",
    dangerBody1: "Cette action est définitive.",
    dangerBody2:
      "Votre compte sera supprimé, ainsi que vos petites victoires, vos cœurs et toutes les données associées.",
    dangerBody3: "Cette action ne peut pas être annulée.",
    deleted: "Votre compte et toutes ses données ont été supprimés.",
    deactivated: "Votre compte est désactivé. Connectez-vous quand vous voulez pour le réactiver.",
    errors: {
      email_exists:
        "Un compte existe déjà avec cette adresse. Connectez-vous à ce compte — rien n'a été créé ni modifié.",
      weak_password: `Choisissez un mot de passe plus solide (au moins ${MIN_PASSWORD_LENGTH} caractères).`,
      invalid_email: "Cette adresse courriel ne semble pas valide.",
      invalid_credentials: "Courriel ou mot de passe incorrect.",
      email_not_confirmed: "Confirmez d'abord votre adresse — vérifiez votre boîte de réception.",
      captcha: "La vérification n'a pas abouti. Réessayez.",
      rate_limited: "Trop de tentatives. Patientez un instant et réessayez.",
      no_identity: "Votre identité temporaire n'est pas disponible pour l'instant. Réessayez dans un instant.",
      unknown: "Quelque chose s'est mal passé. Rien n'a été modifié. Réessayez.",
    } satisfies Record<AccountError, string>,
  },
};

const inputCls =
  "w-full border-0 border-b border-line bg-transparent px-0 py-3 text-base outline-none placeholder:text-muted-foreground/60 focus:border-ink disabled:opacity-70";
const primaryCls =
  "h-10 w-full rounded-none bg-ink text-sm text-background shadow-none hover:bg-accent-ink disabled:opacity-40";
const ghostCls =
  "h-10 w-full rounded-none border-line bg-transparent text-sm text-muted-foreground shadow-none hover:bg-muted";
const linkCls =
  "text-[11px] text-muted-foreground underline-offset-4 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function AccountDialog({
  view,
  setView,
  onClose,
}: {
  view: AccountView;
  setView: (v: AccountView) => void;
  onClose: () => void;
}) {
  const { lang } = useI18n();
  const s = S[lang];
  const { theme } = useTheme();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AccountError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const verify = useServerFn(verifyCaptcha);
  const del = useServerFn(deleteMyAccount);
  const onToken = useCallback((t: string | null) => setCaptcha(t), []);

  const go = (v: AccountView) => {
    setError(null);
    setNotice(null);
    setPassword("");
    setView(v);
  };

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      console.warn("littlewins: account action failed", err);
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = () =>
    run(async () => {
      if (!captcha) throw new Error("captcha");
      const { ok } = await verify({ data: { token: captcha } });
      if (!ok) {
        setCaptcha(null);
        throw new Error("captcha");
      }
      await convertAnonymousToPermanent(email, password);
      setNotice(s.created);
    });

  const handleSignIn = () =>
    run(async () => {
      const id = await signInPermanent(email, password);
      if (await isDeactivated(id)) go("reactivate");
      else go("dashboard");
    });

  const handleForgot = () =>
    run(async () => {
      await sendPasswordReset(email);
      setNotice(s.forgotSent);
    });

  const handleDeactivate = () =>
    run(async () => {
      if (!auth.userId) throw new Error("no_identity");
      await deactivateAccount(auth.userId);
      await signOutAccount();
      go("menu");
      setNotice(s.deactivated);
    });

  const handleReactivate = () =>
    run(async () => {
      if (!auth.userId) throw new Error("no_identity");
      await reactivateAccount(auth.userId);
      go("dashboard");
    });

  const handleDecline = () =>
    run(async () => {
      // Kept deactivated, nothing deleted; continue as an anonymous visitor.
      await signOutAccount();
      onClose();
    });

  const handleDelete = () =>
    run(async () => {
      const { ok } = await del();
      if (!ok) throw new Error("delete_failed");
      await signOutAccount();
      go("menu");
      setNotice(s.deleted);
    });

  const canCreate =
    isValidEmail(email) && password.length >= MIN_PASSWORD_LENGTH && Boolean(captcha) && !busy;
  const canSignIn = isValidEmail(email) && password.length > 0 && !busy;

  const closeable = view !== "reactivate" && view !== "offerDelete";

  let body: ReactNode;
  if (view === "menu") {
    body = auth.isPermanent ? null : (
      <>
        <Title eyebrow={s.account}>{s.tagline}</Title>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{s.menuBody}</p>
        <Stack>
          <Button className={primaryCls} onClick={() => go("create")}>
            {s.create}
          </Button>
          <Button variant="outline" className={ghostCls} onClick={() => go("signin")}>
            {s.signin}
          </Button>
        </Stack>
      </>
    );
  } else if (view === "create") {
    body = notice ? null : (
      <>
        <Title eyebrow={s.account}>{s.create}</Title>
        <Fields email={email} setEmail={setEmail} password={password} setPassword={setPassword} s={s} busy={busy} newPassword />
        <div className="mt-5">
          <Turnstile onToken={onToken} theme={theme === "dark" ? "dark" : "light"} />
        </div>
        <Stack>
          <Button className={primaryCls} disabled={!canCreate} onClick={handleCreate}>
            {busy ? "…" : s.createSubmit}
          </Button>
          <button type="button" className={linkCls} onClick={() => go("signin")}>
            {s.signin}
          </button>
        </Stack>
      </>
    );
  } else if (view === "signin") {
    body = (
      <>
        <Title eyebrow={s.account}>{s.signin}</Title>
        <Fields email={email} setEmail={setEmail} password={password} setPassword={setPassword} s={s} busy={busy} />
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">{s.otherDevice}</p>
        <Stack>
          <Button className={primaryCls} disabled={!canSignIn} onClick={handleSignIn}>
            {busy ? "…" : s.signinSubmit}
          </Button>
          <button type="button" className={linkCls} onClick={() => go("forgot")}>
            {s.forgot}
          </button>
        </Stack>
      </>
    );
  } else if (view === "forgot") {
    body = notice ? null : (
      <>
        <Title eyebrow={s.account}>{s.forgotTitle}</Title>
        <input
          type="email"
          autoComplete="email"
          value={email}
          disabled={busy}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={s.email}
          aria-label={s.email}
          className={`mt-6 ${inputCls}`}
        />
        <Stack>
          <Button className={primaryCls} disabled={!isValidEmail(email) || busy} onClick={handleForgot}>
            {busy ? "…" : s.forgotSubmit}
          </Button>
          <button type="button" className={linkCls} onClick={() => go("signin")}>
            {s.back}
          </button>
        </Stack>
      </>
    );
  } else if (view === "dashboard") {
    body = (
      <>
        <Title eyebrow={s.dashTitle}>{auth.email ?? ""}</Title>
        {auth.pendingEmail ? (
          <p className="mt-3 text-[11px] text-muted-foreground">{s.pending(auth.pendingEmail)}</p>
        ) : null}
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{s.dashBody}</p>
        <Stack>
          <Button variant="outline" className={ghostCls} disabled={busy} onClick={() => run(async () => { await signOutAccount(); onClose(); })}>
            {s.signout}
          </Button>
          <Button variant="outline" className={ghostCls} disabled={busy} onClick={handleDeactivate}>
            {s.deactivate}
          </Button>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{s.deactivateBody}</p>
          <button type="button" className={`${linkCls} mt-2 text-destructive`} onClick={() => go("confirmDelete")}>
            {s.deleteLink}
          </button>
        </Stack>
      </>
    );
  } else if (view === "reactivate") {
    body = (
      <>
        <Title eyebrow={s.account}>{s.reactivateTitle}</Title>
        <p className="mt-4 text-sm text-muted-foreground">{s.reactivateQ}</p>
        <Stack>
          <Button className={primaryCls} disabled={busy} onClick={handleReactivate}>
            {busy ? "…" : s.yesReactivate}
          </Button>
          <Button variant="outline" className={ghostCls} disabled={busy} onClick={() => go("offerDelete")}>
            {s.no}
          </Button>
        </Stack>
      </>
    );
  } else if (view === "offerDelete") {
    body = (
      <>
        <Title eyebrow={s.account}>{s.offerDeleteTitle}</Title>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{s.offerDeleteBody}</p>
        <Row>
          <Button variant="outline" className={ghostCls} disabled={busy} onClick={handleDecline}>
            {s.cancel}
          </Button>
          <Button variant="destructive" className="h-10 w-full rounded-none text-sm shadow-none" disabled={busy} onClick={handleDelete}>
            {busy ? "…" : s.deleteForever}
          </Button>
        </Row>
      </>
    );
  } else {
    body = (
      <>
        <Title eyebrow={s.account}>{s.dangerTitle}</Title>
        <div className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>{s.dangerBody1}</p>
          <p>{s.dangerBody2}</p>
          <p className="font-medium text-ink">{s.dangerBody3}</p>
        </div>
        <Row>
          <Button variant="outline" className={ghostCls} disabled={busy} onClick={() => go("dashboard")}>
            {s.cancel}
          </Button>
          <Button variant="destructive" className="h-10 w-full rounded-none text-sm shadow-none" disabled={busy} onClick={handleDelete}>
            {busy ? "…" : s.deleteForever}
          </Button>
        </Row>
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center wall-overlay p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={s.account}
      onClick={() => closeable && !busy && onClose()}
    >
      <div className="animate-pop w-full max-w-md border border-line bg-surface p-7 sm:p-10" onClick={(e) => e.stopPropagation()}>
        {body}
        {notice ? <p role="status" className="text-sm leading-relaxed text-muted-foreground">{notice}</p> : null}
        {error ? (
          <p role="alert" className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            {s.errors[error]}
          </p>
        ) : null}
        {closeable ? (
          <div className="mt-6 flex justify-between">
            {view !== "menu" && view !== "dashboard" && !notice ? (
              <button type="button" className={linkCls} onClick={() => go(auth.isPermanent ? "dashboard" : "menu")}>
                {s.back}
              </button>
            ) : <span />}
            <button type="button" className={linkCls} onClick={onClose} disabled={busy}>
              {s.close}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Title({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <>
      <p className="text-[10px] font-medium text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-3 text-balance break-words font-display text-3xl leading-tight">{children}</h2>
    </>
  );
}
function Stack({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-col items-center gap-3">{children}</div>;
}
function Row({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex gap-3">{children}</div>;
}
function Fields({
  email, setEmail, password, setPassword, s, busy, newPassword,
}: {
  email: string; setEmail: (v: string) => void; password: string; setPassword: (v: string) => void;
  s: (typeof S)["en"]; busy: boolean; newPassword?: boolean;
}) {
  return (
    <div className="mt-6 space-y-2">
      <input type="email" autoComplete="email" value={email} disabled={busy} onChange={(e) => setEmail(e.target.value)} placeholder={s.email} aria-label={s.email} className={inputCls} />
      <input type="password" autoComplete={newPassword ? "new-password" : "current-password"} value={password} disabled={busy} onChange={(e) => setPassword(e.target.value)} placeholder={newPassword ? `${s.password} · ${s.passwordHint}` : s.password} aria-label={s.password} className={inputCls} />
    </div>
  );
}
