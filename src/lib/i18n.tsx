import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "fr";

type Strings = {
  since: (d: string) => string;
  headlineSuffix: string;
  intro: string;
  cta: string;
  modalEyebrow: string;
  modalTitle: string;
  placeholder: string;
  anonymous: string;
  cancel: string;
  submit: string;
  footer: string;
  themeToDark: string;
  themeToLight: string;
  ago: (m: number) => string;
};

const dict: Record<Lang, Strings> = {
  en: {
    since: (d: string) => `Since ${d}`,
    headlineSuffix: "little wins",
    intro:
      "Small, quiet victories, left here anonymously.",
    cta: "+ My little win",
    modalEyebrow: "Your little win",
    modalTitle: "What made today a little softer?",
    placeholder: "The small thing, in your own words…",
    anonymous: "posted anonymously",
    cancel: "Cancel",
    submit: "Pin it",
    footer: "made quietly by dlp0x · anonymous by design",
    themeToDark: "Switch to night",
    themeToLight: "Switch to day",
    ago: (m: number) => (m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`),
  },
  fr: {
    since: (d: string) => `Depuis le ${d}`,
    headlineSuffix: "petites victoires",
    intro:
      "De petites victoires tranquilles, déposées ici anonymement.",
    cta: "+ Ma petite victoire",
    modalEyebrow: "Votre petite victoire",
    modalTitle: "Qu'est-ce qui a adouci votre journée ?",
    placeholder: "La petite chose, dans vos mots…",
    anonymous: "publié anonymement",
    cancel: "Annuler",
    submit: "Épingler",
    footer: "fait tranquillement · anonyme par nature",
    themeToDark: "Passer en nuit",
    themeToLight: "Passer en jour",
    ago: (m: number) => (m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : `il y a ${Math.round(m / 1440)} j`),
  },
};

export const startDateLabel = {
  en: "March 16, 2026",
  fr: "16 mars 2026",
} as const;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: Strings };

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const value = useMemo(() => ({ lang, setLang, t: dict[lang] }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function formatCount(n: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US").format(n);
}
