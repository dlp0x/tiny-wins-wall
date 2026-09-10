import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  I18nProvider,
  formatCount,
  startDateLabel,
  useI18n,
  type Lang,
} from "@/lib/i18n";
import { BASE_COUNT, mockWins, type Win } from "@/lib/wins";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "littlewins — a public wall of small personal victories" },
      {
        name: "description",
        content:
          "A calm, anonymous wall of little wins. No likes, no profiles, no metrics — just small victories, shared quietly.",
      },
      { property: "og:title", content: "littlewins — a wall of small personal victories" },
      {
        property: "og:description",
        content:
          "A calm, anonymous wall of little wins. No likes, no profiles, no metrics — just small victories, shared quietly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <I18nProvider>
      <LittleWins />
    </I18nProvider>
  ),
});

function LangSwitch() {
  const { lang, setLang } = useI18n();
  const item = (value: Lang) =>
    `rounded-full px-2.5 py-1 transition-colors ${
      lang === value ? "bg-ink text-background" : "text-muted-foreground hover:text-ink"
    }`;
  return (
    <div className="inline-flex shrink-0 rounded-full border border-line p-0.5 font-mono text-[11px]">
      <button type="button" onClick={() => setLang("en")} className={item("en")} aria-pressed={lang === "en"}>
        EN
      </button>
      <button type="button" onClick={() => setLang("fr")} className={item("fr")} aria-pressed={lang === "fr"}>
        FR
      </button>
    </div>
  );
}

function Slip({ win, index }: { win: Win; index: number }) {
  const { lang, t } = useI18n();
  return (
    <li
      className="slip animate-rise relative p-5 pt-6"
      style={{ animationDelay: `${Math.min(index, 15) * 60}ms` }}
    >
      <span className="pin-dot" aria-hidden="true" />
      <p className="text-[15px] leading-relaxed">{lang === "fr" ? win.fr : win.en}</p>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">{t.ago(win.age)}</p>
    </li>
  );
}

function SubmitDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="slip animate-pop w-full max-w-md p-7" onClick={(e) => e.stopPropagation()}>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          {t.modalEyebrow}
        </p>
        <h2 className="mt-2 font-display text-2xl tracking-tight">{t.modalTitle}</h2>
        <textarea
          rows={4}
          maxLength={200}
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.placeholder}
          className="mt-5 w-full resize-none rounded-md border border-line bg-background p-3 text-[15px] outline-none focus:ring-1 focus:ring-accent"
        />
        <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
          <span>{text.length} / 200</span>
          <span>{t.anonymous}</span>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-line py-2.5 text-sm text-muted-foreground transition-colors hover:bg-ink/5"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            disabled={text.trim().length === 0}
            onClick={() => {
              onSubmit(text.trim());
              setText("");
            }}
            className="flex-1 rounded-full bg-accent py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-ink disabled:opacity-40"
          >
            {t.submit}
          </button>
        </div>
      </div>
    </div>
  );
}

function LittleWins() {
  const { lang, t } = useI18n();
  const [wins, setWins] = useState<Win[]>(mockWins);
  const [open, setOpen] = useState(false);

  const added = wins.length - mockWins.length;
  const count = useMemo(() => formatCount(BASE_COUNT + added, lang), [added, lang]);

  const addWin = (text: string) => {
    setWins((prev) => [
      { id: `local-${Date.now()}`, age: 0, en: text, fr: text },
      ...prev,
    ]);
    setOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-3">
          <div className="min-w-0 truncate font-display text-xl italic tracking-tight">littlewins</div>
          <div className="flex shrink-0 items-center gap-3">
            <LangSwitch />
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="hidden rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-ink sm:inline-flex"
            >
              {t.cta}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="pt-12 pb-12 text-center sm:pt-16">
          <p className="animate-rise font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
            {t.since(startDateLabel[lang])}
          </p>
          <h1 className="animate-rise mt-5 text-balance font-display text-5xl font-medium tracking-tight [animation-delay:80ms] sm:text-6xl md:text-8xl">
            <span className="text-accent-ink">{count}</span> {t.headlineSuffix}
          </h1>
          <p className="animate-rise mx-auto mt-5 max-w-[42ch] text-pretty text-muted-foreground [animation-delay:160ms]">
            {t.intro}
          </p>
        </section>

        <section className="pb-28">
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {wins.map((win, i) => (
              <Slip key={win.id} win={win} index={i} />
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-8 text-muted-foreground">
          <p className="min-w-0 truncate font-display text-base italic">littlewins</p>
          <p className="shrink-0 font-mono text-[11px]">{t.footer}</p>
        </div>
      </footer>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="animate-pop fixed bottom-6 right-6 z-40 rounded-full bg-accent px-5 py-3 font-medium text-accent-foreground shadow-lg transition-colors [animation-delay:900ms] hover:bg-accent-ink"
      >
        {t.cta}
      </button>

      <SubmitDialog open={open} onClose={() => setOpen(false)} onSubmit={addWin} />
    </div>
  );
}
