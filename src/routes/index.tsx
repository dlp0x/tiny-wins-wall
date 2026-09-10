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
    <div className="inline-flex shrink-0 rounded-full border border-line p-0.5 font-mono text-[10px]" aria-label="Language">
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
      className="slip animate-rise relative mb-4 break-inside-avoid px-5 py-5 sm:mb-5 sm:px-6 sm:py-6"
      style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}
    >
      <span className="pin-dot" aria-hidden="true" />
      <p className="text-[15px] leading-[1.65] sm:text-base">{lang === "fr" ? win.fr : win.en}</p>
      <p className="mt-4 font-mono text-[10px] text-muted-foreground">{t.ago(win.age)}</p>
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
      className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-5 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="slip animate-pop w-full max-w-md p-6 sm:p-7" onClick={(e) => e.stopPropagation()}>
        <p className="font-mono text-[10px] text-muted-foreground">
          {t.modalEyebrow}
        </p>
        <h2 className="mt-2 font-display text-2xl">{t.modalTitle}</h2>
        <textarea
          rows={4}
          maxLength={200}
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.placeholder}
          className="mt-5 w-full resize-none rounded-md border border-line bg-background p-3 text-[15px] leading-relaxed outline-none focus:ring-1 focus:ring-accent"
        />
        <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
          <span>{text.length} / 200</span>
          <span>{t.anonymous}</span>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-line py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
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
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-7 sm:py-5 lg:px-8">
          <div className="font-display text-xl italic">littlewins</div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LangSwitch />
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex rounded-full bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-ink sm:px-4"
            >
              {t.cta}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 sm:px-7 lg:px-8">
        <section className="pb-9 pt-10 text-center sm:pb-11 sm:pt-14 lg:pb-12 lg:pt-16">
          <h1 className="animate-rise mx-auto max-w-3xl text-balance font-display text-[2.35rem] font-medium leading-[1.12] sm:text-5xl lg:text-[3.4rem]">
            <span className="text-accent-ink">{count}</span> {t.headlineSuffix}{" "}
            <span className="text-muted-foreground">{t.since(startDateLabel[lang]).toLowerCase()}</span>
          </h1>
          <p className="animate-rise mx-auto mt-4 max-w-[36ch] text-pretty text-sm leading-relaxed text-muted-foreground [animation-delay:80ms] sm:text-[15px]">
            {t.intro}
          </p>
        </section>

        <section className="pb-20 sm:pb-24">
          <ul className="columns-1 gap-4 sm:columns-2 sm:gap-5 lg:columns-3">
            {wins.map((win, i) => (
              <Slip key={win.id} win={win} index={i} />
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-7 text-center text-muted-foreground sm:px-7 lg:px-8">
          <p className="font-mono text-[10px]">{t.footer}</p>
        </div>
      </footer>

      <SubmitDialog open={open} onClose={() => setOpen(false)} onSubmit={addWin} />
    </div>
  );
}
