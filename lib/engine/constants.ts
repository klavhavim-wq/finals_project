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

/**
 * The single thing you collect: a pellet (גרגיר). This bone icon is the score
 * unit everywhere — bank, win screen, results. A door is simply worth a number
 * of pellets, so there is only ever one kind of food in the game.
 */
export const PELLET = "🦴";

// ── Door fact families ──
//
// A door is a family of multiplication facts that are learned the same way, not
// a range of answer sizes. The previous design banded doors by product (4–20,
// 10–40, 24–64, 42–81), which had two problems: the bands overlapped, so seven
// of the nine "hardest" facts were also available at half the price one door
// down; and product size is a poor proxy for difficulty. 9 × 10 = 90 is one of
// the easiest facts in the table and 6 × 7 = 42 is one of the hardest.
//
// The families below follow how children actually acquire the table. Facts with
// a 2, 5 or 10 in them are reached by a rule — double it, halve the ×10, add a
// zero — and stay accessible long before recall is fluent. Ties (4 × 4, 7 × 7)
// are retrieved faster and more accurately than non-ties of the same size. What
// is left once those are removed is the small set of large non-tie facts that
// every child finds hardest and that stay effortful longest.
//
// Every fact belongs to exactly one door, so a given exercise is always worth
// the same, and what a door pays now tracks what it actually costs to answer.

/** All factor pairs a ≤ b in 2..10 matching a test. */
function pairs(test: (a: number, b: number) => boolean): [number, number][] {
  const out: [number, number][] = [];
  for (let a = 2; a <= 10; a++)
    for (let b = a; b <= 10; b++) if (test(a, b)) out.push([a, b]);
  return out;
}

const has = (a: number, b: number, n: number) => a === n || b === n;
/** Reached by a rule rather than by recall: doubling, ×10, or halving the ×10. */
const isRule = (a: number, b: number) => has(a, b, 2) || has(a, b, 10) || has(a, b, 5);
/** Same number twice — retrieved faster and more accurately than its neighbours. */
const isTie = (a: number, b: number) => a === b;

/** ×2 and ×10 — doubling and place value. The first facts a child owns. */
const FAM_DOUBLE = pairs((a, b) => has(a, b, 2) || has(a, b, 10));
/** ×5, plus the two smallest ties. Halving the ×10, and the earliest recalled ties. */
const FAM_FIVES = pairs((a, b) => !FAM_DOUBLE.some(([x, y]) => x === a && y === b) && (has(a, b, 5) || (isTie(a, b) && a <= 4)));
/** ×3 and ×4 against a big partner, plus the remaining ties. Recall, but supported. */
const FAM_MID = pairs(
  (a, b) =>
    !isRule(a, b) &&
    !FAM_FIVES.some(([x, y]) => x === a && y === b) &&
    (isTie(a, b) || a === 3 || a === 4)
);
/** 6, 7, 8, 9 against each other, no tie and no rule — the facts that stay hardest. */
const FAM_HARD = pairs((a, b) => !isRule(a, b) && !isTie(a, b) && a >= 6);

/** Door config — each door is one fact family. Labels are localized. */
export const DC: Record<DoorKey, Door> = {
  blue: { key: "blue", family: FAM_DOUBLE, cnt: 2, pts: 1, color: "#3B82F6" },
  // Indigo (not light violet) so blue and purple doors stay distinguishable,
  // including for blue-yellow colour-vision deficiency.
  purple: { key: "purple", family: FAM_FIVES, cnt: 2, pts: 2, color: "#7C3AED" },
  // Deepened from #F59E0B, which sat at 1.99:1 against the board parchment — the
  // line was there but a child with any low vision simply did not see it. This
  // reads as the same orange and clears 3:1.
  yellow: { key: "yellow", family: FAM_MID, cnt: 2, pts: 5, color: "#C2660A" },
  red: { key: "red", family: FAM_HARD, cnt: 2, pts: 10, color: "#EF4444" },
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

/**
 * Whether stealing starts switched on, by level. Off while the multiplication
 * facts are still being acquired, where taking pellets off a named classmate
 * adds pressure to the thing being learned; on from Advanced up, where the
 * facts are more settled and the threat of losing pellets is what makes the
 * route worth choosing carefully. Every level can still toggle it by hand.
 */
export const ROB_DEFAULT: Record<Level, boolean> = {
  beg: false,
  med: false,
  adv: true,
  champ: true,
  hero: true,
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
// A level is a set of fact families (see the doors above), and the find-the-target
// card draws from the same families its doors do — so the level means one thing
// wherever it appears. Primes are kept (as additions) so the 🎲 surprise tiles
// stay reachable. No division or subtraction.

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

/**
 * Prime targets are written as additions, and they carry their own difficulty
 * independent of the multiplication level: 18 + 19 needs carrying, 5 + 6 does
 * not. They are capped separately so the addition stays inside the level too —
 * on Beginner every prime card is a single-digit sum.
 */
const PRIME_CAP: Record<Level, number> = { beg: 19, med: 31, adv: 100, champ: 100, hero: 100 };

function buildPool(mult: TargetCard[], cap: number, primeCap: number): TargetCard[] {
  return [
    ...mult.filter((c) => c.ans <= cap),
    ...PRIME_TARGETS.filter((c) => c.ans <= Math.min(cap, primeCap)),
  ];
}

/**
 * The find-the-target card draws from the same fact families as the level's
 * doors — so a level means one thing, and it means it everywhere.
 *
 * The find step is the entry ticket to every turn: nothing else can happen until
 * it is answered, and it never offers multiple choice. Previously it ignored the
 * level entirely and drew from the whole table up to the board size, so a
 * beginner met 4 × 8 = 32 before they could move at all, on a level advertised
 * as products up to 20.
 *
 * The board stays larger than the facts require on purpose — the extra rows are
 * walking room, which keeps routes varied without raising the recall demand.
 */
function familyTargets(level: Level, idBase: number): TargetCard[] {
  const cap = BOARD_MAX[level];
  const seen = new Set<number>();
  const cards: TargetCard[] = [];
  let id = idBase;
  for (const key of LVL_DOORS[level]) {
    for (const [a, b] of DC[key].family ?? []) {
      const ans = a * b;
      if (ans > cap || seen.has(ans)) continue;
      seen.add(ans);
      cards.push({ id: id++, ex: `${a} × ${b}`, ans });
    }
  }
  return cards;
}

/** Target-card pool per level — the level's own fact families, plus primes. */
export const TARGETS_BY_LEVEL: Record<Level, TargetCard[]> = {
  beg: buildPool(familyTargets("beg", 100), BOARD_MAX.beg, PRIME_CAP.beg),
  med: buildPool(familyTargets("med", 200), BOARD_MAX.med, PRIME_CAP.med),
  adv: buildPool(familyTargets("adv", 300), BOARD_MAX.adv, PRIME_CAP.adv),
  champ: buildPool(familyTargets("champ", 400), BOARD_MAX.champ, PRIME_CAP.champ),
  // Hero is the one level whose find step is a different task from its doors:
  // long multiplication is what the level is for.
  hero: buildPool(longTargets(BOARD_MAX.hero, 500), BOARD_MAX.hero, PRIME_CAP.hero),
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
// Board base fills are deliberately kept in a calm, low-saturation warm-neutral
// family (parchment / sand / stone). They must NOT borrow the door hues
// (blue / purple / amber / red), because the planned route paints its hexes in
// those very door colours — sharing the hue made the route blend into the board.
// The special-tile type is still carried by its emoji symbol; the fill only adds
// a faint warm/cool nudge so the route's saturated colour clearly stands apart.
export const SFILL = {
  normal: "#FCF6E9", // warm parchment — ordinary hex
  bonus: "#F7EFD6", // faint sand/gold — 💎 bonus tile
  limit: "#ECEAE3", // light warm stone — 🚧 limit tile
  rob: "#F1E8DF", // soft taupe — 🦹 robber tile
  twist: "#E9E7EC", // faint cool grey — 🎲 twist tile (primes)
  target: "#FEF08A",
  path: "#A5F3FC",
  done: "#D1FAE5",
  blocked: "#FEE2E2",
} as const;

/**
 * How long a turn gets, given how many doors the route actually crosses.
 *
 * A flat per-turn clock punished route length rather than slowness: the same 90
 * seconds covered a 2-step route and a 13-step one, so on the hardest level a
 * long route left about 7 seconds per long-multiplication question and could not
 * be finished by anyone. The clock is now a base for reading and planning plus a
 * per-question allowance, so a longer route buys the time it needs and the only
 * thing the clock measures is how long each question takes.
 */
const TURN_BASE: Record<Level, number> = { beg: 60, med: 60, adv: 55, champ: 45, hero: 40 };
const SECS_PER_STEP: Record<Level, number> = { beg: 30, med: 26, adv: 22, champ: 18, hero: 16 };

export function timerTotalFor(level: Level, steps = 4): number {
  const n = Math.max(1, steps);
  return TURN_BASE[level] + SECS_PER_STEP[level] * n;
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
  // Win is decided by who collected the most after 4 rounds (no race-to-100
  // shortcut), so skilled players still play the full game at every level.
  // Choice buttons stay on for Beginner/Intermediate (consistent with the other
  // presets and the regular setup); higher levels are typed-only via sanitisation.
  full: { timer: true, mc: true, rob: true, winMode: "rounds", coop: false, freePlay: false, focus: false, review: true },
};
