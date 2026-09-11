import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
    `h-7 min-w-8 rounded-none px-2 text-[10px] font-medium ${
      lang === value ? "bg-ink text-background hover:bg-ink" : "text-muted-foreground hover:bg-muted"
    }`;
  return (
    <div className="inline-flex shrink-0 border border-line p-0.5" aria-label="Language">
      <Button variant="ghost" type="button" onClick={() => setLang("en")} className={item("en")} aria-pressed={lang === "en"}>
        EN
      </Button>
      <Button variant="ghost" type="button" onClick={() => setLang("fr")} className={item("fr")} aria-pressed={lang === "fr"}>
        FR
      </Button>
    </div>
  );
}

const winTreatments = [
  "win-tint-sky px-6 py-8 sm:px-8 sm:py-10",
  "px-2 py-6 sm:px-4 sm:py-9",
  "win-tint-rose px-6 py-7 sm:px-8 sm:py-9",
  "px-3 py-8 text-center sm:px-6 sm:py-12",
  "win-tint-sage px-6 py-8 sm:px-8 sm:py-10",
  "px-2 py-7 sm:px-5 sm:py-10",
] as const;

const winType = [
  "text-[1.85rem] leading-[1.12] sm:text-[2.15rem]",
  "text-[1.55rem] leading-[1.2] sm:text-[1.8rem]",
  "text-[1.35rem] leading-[1.28] sm:text-[1.55rem]",
  "text-[2rem] leading-[1.08] italic sm:text-[2.4rem]",
  "text-[1.5rem] leading-[1.2] sm:text-[1.8rem]",
  "text-[1.65rem] leading-[1.16] sm:text-[2rem]",
] as const;

const delayClasses = ["", "delay-1", "delay-2", "delay-3", "delay-4", "delay-5"] as const;

function Slip({ win, index }: { win: Win; index: number }) {
  const { lang, t } = useI18n();
  const treatment = winTreatments[index % winTreatments.length];
  const type = winType[index % winType.length];
  const delay = delayClasses[Math.min(index, delayClasses.length - 1)];
  return (
    <li
      className={`wall-entry animate-rise mb-8 break-inside-avoid sm:mb-10 ${treatment} ${delay}`}
    >
      <p className={`text-balance font-display ${type}`}>{lang === "fr" ? win.fr : win.en}</p>
      <p className="mt-5 text-[10px] font-medium text-muted-foreground">{t.ago(win.age)}</p>
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
      className="fixed inset-0 z-50 grid place-items-center bg-ink/20 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="animate-pop w-full max-w-lg border border-line bg-surface p-7 sm:p-10" onClick={(e) => e.stopPropagation()}>
        <p className="text-[10px] font-medium text-muted-foreground">
          {t.modalEyebrow}
        </p>
        <h2 className="mt-3 max-w-sm text-balance font-display text-3xl leading-tight sm:text-4xl">{t.modalTitle}</h2>
        <textarea
          rows={4}
          maxLength={200}
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.placeholder}
          className="mt-7 w-full resize-none border-0 border-b border-line bg-transparent px-0 py-4 font-display text-2xl leading-snug outline-none placeholder:text-muted-foreground/60 focus:border-ink"
        />
        <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{text.length} / 200</span>
          <span>{t.anonymous}</span>
        </div>
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="h-10 flex-1 rounded-none border-line bg-transparent text-sm text-muted-foreground shadow-none hover:bg-muted"
          >
            {t.cancel}
          </Button>
          <Button
            type="button"
            disabled={text.trim().length === 0}
            onClick={() => {
              onSubmit(text.trim());
              setText("");
            }}
            className="h-10 flex-1 rounded-none bg-ink text-sm text-background shadow-none hover:bg-accent-ink disabled:opacity-40"
          >
            {t.submit}
          </Button>
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
      <header>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-5 sm:px-8 sm:py-7 lg:px-10">
          <div className="font-display text-2xl italic">littlewins</div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LangSwitch />
            <Button
              type="button"
              onClick={() => setOpen(true)}
              className="h-8 rounded-none bg-transparent px-2 text-xs font-medium text-ink shadow-none hover:bg-muted sm:px-3 sm:text-sm"
            >
              {t.cta}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <section className="pb-10 pt-8 sm:pb-14 sm:pt-11 lg:pb-16 lg:pt-14">
          <h1 className="animate-rise max-w-3xl text-balance font-display text-[2.15rem] leading-[1.12] sm:text-[2.8rem] lg:text-[3.35rem]">
            <span>{count} {t.headlineSuffix}</span>{" "}
            <span className="text-muted-foreground">{t.since(startDateLabel[lang]).toLowerCase()}</span>
          </h1>
          <p className="animate-rise delay-2 mt-4 max-w-[38ch] text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {t.intro}
          </p>
        </section>

        <section className="pb-20 sm:pb-28">
          <ul className="columns-1 gap-7 sm:columns-2 sm:gap-10 lg:columns-3 lg:gap-12">
            {wins.map((win, i) => (
              <Slip key={win.id} win={win} index={i} />
            ))}
          </ul>
        </section>
      </main>

      <footer>
        <div className="mx-auto max-w-7xl px-5 py-9 text-center text-muted-foreground sm:px-8 lg:px-10">
          <p className="text-[10px]">{t.footer}</p>
        </div>
      </footer>

      <SubmitDialog open={open} onClose={() => setOpen(false)} onSubmit={addWin} />
    </div>
  );
}
