export type Win = {
  id: string;
  /** minutes ago */
  age: number;
  en: string;
  fr: string;
};

export const START_DATE = new Date("2026-03-16T00:00:00Z");
export const BASE_COUNT = 189763;

export const mockWins: Win[] = [
  {
    id: "w1",
    age: 120,
    en: "Finally answered the email I'd been carrying around for a month.",
    fr: "J'ai enfin répondu au courriel que je traînais depuis un mois.",
  },
  {
    id: "w2",
    age: 180,
    en: "Made the bed before the alarm went off. Twice.",
    fr: "J'ai fait le lit avant que le réveil sonne. Deux fois.",
  },
  {
    id: "w3",
    age: 300,
    en: "Said the thing out loud. It came out better than I was afraid it would.",
    fr: "J'ai dit la chose à voix haute. C'est sorti mieux que je le craignais.",
  },
  {
    id: "w4",
    age: 480,
    en: "Took out the recycling on a Tuesday.",
    fr: "J'ai sorti le recyclage un mardi.",
  },
  {
    id: "w5",
    age: 720,
    en: "Walked instead of scrolling. The sky was weirdly pink and I just stood there for a while.",
    fr: "J'ai marché au lieu de scroller. Le ciel était étrangement rose et je suis resté là un moment.",
  },
  {
    id: "w6",
    age: 840,
    en: "Drank the whole glass of water before the coffee.",
    fr: "J'ai bu tout le verre d'eau avant le café.",
  },
  {
    id: "w7",
    age: 1440,
    en: "Finished the chapter I kept putting off.",
    fr: "J'ai fini le chapitre que je repoussais sans cesse.",
  },
  {
    id: "w8",
    age: 1600,
    en: "Wanted to cancel my subscription and didn't. Not because I'm disciplined — because I actually enjoyed the thing.",
    fr: "J'ai voulu annuler mon abonnement et je ne l'ai pas fait. Pas par discipline — parce que j'aimais vraiment ça.",
  },
  {
    id: "w9",
    age: 2880,
    en: "Watered the plant and remembered its name.",
    fr: "J'ai arrosé la plante et je me suis souvenu de son nom.",
  },
  {
    id: "w10",
    age: 3100,
    en: "Bought the flowers on purpose, for me.",
    fr: "J'ai acheté les fleurs exprès, pour moi.",
  },
  {
    id: "w11",
    age: 4320,
    en: "Didn't check my phone for the first full hour of the day.",
    fr: "Je n'ai pas regardé mon téléphone pendant la première heure de la journée.",
  },
  {
    id: "w12",
    age: 5760,
    en: "Laughed at something small and let it stay small.",
    fr: "J'ai ri d'un petit rien et je l'ai laissé rester petit.",
  },
  {
    id: "w13",
    age: 7200,
    en: "Folded the laundry. The whole mountain. Smelled like the sun.",
    fr: "J'ai plié le linge. Toute la montagne. Ça sentait le soleil.",
  },
  {
    id: "w14",
    age: 8640,
    en: "Told the truth to a friend and it made us closer.",
    fr: "J'ai dit la vérité à une amie et ça nous a rapprochées.",
  },
  {
    id: "w15",
    age: 8900,
    en: "Slept before midnight. Fell asleep in twenty minutes, not two hours.",
    fr: "Couché avant minuit. Endormi en vingt minutes, pas deux heures.",
  },
];
