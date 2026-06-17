import type {
  Door,
  DoorKey,
  Level,
  PresetId,
  Settings,
  SpecialCardDef,
  TargetCard,
} from "./types";

export const PCOLORS = ["#EF4444", "#3B82F6", "#10B981", "#8B5CF6"];
export const DOGS = ["🐕", "🐩", "🐶", "🦮"];

/** Door config — min/max range maps to cognitive difficulty families. Labels are localized. */
export const DC: Record<DoorKey, Door> = {
  // Product-band doors: each asks any factor pair (a≤b) within `fac` whose product
  // lands in `band`. This keeps each door's difficulty while widening the variety
  // of facts practised far beyond the old fixed dice ranges.
  blue: { key: "blue", fac: [2, 9], band: [4, 20], cnt: 2, pts: 1, color: "#3B82F6" },
  // Indigo (not light violet) so blue and purple doors stay distinguishable,
  // including for blue-yellow colour-vision deficiency.
  purple: { key: "purple", fac: [2, 9], band: [10, 40], cnt: 2, pts: 2, color: "#7C3AED" },
  yellow: { key: "yellow", fac: [3, 9], band: [24, 64], cnt: 2, pts: 5, color: "#F59E0B" },
  red: { key: "red", fac: [6, 9], band: [42, 81], cnt: 2, pts: 10, color: "#EF4444" },
  // Hero level — long multiplication: 2-digit × 1-digit
  redlong: {
    key: "redlong",
    ranges: [
      [11, 19],
      [2, 9],
    ],
    cnt: 2,
    pts: 12,
    // Black (not dark red) so Steak is unmistakably distinct from the red Sausage door.
    color: "#111827",
  },
};

export const LVL_DOORS: Record<Level, DoorKey[]> = {
  beg: ["blue"],
  med: ["blue", "purple"],
  adv: ["blue", "purple", "yellow"],
  champ: ["blue", "purple", "yellow", "red"],
  hero: ["blue", "purple", "yellow", "red", "redlong"],
};

/** Colour of the door a level adds — used to tint that level's tiles/borders. */
export function addedDoorColor(level: Level): string {
  const doors = LVL_DOORS[level];
  return DC[doors[doors.length - 1]].color;
}

/**
 * Readable (darkened) text shade for each level's name, matching the colour of
 * the door that level adds — legible on white where the raw door colour is too
 * light.
 */
export const LEVEL_TEXT_COLOR: Record<Level, string> = {
  beg: "#185FA5", // blue
  med: "#534AB7", // purple
  adv: "#854F0B", // amber/yellow
  champ: "#A32D2D", // red
  hero: "#111827", // black
};

/**
 * Board size per level — the highest hex number on the board.
 * Each level's board reaches only as far as its relevant products require,
 * instead of always spanning 1–100. Width stays 10 columns; rows scale.
 */
export const BOARD_MAX: Record<Level, number> = {
  beg: 40, // full times tables, products up to 40
  med: 60, // full times tables, products up to 60
  adv: 90, // full times tables, products up to 90
  champ: 100, // full times tables, products up to 100
  hero: 100, // long multiplication, up to 100
};

export function boardMaxFor(level: Level): number {
  return BOARD_MAX[level];
}

/** Number of board rows for a level (10 hexes per row). */
export function boardRowsFor(level: Level): number {
  return Math.ceil(BOARD_MAX[level] / 10);
}

// ── Target cards (phase 1) ──
// Each level is "the full multiplication table up to N", like learned in school.
// Targets are every times-table product (factors 2–10) up to the level's board
// max. Primes are kept (as additions) so the 🎲 surprise tiles stay reachable.
// No division or subtraction.

/** One card per distinct times-table product (factors 2–10) up to a cap. */
function timesTableTargets(cap: number, idBase: number): TargetCard[] {
  const seen = new Set<number>();
  const cards: TargetCard[] = [];
  let id = idBase;
  for (let a = 2; a <= 10; a++) {
    for (let b = a; b <= 10; b++) {
      const ans = a * b;
      if (ans > cap || seen.has(ans)) continue;
      seen.add(ans);
      cards.push({ id: id++, ex: `${a} × ${b}`, ans });
    }
  }
  return cards;
}

/** Long-multiplication cards (2-digit × 1-digit) up to a cap. */
function longTargets(cap: number, idBase: number): TargetCard[] {
  const seen = new Set<number>();
  const cards: TargetCard[] = [];
  let id = idBase;
  for (let a = 11; a <= 19; a++) {
    for (let b = 2; b <= 9; b++) {
      const ans = a * b;
      if (ans > cap || seen.has(ans)) continue;
      seen.add(ans);
      cards.push({ id: id++, ex: `${a} × ${b}`, ans });
    }
  }
  return cards;
}

/** Prime targets written as additions (so they carry no division/subtraction). */
const PRIME_TARGETS: TargetCard[] = [
  { id: 901, ex: "5 + 6", ans: 11, prime: true },
  { id: 902, ex: "6 + 7", ans: 13, prime: true },
  { id: 903, ex: "8 + 9", ans: 17, prime: true },
  { id: 904, ex: "9 + 10", ans: 19, prime: true },
  { id: 905, ex: "11 + 12", ans: 23, prime: true },
  { id: 906, ex: "14 + 15", ans: 29, prime: true },
  { id: 907, ex: "15 + 16", ans: 31, prime: true },
  { id: 908, ex: "18 + 19", ans: 37, prime: true },
  { id: 909, ex: "20 + 21", ans: 41, prime: true },
  { id: 910, ex: "21 + 22", ans: 43, prime: true },
  { id: 911, ex: "23 + 24", ans: 47, prime: true },
  { id: 912, ex: "26 + 27", ans: 53, prime: true },
  { id: 913, ex: "29 + 30", ans: 59, prime: true },
  { id: 914, ex: "30 + 31", ans: 61, prime: true },
  { id: 915, ex: "33 + 34", ans: 67, prime: true },
  { id: 916, ex: "35 + 36", ans: 71, prime: true },
  { id: 917, ex: "36 + 37", ans: 73, prime: true },
  { id: 918, ex: "39 + 40", ans: 79, prime: true },
  { id: 919, ex: "41 + 42", ans: 83, prime: true },
  { id: 920, ex: "44 + 45", ans: 89, prime: true },
  { id: 921, ex: "48 + 49", ans: 97, prime: true },
];

function buildPool(mult: TargetCard[], cap: number): TargetCard[] {
  return [...mult, ...PRIME_TARGETS].filter((c) => c.ans <= cap);
}

/** Target-card pool per level — the full times table up to its board + primes. */
export const TARGETS_BY_LEVEL: Record<Level, TargetCard[]> = {
  beg: buildPool(timesTableTargets(BOARD_MAX.beg, 100), BOARD_MAX.beg),
  med: buildPool(timesTableTargets(BOARD_MAX.med, 200), BOARD_MAX.med),
  adv: buildPool(timesTableTargets(BOARD_MAX.adv, 300), BOARD_MAX.adv),
  champ: buildPool(timesTableTargets(BOARD_MAX.champ, 400), BOARD_MAX.champ),
  hero: buildPool(longTargets(BOARD_MAX.hero, 500), BOARD_MAX.hero),
};

export function targetPoolFor(level: Level): TargetCard[] {
  return TARGETS_BY_LEVEL[level];
}

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
  { id: "twi_teleport", type: "twi", icon: "🎲", eff: "teleport" },
  { id: "twi_swap", type: "twi", icon: "🎲", eff: "swapHex" },
  { id: "twi_dblOrHalf", type: "twi", icon: "🎲", eff: "dblOrHalf" },
  { id: "twi_give5", type: "twi", icon: "🎲", eff: "giveTokens" },
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

// ── Pedagogy add-on: factoring (פירוק לגורמים) ──
// Active only from Advanced up, where numbers are large enough that breaking
// them into factors is a meaningful challenge rather than a trivial one.

/** Whether the factoring add-on (target challenge + route factor tiles) is on. */
export function factorBonusActive(level: Level): boolean {
  return level === "adv" || level === "champ" || level === "hero";
}

/** Pellets awarded for breaking the target number into a factor pair. */
export const FACTOR_SOLVE_BONUS = 5;

/** Pellets awarded per factor tile the route walked through. */
export const FACTOR_TILE_BONUS = 2;

export const VIDEO_KEYS = [
  "tutorial",
  "gameplay",
  "beg",
  "med",
  "adv",
  "champ",
  "hero",
] as const;

// ── Quick-launch presets ──
// One-tap setups for common scenarios. Labels/icons are localized (see i18n);
// here we keep only the settings each preset applies. The quick screen lets the
// facilitator pick level + player count first, then tap a preset to start.
// `winMode`/`mc` are sanitised against the chosen level at start (same rules as
// the regular setup screen), so a preset is always valid for any level.

/** Default difficulty a preset opens on (the facilitator can change it first). */
export const PRESET_DEFAULT_LEVEL: Level = "med";

/** Order presets appear on the quick-launch screen. */
export const PRESET_ORDER: PresetId[] = ["focus", "free", "calm", "full"];

/** The settings each quick-launch preset applies. */
export const PRESETS: Record<PresetId, Settings> = {
  // Focused practice — minimal distraction, no time pressure, still scored for
  // motivation; remembers and re-serves missed facts.
  focus: { timer: false, mc: true, rob: false, winMode: "rounds", coop: false, freePlay: false, focus: true, review: true },
  // Free practice — no score, no winner, no pressure; pure repetition.
  free: { timer: false, mc: true, rob: false, winMode: "rounds", coop: false, freePlay: true, focus: true, review: true },
  // Calm & together — cooperative, gentle, low-distraction.
  calm: { timer: false, mc: true, rob: false, winMode: "rounds", coop: true, freePlay: false, focus: true, review: true },
  // Full game — the complete, rich experience with every mechanic on.
  full: { timer: true, mc: false, rob: true, winMode: "both", coop: false, freePlay: false, focus: false, review: true },
};
