import type {
  Door,
  DoorKey,
  Level,
  SpecialCardDef,
  TargetCard,
} from "./types";

export const PCOLORS = ["#EF4444", "#3B82F6", "#10B981", "#8B5CF6"];
export const DOGS = ["🐕", "🐩", "🐶", "🦮"];

/** Door config — min/max range maps to cognitive difficulty families. Labels are localized. */
export const DC: Record<DoorKey, Door> = {
  blue: { key: "blue", min: 2, max: 4, cnt: 2, pts: 1, color: "#3B82F6" },
  purple: { key: "purple", min: 3, max: 6, cnt: 2, pts: 2, color: "#8B5CF6" },
  yellow: { key: "yellow", min: 5, max: 8, cnt: 2, pts: 5, color: "#F59E0B" },
  red: { key: "red", min: 7, max: 9, cnt: 2, pts: 10, color: "#EF4444" },
  // Hero level — long multiplication: 2-digit × 1-digit
  redlong: {
    key: "redlong",
    ranges: [
      [11, 19],
      [2, 9],
    ],
    cnt: 2,
    pts: 20,
    color: "#DC2626",
  },
};

export const LVL_DOORS: Record<Level, DoorKey[]> = {
  beg: ["blue"],
  med: ["blue", "purple"],
  adv: ["blue", "purple", "yellow"],
  champ: ["blue", "purple", "yellow", "red"],
  hero: ["blue", "purple", "yellow", "redlong"],
};

export const TARGET_CARDS: TargetCard[] = [
  { id: 1, ex: "3 × 4", ans: 12 },
  { id: 2, ex: "2 × 7", ans: 14 },
  { id: 3, ex: "4 × 4", ans: 16 },
  { id: 4, ex: "3 × 6", ans: 18 },
  { id: 5, ex: "4 × 5", ans: 20 },
  { id: 6, ex: "3 × 7", ans: 21 },
  { id: 7, ex: "6 × 4", ans: 24 },
  { id: 8, ex: "5 × 5", ans: 25 },
  { id: 9, ex: "81 ÷ 3", ans: 27 },
  { id: 10, ex: "4 × 7", ans: 28 },
  { id: 11, ex: "6 × 5", ans: 30 },
  { id: 12, ex: "40 − 8", ans: 32 },
  { id: 13, ex: "7 × 5", ans: 35 },
  { id: 14, ex: "6 × 6", ans: 36 },
  { id: 15, ex: "80 ÷ 2", ans: 40 },
  { id: 16, ex: "6 × 7", ans: 42 },
  { id: 17, ex: "9 × 5", ans: 45 },
  { id: 18, ex: "8 × 6", ans: 48 },
  { id: 19, ex: "98 ÷ 2", ans: 49 },
  { id: 20, ex: "5 × 10", ans: 50 },
  { id: 21, ex: "6 × 9", ans: 54 },
  { id: 22, ex: "7 × 8", ans: 56 },
  { id: 23, ex: "9 × 7", ans: 63 },
  { id: 24, ex: "8 × 8", ans: 64 },
  { id: 25, ex: "7 × 10", ans: 70 },
  { id: 26, ex: "9 × 8", ans: 72 },
  { id: 27, ex: "8 × 10", ans: 80 },
  { id: 28, ex: "9 × 9", ans: 81 },
  { id: 29, ex: "9 × 10", ans: 90 },
  { id: 30, ex: "12 × 8", ans: 96 },
  // 🎲 Prime number targets!
  { id: 31, ex: "6 + 7", ans: 13, prime: true },
  { id: 32, ex: "10 + 7", ans: 17, prime: true },
  { id: 33, ex: "10 + 9", ans: 19, prime: true },
  { id: 34, ex: "12 + 11", ans: 23, prime: true },
  { id: 35, ex: "30 − 1", ans: 29, prime: true },
  { id: 36, ex: "25 + 6", ans: 31, prime: true },
  { id: 37, ex: "40 − 3", ans: 37, prime: true },
  { id: 38, ex: "40 + 1", ans: 41, prime: true },
  { id: 39, ex: "50 − 3", ans: 47, prime: true },
  { id: 40, ex: "50 + 3", ans: 53, prime: true },
  { id: 41, ex: "60 − 1", ans: 59, prime: true },
  { id: 42, ex: "60 + 1", ans: 61, prime: true },
  { id: 43, ex: "70 − 3", ans: 67, prime: true },
  { id: 44, ex: "70 + 1", ans: 71, prime: true },
  { id: 45, ex: "80 − 1", ans: 79, prime: true },
  { id: 46, ex: "80 + 3", ans: 83, prime: true },
  { id: 47, ex: "90 − 1", ans: 89, prime: true },
  { id: 48, ex: "100 − 3", ans: 97, prime: true },
];

export const BEG_CARDS: TargetCard[] = [
  { id: 101, ex: "5 + 7", ans: 12 },
  { id: 102, ex: "9 + 5", ans: 14 },
  { id: 103, ex: "8 + 8", ans: 16 },
  { id: 104, ex: "9 + 9", ans: 18 },
  { id: 105, ex: "13 + 7", ans: 20 },
  { id: 106, ex: "15 + 6", ans: 21 },
  { id: 107, ex: "20 + 4", ans: 24 },
  { id: 108, ex: "20 + 5", ans: 25 },
  { id: 109, ex: "20 + 7", ans: 27 },
  { id: 110, ex: "20 + 8", ans: 28 },
  { id: 111, ex: "25 + 5", ans: 30 },
  { id: 112, ex: "30 + 2", ans: 32 },
  { id: 113, ex: "30 + 5", ans: 35 },
  { id: 114, ex: "30 + 6", ans: 36 },
  { id: 115, ex: "35 + 5", ans: 40 },
  // 🎲 Primes for age 6-7
  { id: 116, ex: "5 + 6", ans: 11, prime: true },
  { id: 117, ex: "6 + 7", ans: 13, prime: true },
  { id: 118, ex: "8 + 9", ans: 17, prime: true },
  { id: 119, ex: "10 + 9", ans: 19, prime: true },
  { id: 120, ex: "12 + 11", ans: 23, prime: true },
];

/** Special cards — icon + effect live here; title/text are localized by id. */
export const LIMIT_C: SpecialCardDef[] = [
  { id: "lim_even", type: "lim", icon: "🚧", eff: "evenOnly" },
  { id: "lim_odd", type: "lim", icon: "🚧", eff: "oddOnly" },
  { id: "lim_three", type: "lim", icon: "🚧", eff: "threeColors" },
  { id: "lim_nored", type: "lim", icon: "🚧", eff: "noRed" },
  { id: "lim_short", type: "lim", icon: "🚧", eff: "shortPath" },
];

export const BONUS_C: SpecialCardDef[] = [
  { id: "bon_dbl", type: "bon", icon: "💎", eff: "dblPts" },
  { id: "bon_extra", type: "bon", icon: "💎", eff: "extraTurn" },
  { id: "bon_speed", type: "bon", icon: "💎", eff: "speedBonus" },
  { id: "bon_add10", type: "bon", icon: "💎", eff: "add10" },
  { id: "bon_steps", type: "bon", icon: "💎", eff: "stepsBonus" },
];

export const TWIST_C: SpecialCardDef[] = [
  { id: "twi_extra", type: "twi", icon: "🎲", eff: "extraTurn" },
  { id: "twi_dbl", type: "twi", icon: "🎲", eff: "dblPts" },
  { id: "twi_prime", type: "twi", icon: "🎲", eff: "add15" },
  { id: "twi_kibble", type: "twi", icon: "🎲", eff: "stepsBonus" },
  { id: "twi_dbl2", type: "twi", icon: "🎲", eff: "dblPts" },
];

export const SPECIAL_BY_ID: Record<string, SpecialCardDef> = Object.fromEntries(
  [...LIMIT_C, ...BONUS_C, ...TWIST_C].map((c) => [c.id, c])
);

export const SPECIAL_POOLS = {
  lim: LIMIT_C,
  bon: BONUS_C,
  twi: TWIST_C,
} as const;

/** Hex fill states. */
export const SFILL = {
  normal: "#FFF8E7",
  bonus: "#FFFBEB",
  limit: "#FEF2F2",
  rob: "#FCE7F3",
  twist: "#F5F3FF",
  target: "#FEF08A",
  path: "#A5F3FC",
  done: "#D1FAE5",
  blocked: "#FEE2E2",
} as const;

export function timerTotalFor(level: Level): number {
  return level === "hero" ? 90 : level === "champ" ? 120 : 180;
}

export const VIDEO_KEYS = [
  "tutorial",
  "gameplay",
  "beg",
  "med",
  "adv",
  "champ",
  "hero",
] as const;
