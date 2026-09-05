import {
  DC,
  FACTOR_SOLVE_BONUS,
  FACTOR_TILE_BONUS,
  LVL_DOORS,
  SPECIAL_BY_ID,
  SPECIAL_POOLS,
  factorBonusActive,
  targetPoolFor,
  timerTotalFor,
} from "./constants";
import { edgeColor, hasFactorPair, hexSym, hNeighbors, initEdgeColors, isPrime } from "./hexgrid";
import type {
  CardType,
  Door,
  DoorKey,
  EffResult,
  ErrorRecord,
  FoodTally,
  GameState,
  Level,
  Locale,
  PendingRoll,
  Phase,
  Player,
  ReviewFact,
  Settings,
  TargetCard,
} from "./types";

/** Add two food tallies (door-type → count) together. */
function mergeFoods(a: FoodTally, b: FoodTally): FoodTally {
  const out: FoodTally = { ...a };
  (Object.keys(b) as DoorKey[]).forEach((k) => {
    out[k] = (out[k] ?? 0) + (b[k] ?? 0);
  });
  return out;
}

export type Rand = () => number;

// ── Pure RNG helpers (called by the host with Math.random; reducer stays pure) ──

/**
 * A randomly chosen factor pair that represents `ans`, within the level's factor
 * domain. Lets the same product appear as different decompositions (24 → 3×8 or
 * 4×6). Returns null if no valid pair exists. Display only — the answer is `ans`.
 */
function altFactorPair(ans: number, level: Level, rand: Rand): string | null {
  const pairs: [number, number][] = [];
  if (level === "hero") {
    for (let a = 11; a <= 19; a++) {
      if (ans % a === 0) {
        const b = ans / a;
        if (b >= 2 && b <= 9) pairs.push([a, b]);
      }
    }
  } else {
    // Only decompositions the level actually teaches. 30 is a Beginner answer
    // because 3 × 10 is a Beginner fact — but showing it as 5 × 6 would put a
    // fact from two levels up on the card, which is how "products up to 20"
    // ended up asking 5 × 6 in the first place.
    const allowed = new Set<string>();
    for (const key of LVL_DOORS[level])
      for (const [a, b] of DC[key].family ?? []) allowed.add(`${a}x${b}`);
    for (let a = 2; a <= 10; a++) {
      if (ans % a === 0) {
        const b = ans / a;
        if (b >= a && b <= 10 && allowed.has(`${a}x${b}`)) pairs.push([a, b]);
      }
    }
  }
  if (!pairs.length) return null;
  const [a, b] = pairs[Math.floor(rand() * pairs.length)];
  return `${a} × ${b}`;
}

export function pickTargetCard(
  level: Level,
  usedCards: number[],
  rand: Rand = Math.random,
  preferComposite = false
): { card: TargetCard; resetUsed: boolean } {
  // Each level has its own multiplication target pool, already sized to its board.
  const pool = targetPoolFor(level);
  let avail = pool.filter((c) => !usedCards.includes(c.id));
  let resetUsed = false;
  if (!avail.length) {
    resetUsed = true;
    avail = pool;
  }
  // The guided demo asks for a composite target so the factoring step (gold
  // factor tiles + the "break it into factors" challenge) actually shows.
  let pickFrom = avail;
  if (preferComposite) {
    const comp = avail.filter((c) => hasFactorPair(c.ans));
    if (comp.length) pickFrom = comp;
  } else if (level === "beg" || level === "med") {
    // Keep the find step mostly multiplication at the easiest levels: primes
    // (which are shown as additions) still appear, just less often.
    const mult = avail.filter((c) => !c.prime);
    if (mult.length && rand() < 0.7) pickFrom = mult;
  }
  let card = pickFrom[Math.floor(rand() * pickFrom.length)];
  // Vary which factor pair is shown for a product, so it is not always the same
  // single decomposition. Display only — the answer (card.ans) is unchanged.
  if (!card.prime) {
    const ex = altFactorPair(card.ans, level, rand);
    if (ex) card = { ...card, ex };
  }
  return { card, resetUsed };
}

export interface RollGuards {
  turnUsedExprs: string[];
  lastTurnExprs: string[];
  lastExpr: string;
  turnHasOne: boolean;
  turnHasTen: boolean;
}

export interface RollResult {
  rolls: number[];
  correct: number;
  expr: string;
}

export function rollDoor(door: Door, guards: RollGuards, rand: Rand = Math.random): RollResult {
  const bandPairs = door.family ?? null;
  const gen = (): RollResult => {
    if (door.ranges) {
      const r = door.ranges.map(([mn, mx]) => Math.floor(rand() * (mx - mn + 1)) + mn);
      return { rolls: r, correct: r.reduce((a, b) => a * b, 1), expr: r.join(" × ") };
    }
    if (bandPairs) {
      const [a, b] = bandPairs[Math.floor(rand() * bandPairs.length)];
      return { rolls: [a, b], correct: a * b, expr: `${a} × ${b}` };
    }
    const min = door.min!;
    const max = door.max!;
    const r = Array.from({ length: door.cnt }, () => Math.floor(rand() * (max - min + 1)) + min);
    return { rolls: r, correct: r.reduce((a, b) => a * b, 1), expr: [...r].sort((a, b) => a - b).join(" × ") };
  };

  let { rolls, correct, expr } = gen();
  let tries = 0;
  for (;;) {
    tries++;
    if (tries > 40) break;
    if (guards.turnUsedExprs.includes(expr)) { ({ rolls, correct, expr } = gen()); continue; }
    if (guards.lastTurnExprs.includes(expr)) { ({ rolls, correct, expr } = gen()); continue; }
    if (expr === guards.lastExpr) { ({ rolls, correct, expr } = gen()); continue; }
    if (rolls.includes(1) && guards.turnHasOne) { ({ rolls, correct, expr } = gen()); continue; }
    if (correct % 10 === 0 && guards.turnHasTen) { ({ rolls, correct, expr } = gen()); continue; }
    break;
  }
  // Guarantee no consecutive repeat even when the broader guards are exhausted.
  for (let i = 0; expr === guards.lastExpr && i < 20; i++) ({ rolls, correct, expr } = gen());
  return { rolls, correct, expr };
}

// ── Review mode: remember missed facts, re-serve them for spaced practice ──
// Selection lives here as pure helpers (the host supplies the player's fact pool
// and Math.random). The host decides *whether* to consult them per pick; these
// return null when nothing in the pool fits, so the caller falls back to a fresh
// random question. The reducer itself stays pure and unaware of the pool.

/** Parse "a × b" into a numeric factor pair (multiplication facts only). */
export function parseFactors(expr: string): [number, number] | null {
  const parts = expr.split("×").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const a = Number(parts[0]);
  const b = Number(parts[1]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return [a, b];
}

/** Canonical key for a fact, so the same pair (in any order) dedups. */
export function factKey(a: number, b: number): string {
  return `${Math.min(a, b)}x${Math.max(a, b)}`;
}

/** Weighted-random pick from a list (by `.weight`); null if empty. */
function weightedPick<T extends { weight: number }>(items: T[], rand: Rand): T | null {
  if (!items.length) return null;
  const total = items.reduce((s, it) => s + Math.max(1, it.weight), 0);
  let r = rand() * total;
  for (const it of items) {
    r -= Math.max(1, it.weight);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

/**
 * A target card built from one of the player's missed facts, if any fit this
 * level's board. Lets the find step re-test a product the player struggled with.
 */
export function pickReviewTarget(
  level: Level,
  facts: ReviewFact[],
  usedCards: number[],
  rand: Rand = Math.random
): { card: TargetCard; resetUsed: boolean } | null {
  if (!facts.length) return null;
  const pool = targetPoolFor(level);
  // Keep only facts whose product is a real target on this board, preferring
  // ones not just shown this round.
  const eligible = facts
    .map((f) => ({ f, base: pool.find((c) => c.ans === f.ans && !c.prime) }))
    .filter((x): x is { f: ReviewFact; base: TargetCard } => !!x.base);
  const fresh = eligible.filter((x) => !usedCards.includes(x.base.id));
  const choose = fresh.length ? fresh : eligible;
  const hit = weightedPick(choose.map((x) => ({ ...x, weight: x.f.weight })), rand);
  if (!hit) return null;
  // Show the exact expression the player missed.
  const card: TargetCard = { ...hit.base, ex: hit.f.expr };
  return { card, resetUsed: false };
}

/**
 * A door roll built from one of the player's missed facts that fits this door
 * and the turn's no-repeat guards; null if none fit.
 */
export function pickReviewRoll(
  door: Door,
  facts: ReviewFact[],
  guards: RollGuards,
  rand: Rand = Math.random
): RollResult | null {
  if (!facts.length) return null;
  const fits = (a: number, b: number): RollResult | null => {
    let x = a, y = b;
    if (door.ranges) {
      const [[mn1, mx1], [mn2, mx2]] = door.ranges;
      // Order the pair to match the door's asymmetric ranges (e.g. 13 × 4).
      const tryOrder = (p: number, q: number) =>
        p >= mn1 && p <= mx1 && q >= mn2 && q <= mx2;
      if (tryOrder(a, b)) { x = a; y = b; }
      else if (tryOrder(b, a)) { x = b; y = a; }
      else return null;
    } else if (door.family) {
      [x, y] = a <= b ? [a, b] : [b, a];
      // A review fact only fits this door if it belongs to its fact family.
      if (!door.family.some(([p, q]) => p === x && q === y)) return null;
    } else {
      return null;
    }
    const expr = `${x} × ${y}`;
    if (guards.turnUsedExprs.includes(expr)) return null;
    if (guards.lastTurnExprs.includes(expr)) return null;
    if (expr === guards.lastExpr) return null;
    if ([x, y].includes(1) && guards.turnHasOne) return null;
    const correct = x * y;
    if (correct % 10 === 0 && guards.turnHasTen) return null;
    return { rolls: [x, y], correct, expr };
  };
  const candidates = facts
    .map((f) => {
      const pair = parseFactors(f.expr);
      if (!pair) return null;
      const rr = fits(pair[0], pair[1]);
      return rr ? { rr, weight: f.weight } : null;
    })
    .filter((x): x is { rr: RollResult; weight: number } => !!x);
  const hit = weightedPick(candidates, rand);
  return hit ? hit.rr : null;
}

function doorProducts(door: Door): number[] {
  const prods = new Set<number>();
  if (door.ranges) {
    const [[mn1, mx1], [mn2, mx2]] = door.ranges;
    for (let a = mn1; a <= mx1; a++)
      for (let b = mn2; b <= mx2; b++)
        prods.add(a * b);
  } else if (door.family) {
    for (const [a, b] of door.family) prods.add(a * b);
  } else {
    const min = door.min!, max = door.max!;
    for (let a = min; a <= max; a++)
      for (let b = min; b <= max; b++)
        prods.add(a * b);
  }
  return [...prods];
}

/**
 * Fisher–Yates. A comparator that returns a random sign does NOT shuffle evenly:
 * measured over 300k runs it put the answer in the first two buttons 56% of the
 * time and in the last only 19%. That is a guessable pattern for a child and a
 * confound in the response-time data, so every shuffle here is uniform.
 */
function shuffle<T>(items: T[], rand: Rand): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeChoices(correct: number, door: Door, rand: Rand = Math.random): number[] {
  const allProds = doorProducts(door).filter(v => v !== correct);
  const shuffled = shuffle(allProds, rand);
  const s = new Set<number>([correct]);
  for (const v of shuffled) {
    if (s.size >= 4) break;
    s.add(v);
  }
  // Fallback for large doors: add nearby valid values if still not enough
  const maxProd = door.ranges
    ? door.ranges.reduce((a, [, mx]) => a * mx, 1)
    : door.family
    ? Math.max(...door.family.map(([a, b]) => a * b))
    : Math.pow(door.max!, door.cnt);
  let tries = 0;
  while (s.size < 4 && tries < 40) {
    tries++;
    const spread = Math.max(6, Math.floor(correct * 0.2));
    const d = Math.floor(rand() * spread) + 1;
    const v = rand() > 0.5 ? correct + d : Math.max(1, correct - d);
    if (v !== correct && v > 0 && v <= maxProd) s.add(v);
  }
  return shuffle([...s], rand);
}

export function pickSpecialId(type: CardType, level: Level, rand: Rand = Math.random): string {
  const base = SPECIAL_POOLS[type];
  // The "3 door types" limit needs 3 door colors to be fair — skip it on levels
  // that don't have that many doors (Beginner/Intermediate).
  const pool =
    type === "lim" && new Set(LVL_DOORS[level]).size < 3
      ? base.filter((c) => c.eff !== "threeColors")
      : base;
  return pool[Math.floor(rand() * pool.length)].id;
}

// ── Effect application (pure) ──

function applyEffect(
  state: GameState,
  eff: string,
  randData: { hex: number; bool: boolean; targetIdx: number }
): { turnPts: number; extraTurn: boolean; res: EffResult; players?: Player[] } {
  let tp = state.turnPts;
  let extra = false;
  let res: EffResult;
  let players: Player[] | undefined;
  switch (eff) {
    case "dblPts":
      tp *= 2;
      res = { eff: "dblPts", total: tp };
      break;
    case "add10":
      tp += 10;
      res = { eff: "add10", total: tp };
      break;
    case "speedBonus":
      // Only meaningful when the clock is running; with the timer off there is
      // no "finished fast" to measure, so the bonus does not apply.
      if (state.settings.timer && state.timerSecs > state.timerTotal / 2) {
        tp += 20;
        res = { eff: "speedBonus", applied: true, total: tp };
      } else {
        res = { eff: "speedBonus", applied: false, total: tp };
      }
      break;
    case "stepsBonus": {
      const steps = state.path.length;
      tp += steps * 2;
      res = { eff: "stepsBonus", steps, total: tp };
      break;
    }
    case "evenOnly":
      if (tp % 2 !== 0) {
        tp = Math.max(0, tp - 1);
        res = { eff: "evenOnly", applied: true, total: tp };
      } else {
        res = { eff: "evenOnly", applied: false, total: tp };
      }
      break;
    case "oddOnly":
      if (tp % 2 === 0) {
        tp = Math.max(0, tp - 1);
        res = { eff: "oddOnly", applied: true, total: tp };
      } else {
        res = { eff: "oddOnly", applied: false, total: tp };
      }
      break;
    case "threeColors": {
      // Require as many door types as the route could realistically use: the
      // smaller of 3 and the number of door types this level even has, so the
      // card is never an unavoidable penalty on Beginner/Intermediate boards.
      const available = new Set(LVL_DOORS[state.level]).size;
      const need = Math.min(3, available);
      const count = new Set(state.pathDoors).size;
      if (count < need) {
        tp = Math.max(0, Math.floor(tp / 2));
        res = { eff: "threeColors", count, applied: true, total: tp };
      } else {
        res = { eff: "threeColors", count, applied: false, total: tp };
      }
      break;
    }
    case "noRed": {
      // Charge each red/steak door its own real value (steak is worth more than
      // sausage), so the deduction matches the pellets actually earned there.
      const redDoors = state.pathDoors.filter((d) => d === "red" || d === "redlong");
      const count = redDoors.length;
      if (count > 0) {
        const lost = redDoors.reduce((s, d) => s + DC[d].pts, 0);
        tp = Math.max(0, tp - lost);
        res = { eff: "noRed", count, lost, applied: true, total: tp };
      } else {
        res = { eff: "noRed", count, lost: 0, applied: false, total: tp };
      }
      break;
    }
    case "shortPath": {
      const steps = state.path.length;
      if (steps > 4) {
        tp = Math.floor(tp * 0.75);
        res = { eff: "shortPath", steps, applied: true, total: tp };
      } else {
        res = { eff: "shortPath", steps, applied: false, total: tp };
      }
      break;
    }
    case "teleport": {
      const hex = randData.hex;
      players = state.players.map((p, i) => i === state.cur ? { ...p, hex } : p);
      res = { eff: "teleport", hex, total: tp };
      break;
    }
    case "swapHex": {
      const others = state.players.map((_, i) => i).filter(i => i !== state.cur);
      if (others.length === 0) {
        const hex = randData.hex;
        players = state.players.map((p, i) => i === state.cur ? { ...p, hex } : p);
        res = { eff: "teleport", hex, total: tp };
      } else {
        const tgtI = others[randData.targetIdx % others.length];
        const myNewHex = state.players[tgtI].hex;
        const theirNewHex = state.players[state.cur].hex;
        players = state.players.map((p, i) => {
          if (i === state.cur) return { ...p, hex: myNewHex };
          if (i === tgtI) return { ...p, hex: theirNewHex };
          return p;
        });
        res = { eff: "swapHex", withName: state.players[tgtI].name, myNewHex, total: tp };
      }
      break;
    }
    case "dblOrHalf": {
      if (randData.bool) {
        tp *= 2;
        res = { eff: "dblOrHalf", doubled: true, total: tp };
      } else {
        tp = Math.max(0, Math.floor(tp / 2));
        res = { eff: "dblOrHalf", doubled: false, total: tp };
      }
      break;
    }
    case "giveTokens": {
      if (state.players.length < 2 || state.settings.coop) {
        res = { eff: "giveTokens", given: 0, toName: "", total: tp };
        break;
      }
      let lowestIdx = -1, lowestTokens = Infinity;
      state.players.forEach((p, i) => {
        if (i !== state.cur && p.tokens < lowestTokens) {
          lowestTokens = p.tokens;
          lowestIdx = i;
        }
      });
      if (lowestIdx === -1) { res = { eff: "giveTokens", given: 0, toName: "", total: tp }; break; }
      const given = Math.min(5, state.players[state.cur].tokens);
      players = state.players.map((p, i) => {
        if (i === state.cur) return { ...p, tokens: Math.max(0, p.tokens - given) };
        if (i === lowestIdx) return { ...p, tokens: p.tokens + given };
        return p;
      });
      res = { eff: "giveTokens", given, toName: state.players[lowestIdx].name, total: tp };
      break;
    }
    case "extraTurn":
    default:
      extra = true;
      res = { eff: "extraTurn", total: tp };
      break;
  }
  return { turnPts: tp, extraTurn: extra, res, players };
}

function withError(state: GameState, record: ErrorRecord): GameState {
  return {
    ...state,
    players: state.players.map((p, i) =>
      i === state.cur ? { ...p, errors: p.errors + 1, errorLog: [...p.errorLog, record] } : p
    ),
  };
}

// ── State helpers ──

function wins100(s: GameState): boolean {
  return s.settings.winMode === "first100" || s.settings.winMode === "both";
}

function bankPoints(s: GameState): Player[] {
  if (s.settings.coop) return s.players;
  return s.players.map((p, i) =>
    i === s.cur
      ? { ...p, tokens: p.tokens + s.turnPts, foods: mergeFoods(p.foods, s.turnFoods) }
      : p
  );
}

/** Bank this turn's points and return next state up to (but not starting) a new turn. */
function collect(s: GameState, samePlayer: boolean): GameState {
  if (s.settings.freePlay) {
    const players = s.players.map((p, i) =>
      i === s.cur ? { ...p, solvedCount: p.solvedCount + s.path.length + 1 } : p
    );
    const base: GameState = { ...s, players, modal: null, timerRunning: false };
    if (samePlayer) return { ...base, awaitNewTurn: true };
    const next = (base.cur + 1) % base.players.length;
    return { ...base, cur: next, awaitNewTurn: true };
  }

  let players = s.players;
  let sharedTokens = s.sharedTokens;
  let sharedFoods = s.sharedFoods;
  if (s.settings.coop) {
    sharedTokens += s.turnPts;
    sharedFoods = mergeFoods(s.sharedFoods, s.turnFoods);
  } else {
    players = bankPoints(s);
  }
  const base: GameState = {
    ...s,
    players,
    sharedTokens,
    sharedFoods,
    modal: null,
    timerRunning: false,
  };

  // Instant-win check
  if (wins100(base)) {
    if (base.settings.coop && sharedTokens >= 100) {
      return { ...base, screen: "swin", coopWin: true };
    }
    if (!base.settings.coop && players[base.cur].tokens >= 100) {
      return { ...base, screen: "swin", winnerIdx: base.cur, coopWin: false };
    }
  }

  if (samePlayer) {
    return { ...base, awaitNewTurn: true };
  }

  // Advance turn
  const next = (base.cur + 1) % base.players.length;
  let round = base.round;
  if (next === 0) {
    round++;
    const endAt = base.settings.winMode === "first100" ? 10 : 4;
    if (round >= endAt) {
      if (base.settings.coop) {
        return { ...base, cur: next, round, screen: "swin", coopWin: true };
      }
      let bestIdx = 0;
      base.players.forEach((p, i) => {
        if (p.tokens > base.players[bestIdx].tokens) bestIdx = i;
      });
      return { ...base, cur: next, round, screen: "swin", winnerIdx: bestIdx, coopWin: false };
    }
  }
  return { ...base, cur: next, round, awaitNewTurn: true };
}

// ── Initial state ──

export function initState(locale: Locale): GameState {
  return {
    screen: "sw",
    locale,
    players: [],
    cur: 0,
    level: "med",
    settings: { timer: true, mc: true, rob: true, winMode: "both", coop: false, freePlay: false, focus: false, review: false },
    round: 0,
    sharedTokens: 0,
    phase: 0,
    card: null,
    targetHex: null,
    path: [],
    pathDoors: [],
    stepIdx: 0,
    turnPts: 0,
    turnFoods: {},
    sharedFoods: {},
    timerSecs: 180,
    timerTotal: 180,
    timerRunning: false,
    pendingRoll: null,
    boardAns: false,
    edgeColors: {},
    usedCards: [],
    extraTurn: false,
    turnUsedExprs: [],
    lastTurnExprs: [],
    lastExpr: "",
    turnHasOne: false,
    turnHasTen: false,
    wrongHex: null,
    wrongAnswerVisible: false,
    helperSolvedBy: null,
    mcWrong: null,
    mcCorrect: null,
    inputWrong: false,
    choices: null,
    diceSpin: false,
    modal: null,
    instIdx: 0,
    instOpen: false,
    instMode: "full",
    instLevel: null,
    winnerIdx: null,
    coopWin: false,
    endedEarly: false,
    awaitNewTurn: false,
    tourActive: false,
    tourStep: 0,
    tourReturn: "ss",
    tourInteract: null,
  };
}

// ── Actions ──

export type Action =
  | { type: "SHOW_SCREEN"; screen: GameState["screen"] }
  | { type: "END_GAME" }
  | { type: "GO_INST" }
  | { type: "GO_SIMPLE_GUIDE"; level: Level | null }
  | { type: "CLOSE_INST" }
  | { type: "INST_SET"; idx: number }
  | { type: "GO_SETUP" }
  | { type: "GO_SETUP_LEVEL"; level: Level }
  | { type: "GO_QUICK" }
  | {
      type: "START_GAME";
      players: Player[];
      level: Level;
      settings: Settings;
    }
  | { type: "START_P1"; card: TargetCard; resetUsed: boolean }
  | { type: "HEX_CLICK"; n: number }
  | { type: "CLEAR_WRONG_HEX" }
  | { type: "START_P2" }
  | { type: "CLEAR_PATH" }
  | { type: "CONFIRM_PATH" }
  | { type: "REVEAL_TARGET" }
  | { type: "ROLL_DICE"; step: number; roll: RollResult; choices: number[] | null }
  | { type: "STOP_SPIN" }
  | { type: "MC_ANSWER"; chosen: number }
  | { type: "INPUT_ANSWER"; value: number }
  | { type: "CLEAR_ANSWER_FLASH" }
  | { type: "MARK_CORRECT" }
  | { type: "COMMIT_STEP" }
  | { type: "OPEN_FORFEIT" }
  | { type: "FORFEIT_COLLECT" }
  | { type: "TICK" }
  | { type: "OPEN_DRAW"; cardType: CardType; cardId: string; randData: { hex: number; bool: boolean; targetIdx: number } }
  | { type: "COLLECT_NEXT" }
  | { type: "COLLECT_THEN_EXTRA" }
  | { type: "OPEN_ROB" }
  | { type: "DO_ROB"; index: number }
  | { type: "OPEN_MODAL"; modal: GameState["modal"] }
  | { type: "CLOSE_MODAL" }
  | { type: "SPECTATOR_BONUS"; playerIdx: number }
  | { type: "OPEN_PRIME_HEX"; hex: number }
  | { type: "FACTOR_SOLVED" }
  | { type: "FACTOR_SKIP" }
  | { type: "TOUR_START"; origin: GameState["screen"] }
  | { type: "TOUR_SET"; step: number }
  | { type: "TOUR_END" }
  | { type: "SET_TOUR_INTERACT"; mode: "find" | "answer" | null }
  | {
      type: "DEMO_STAGE";
      phase: Phase;
      targetHex: number | null;
      path: number[];
      pathDoors: DoorKey[];
      pendingRoll: PendingRoll | null;
      choices: number[] | null;
      timerOn: boolean;
    };

function startNewTurnState(s: GameState, card: TargetCard, resetUsed: boolean): GameState {
  return {
    ...s,
    phase: 1,
    targetHex: null,
    path: [],
    pathDoors: [],
    stepIdx: 0,
    turnPts: 0,
    turnFoods: {},
    boardAns: false,
    extraTurn: false,
    lastTurnExprs: s.turnUsedExprs,
    turnUsedExprs: [],
    turnHasOne: false,
    turnHasTen: false,
    card,
    usedCards: (resetUsed ? [] : s.usedCards).concat(card.id),
    pendingRoll: null,
    choices: null,
    mcWrong: null,
    mcCorrect: null,
    inputWrong: false,
    wrongHex: null,
    wrongAnswerVisible: false,
    helperSolvedBy: null,
    diceSpin: false,
    timerRunning: false,
    modal: null,
    awaitNewTurn: false,
  };
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "SHOW_SCREEN":
      return { ...state, screen: action.screen, modal: null };

    // Stopping a game goes to the end screen rather than straight back to the
    // welcome screen. That screen is where a session is written to the results
    // log, so leaving by any other route silently threw the whole session away —
    // which is every free-play session, since free play has no natural end.
    case "END_GAME": {
      const best = state.players.reduce(
        (bi, p, i) => (p.tokens > state.players[bi].tokens ? i : bi),
        0
      );
      return {
        ...state,
        screen: "swin",
        modal: null,
        timerRunning: false,
        endedEarly: true,
        coopWin: state.settings.coop,
        winnerIdx: state.settings.coop || state.settings.freePlay ? null : best,
      };
    }

    case "GO_INST":
      return { ...state, instOpen: true, instIdx: 0, instMode: "full" };

    case "GO_SIMPLE_GUIDE":
      return { ...state, instOpen: true, instIdx: 0, instMode: "simple", instLevel: action.level };

    case "CLOSE_INST":
      return { ...state, instOpen: false };

    case "INST_SET":
      return { ...state, instIdx: action.idx };

    case "GO_SETUP":
      return { ...state, screen: "ss" };

    case "GO_SETUP_LEVEL":
      return { ...state, level: action.level, screen: "ss" };

    case "GO_QUICK":
      return { ...state, screen: "sq", modal: null };

    case "START_GAME": {
      const edgeColors = initEdgeColors(action.level);
      return {
        ...state,
        screen: "sg",
        players: action.players.map(p => ({ ...p, errorLog: p.errorLog ?? [], solvedCount: p.solvedCount ?? 0, foods: p.foods ?? {} })),
        level: action.level,
        settings: action.settings,
        cur: 0,
        round: 0,
        usedCards: [],
        sharedTokens: 0,
        sharedFoods: {},
        turnFoods: {},
        edgeColors,
        turnUsedExprs: [],
        lastTurnExprs: [],
        lastExpr: "",
        turnHasOne: false,
        turnHasTen: false,
        winnerIdx: null,
        coopWin: false,
        endedEarly: false,
        awaitNewTurn: true,
      };
    }

    case "START_P1":
      return startNewTurnState(state, action.card, action.resetUsed);

    case "HEX_CLICK": {
      const n = action.n;
      if (state.phase === 1) {
        if (state.card && n === state.card.ans) {
          // During the guided tour the tour drives the flow — register the hit
          // quietly (no "found" popup) so the tour can react and move on.
          if (state.tourActive) {
            return { ...state, targetHex: n, wrongHex: null, modal: null };
          }
          return {
            ...state,
            targetHex: n,
            wrongHex: null,
            modal: { kind: "found", hex: n, sym: hexSym(n) },
          };
        }
        return { ...withError(state, { phase: 1, expr: state.card?.ex ?? "", correct: state.card?.ans ?? 0, wrong: n }), wrongHex: n };
      }
      if (state.phase === 2) {
        const start = state.players[state.cur].hex;
        if (n === start) return state;
        const idx = state.path.indexOf(n);
        if (idx !== -1) {
          return {
            ...state,
            path: state.path.slice(0, idx),
            pathDoors: state.pathDoors.slice(0, idx),
          };
        }
        const from = state.path.length ? state.path[state.path.length - 1] : start;
        // Enforce a connected walk: each step must be adjacent to the previous hex.
        if (!hNeighbors(from).includes(n)) {
          return { ...state, wrongHex: n };
        }
        const col = edgeColor(state.edgeColors, state.level, from, n);
        return {
          ...state,
          path: [...state.path, n],
          pathDoors: [...state.pathDoors, col],
          wrongHex: null,
        };
      }
      if (state.phase === 3 && state.boardAns && state.pendingRoll) {
        if (n === state.pendingRoll.correct) {
          return markCorrect(state);
        }
        return { ...withError(state, { phase: 3, expr: state.pendingRoll.expr, correct: state.pendingRoll.correct, wrong: n }), wrongHex: n, wrongAnswerVisible: true };
      }
      return state;
    }

    case "CLEAR_WRONG_HEX":
      return { ...state, wrongHex: null };

    case "START_P2":
      return { ...state, phase: 2, path: [], pathDoors: [], modal: null };

    case "CLEAR_PATH":
      return { ...state, path: [], pathDoors: [] };

    case "CONFIRM_PATH": {
      let path = state.path;
      let pathDoors = state.pathDoors;
      if (path[0] === state.targetHex && path[path.length - 1] !== state.targetHex) {
        path = [...path].reverse();
        pathDoors = [...pathDoors].reverse();
      }
      // The walk ends at the target, so drop any steps planned beyond it —
      // they would never be walked and must not inflate the route.
      if (state.targetHex !== null) {
        const ti = path.indexOf(state.targetHex);
        if (ti !== -1 && ti < path.length - 1) {
          path = path.slice(0, ti + 1);
          pathDoors = pathDoors.slice(0, ti + 1);
        }
      }
      // The clock is sized to the route the player just committed to.
      const total = timerTotalFor(state.level, path.length);
      return {
        ...state,
        path,
        pathDoors,
        phase: 3,
        stepIdx: 0,
        turnPts: 0,
        turnFoods: {},
        boardAns: false,
        helperSolvedBy: null,
        timerSecs: total,
        timerTotal: total,
        timerRunning: state.settings.timer,
      };
    }

    case "REVEAL_TARGET":
      return state.card
        ? { ...state, modal: { kind: "reveal", ans: state.card.ans } }
        : state;

    case "ROLL_DICE": {
      const col = state.pathDoors[action.step];
      const dc = DC[col];
      const { rolls, correct, expr } = action.roll;
      return {
        ...state,
        turnUsedExprs: [...state.turnUsedExprs, expr],
        turnHasOne: state.turnHasOne || rolls.includes(1),
        turnHasTen: state.turnHasTen || correct % 10 === 0,
        lastExpr: expr,
        pendingRoll: { rolls, color: col, pts: dc.pts, expr, correct },
        // Answers in the walk stage are typed or chosen from cards — not tapped
        // on the board — so the board never enters answer mode here.
        boardAns: false,
        choices: action.choices,
        diceSpin: true,
        wrongAnswerVisible: false,
        helperSolvedBy: null,
        mcWrong: null,
        mcCorrect: null,
        inputWrong: false,
      };
    }

    case "STOP_SPIN":
      return { ...state, diceSpin: false };

    case "MC_ANSWER": {
      if (!state.pendingRoll) return state;
      if (action.chosen === state.pendingRoll.correct) return markCorrect(state);
      return { ...withError(state, { phase: 3, expr: state.pendingRoll.expr, correct: state.pendingRoll.correct, wrong: action.chosen }), mcWrong: action.chosen, wrongAnswerVisible: true };
    }

    case "INPUT_ANSWER": {
      if (!state.pendingRoll) return state;
      if (action.value === state.pendingRoll.correct) return markCorrect(state);
      return { ...withError(state, { phase: 3, expr: state.pendingRoll.expr, correct: state.pendingRoll.correct, wrong: action.value }), inputWrong: true, wrongAnswerVisible: true };
    }

    case "CLEAR_ANSWER_FLASH":
      return { ...state, mcWrong: null, inputWrong: false, wrongHex: null };

    case "MARK_CORRECT":
      return markCorrect(state);

    case "COMMIT_STEP":
      return commitStep(state);

    case "OPEN_FORFEIT":
      return state.pendingRoll
        ? {
            ...state,
            boardAns: false,
            timerRunning: false,
            modal: {
              kind: "forfeit",
              correct: state.pendingRoll.correct,
              hex: state.players[state.cur].hex,
              turnPts: state.turnPts,
            },
          }
        : state;

    case "FORFEIT_COLLECT":
      return collect(state, false);

    case "TICK": {
      if (!state.timerRunning) return state;
      const secs = state.timerSecs - 1;
      if (secs <= 0) {
        return {
          ...state,
          timerSecs: 0,
          timerRunning: false,
          boardAns: false,
          modal: { kind: "timeout", hex: state.players[state.cur].hex },
        };
      }
      return { ...state, timerSecs: secs };
    }

    case "OPEN_DRAW": {
      const def = SPECIAL_BY_ID[action.cardId];
      const { turnPts, extraTurn, res, players } = applyEffect(state, def.eff, action.randData);
      return {
        ...state,
        ...(players ? { players } : {}),
        turnPts,
        extraTurn,
        modal: {
          kind: "card",
          cardType: action.cardType,
          cardId: action.cardId,
          isExtra: def.eff === "extraTurn",
          turnPts,
          effResult: res,
        },
      };
    }

    case "COLLECT_NEXT":
      return collect(state, false);

    case "COLLECT_THEN_EXTRA":
      return collect(state, true);

    case "OPEN_ROB": {
      if (state.settings.coop || state.players.length < 2) {
        return collect(state, false);
      }
      const targets = state.players
        .map((p, index) => ({ index, name: p.name, tokens: p.tokens }))
        .filter((t) => t.index !== state.cur);
      return { ...state, modal: { kind: "rob", targets } };
    }

    case "DO_ROB": {
      const t = state.players[action.index];
      // ~10% of the rival's pellets (2–15), but never more than they actually
      // have — so robbing a broke rival can't conjure pellets from nothing.
      const stolen = Math.min(t.tokens, Math.min(15, Math.max(2, Math.round(t.tokens * 0.1))));
      const players = state.players.map((p, i) =>
        i === action.index ? { ...p, tokens: Math.max(0, p.tokens - stolen) } : p
      );
      return {
        ...state,
        players,
        turnPts: state.turnPts + stolen,
        modal: { kind: "robResult", stolen, name: t.name },
      };
    }

    case "SPECTATOR_BONUS": {
      const helperSolvedBy = state.players[action.playerIdx]?.name ?? null;
      if (state.settings.coop) {
        return { ...state, sharedTokens: state.sharedTokens + 1, helperSolvedBy };
      }
      const players = state.players.map((p, i) =>
        i === action.playerIdx ? { ...p, tokens: p.tokens + 1 } : p
      );
      return { ...state, players, helperSolvedBy };
    }

    case "OPEN_MODAL":
      return { ...state, modal: action.modal };

    case "CLOSE_MODAL":
      return { ...state, modal: null };

    case "OPEN_PRIME_HEX":
      return { ...state, modal: { kind: "primeHex", hex: action.hex } };

    case "FACTOR_SOLVED": {
      if (state.modal?.kind !== "factor") return state;
      const turnPts = state.turnPts + FACTOR_SOLVE_BONUS;
      return {
        ...state,
        turnPts,
        modal: {
          kind: "arrival",
          hex: state.modal.hex,
          turnPts,
          sym: state.modal.sym,
          factorTiles: state.modal.factorTiles,
        },
      };
    }

    case "FACTOR_SKIP": {
      if (state.modal?.kind !== "factor") return state;
      return {
        ...state,
        modal: {
          kind: "arrival",
          hex: state.modal.hex,
          turnPts: state.turnPts,
          sym: state.modal.sym,
          factorTiles: state.modal.factorTiles,
        },
      };
    }

    case "TOUR_START":
      return { ...state, tourActive: true, tourStep: 0, tourInteract: null, tourReturn: action.origin };

    case "TOUR_SET":
      return { ...state, tourStep: action.step };

    case "SET_TOUR_INTERACT":
      return { ...state, tourInteract: action.mode };

    case "TOUR_END":
      // Leave the sample game and return to wherever the tour was launched from
      // (the quick-launch screen or the setup screen).
      return { ...state, tourActive: false, tourStep: 0, tourInteract: null, modal: null, timerRunning: false, screen: state.tourReturn };

    case "DEMO_STAGE": {
      // Drive the sample game into the phase a tour step is explaining, so the
      // real board and panel reflect that stage live. Host computes route/roll.
      const total = timerTotalFor(state.level, action.path.length);
      return {
        ...state,
        phase: action.phase,
        targetHex: action.targetHex,
        path: action.path,
        pathDoors: action.pathDoors,
        stepIdx: 0,
        turnPts: 0,
        turnFoods: {},
        boardAns: action.pendingRoll != null,
        pendingRoll: action.pendingRoll,
        choices: action.choices,
        diceSpin: false,
        mcWrong: null,
        mcCorrect: null,
        inputWrong: false,
        wrongHex: null,
        wrongAnswerVisible: false,
        helperSolvedBy: null,
        timerSecs: total,
        timerTotal: total,
        timerRunning: action.timerOn,
        modal: null,
      };
    }

    default:
      return state;
  }
}

function markCorrect(state: GameState): GameState {
  if (!state.pendingRoll) return state;
  const h = state.path[state.stepIdx];
  const players = state.players.map((p, i) =>
    i === state.cur ? { ...p, hex: h } : p
  );
  const door = state.pendingRoll.color;
  const turnFoods = mergeFoods(state.turnFoods, { [door]: 1 });
  return {
    ...state,
    boardAns: false,
    turnPts: state.turnPts + state.pendingRoll.pts,
    turnFoods,
    players,
    mcCorrect: state.pendingRoll.correct,
    wrongAnswerVisible: false,
    helperSolvedBy: null,
    mcWrong: null,
    inputWrong: false,
    wrongHex: null,
  };
}

function commitStep(state: GameState): GameState {
  const movedHex = state.path[state.stepIdx];
  const stepIdx = state.stepIdx + 1;
  const base: GameState = {
    ...state,
    stepIdx,
    pendingRoll: null,
    choices: null,
    mcCorrect: null,
    mcWrong: null,
    inputWrong: false,
    diceSpin: false,
    wrongAnswerVisible: false,
    helperSolvedBy: null,
  };
  if (movedHex === state.targetHex || stepIdx >= state.path.length) {
    const hex = state.targetHex!;
    // Route factor-tile bonus: reward steps taken on tiles that divide the target.
    let turnPts = base.turnPts;
    let factorTiles = 0;
    if (factorBonusActive(state.level)) {
      factorTiles = state.path.filter((h) => h !== hex && h >= 2 && hex % h === 0).length;
      turnPts += factorTiles * FACTOR_TILE_BONUS;
    }
    const common: GameState = { ...base, turnPts, timerRunning: false, extraTurn: false };
    // Calm mode hides the special tiles, so arrivals never trigger bonus/limit/
    // rob/twist draws — the factoring challenge (pure math) still applies.
    const sym = state.settings.focus ? "" : hexSym(hex);
    // Prime (Twist) hexes go straight to the prime-number explanation — skip the
    // separate "Draw Twist" arrival popup so there's only one window, not two.
    if (sym === "🎲") {
      return { ...common, modal: { kind: "primeHex", hex } };
    }
    // Composite targets get an optional "break it into factors" challenge first.
    if (factorBonusActive(state.level) && hasFactorPair(hex)) {
      return { ...common, modal: { kind: "factor", hex, turnPts, sym, factorTiles } };
    }
    return { ...common, modal: { kind: "arrival", hex, turnPts, sym, factorTiles } };
  }
  return base;
}

/**
 * Is the planned route finished — at least one step, and it actually gets to the
 * target hex? This is what decides whether the walk may begin, so the confirm
 * button, the "route ready" window and the board controls all read it from here
 * rather than each working it out again.
 */
export function routeReachesTarget(s: GameState): boolean {
  return s.path.length > 0 && s.targetHex !== null && s.path.includes(s.targetHex);
}

export { isPrime };
