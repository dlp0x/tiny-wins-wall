import { useEffect, useRef } from "react";

// Public site key (safe in code). Falls back to Cloudflare's always-pass test key.
const SITE_KEY =
  (import.meta.env["VITE_TURNSTILE_SITE_KEY"] as string | undefined) || "1x00000000000000000000AA";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("turnstile_load"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function Turnstile({ onToken, theme }: { onToken: (t: string | null) => void; theme: "light" | "dark" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let id: string | null = null;
    let active = true;
    loadScript()
      .then(() => {
        const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
        if (!active || !api || !ref.current) return;
        id = api.render(ref.current, {
          sitekey: SITE_KEY,
          theme,
          callback: (t: string) => onToken(t),
          "expired-callback": () => onToken(null),
          "error-callback": () => onToken(null),
        });
      })
      .catch(() => onToken(null));
    return () => {
      active = false;
      const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (id && api) api.remove(id);
    };
  }, [onToken, theme]);
  return <div ref={ref} className="min-h-[65px]" />;
}
