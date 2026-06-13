import {
  DC,
  FACTOR_SOLVE_BONUS,
  FACTOR_TILE_BONUS,
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
  GameState,
  Level,
  Locale,
  PendingRoll,
  Phase,
  Player,
  Settings,
  TargetCard,
} from "./types";

export type Rand = () => number;

// ── Pure RNG helpers (called by the host with Math.random; reducer stays pure) ──

export function pickTargetCard(
  level: Level,
  usedCards: number[],
  rand: Rand = Math.random
): { card: TargetCard; resetUsed: boolean } {
  // Each level has its own multiplication target pool, already sized to its board.
  const pool = targetPoolFor(level);
  let avail = pool.filter((c) => !usedCards.includes(c.id));
  let resetUsed = false;
  if (!avail.length) {
    resetUsed = true;
    avail = pool;
  }
  const card = avail[Math.floor(rand() * avail.length)];
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
  let rolls: number[] = [];
  let correct = 0;
  let expr = "";
  let tries = 0;
  for (;;) {
    if (door.ranges) {
      rolls = door.ranges.map(([mn, mx]) => Math.floor(rand() * (mx - mn + 1)) + mn);
      correct = rolls.reduce((a, b) => a * b, 1);
      expr = rolls.join(" × ");
    } else {
      const min = door.min!;
      const max = door.max!;
      rolls = Array.from({ length: door.cnt }, () => Math.floor(rand() * (max - min + 1)) + min);
      correct = rolls.reduce((a, b) => a * b, 1);
      expr = [...rolls].sort((a, b) => a - b).join(" × ");
    }
    tries++;
    if (tries > 40) break;
    if (guards.turnUsedExprs.includes(expr)) continue;
    if (guards.lastTurnExprs.includes(expr)) continue;
    if (expr === guards.lastExpr) continue;
    if (rolls.includes(1) && guards.turnHasOne) continue;
    if (correct % 10 === 0 && guards.turnHasTen) continue;
    break;
  }
  // Guarantee no consecutive repeat even when the broader guards are exhausted.
  for (let i = 0; expr === guards.lastExpr && i < 20; i++) {
    if (door.ranges) {
      rolls = door.ranges.map(([mn, mx]) => Math.floor(rand() * (mx - mn + 1)) + mn);
      correct = rolls.reduce((a, b) => a * b, 1);
      expr = rolls.join(" × ");
    } else {
      const min = door.min!;
      const max = door.max!;
      rolls = Array.from({ length: door.cnt }, () => Math.floor(rand() * (max - min + 1)) + min);
      correct = rolls.reduce((a, b) => a * b, 1);
      expr = [...rolls].sort((a, b) => a - b).join(" × ");
    }
  }
  return { rolls, correct, expr };
}

function doorProducts(door: Door): number[] {
  const prods = new Set<number>();
  if (door.ranges) {
    const [[mn1, mx1], [mn2, mx2]] = door.ranges;
    for (let a = mn1; a <= mx1; a++)
      for (let b = mn2; b <= mx2; b++)
        prods.add(a * b);
  } else {
    const min = door.min!, max = door.max!;
    for (let a = min; a <= max; a++)
      for (let b = min; b <= max; b++)
        prods.add(a * b);
  }
  return [...prods];
}

export function makeChoices(correct: number, door: Door, rand: Rand = Math.random): number[] {
  const allProds = doorProducts(door).filter(v => v !== correct);
  const shuffled = [...allProds].sort(() => rand() - 0.5);
  const s = new Set<number>([correct]);
  for (const v of shuffled) {
    if (s.size >= 4) break;
    s.add(v);
  }
  // Fallback for large doors: add nearby valid values if still not enough
  const maxProd = door.ranges
    ? door.ranges.reduce((a, [, mx]) => a * mx, 1)
    : Math.pow(door.max!, door.cnt);
  let tries = 0;
  while (s.size < 4 && tries < 40) {
    tries++;
    const spread = Math.max(6, Math.floor(correct * 0.2));
    const d = Math.floor(rand() * spread) + 1;
    const v = rand() > 0.5 ? correct + d : Math.max(1, correct - d);
    if (v !== correct && v > 0 && v <= maxProd) s.add(v);
  }
  return [...s].sort(() => rand() - 0.5);
}

export function pickSpecialId(type: CardType, rand: Rand = Math.random): string {
  const pool = SPECIAL_POOLS[type];
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
    case "add15":
      tp += 15;
      res = { eff: "add15", total: tp };
      break;
    case "speedBonus":
      if (state.timerSecs > state.timerTotal / 2) {
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
      const count = new Set(state.pathDoors).size;
      if (count < 3) {
        tp = Math.max(0, Math.floor(tp / 2));
        res = { eff: "threeColors", count, applied: true, total: tp };
      } else {
        res = { eff: "threeColors", count, applied: false, total: tp };
      }
      break;
    }
    case "noRed": {
      const count = state.pathDoors.filter((d) => d === "red" || d === "redlong").length;
      if (count > 0) {
        const lost = count * DC.red.pts;
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
    i === s.cur ? { ...p, tokens: p.tokens + s.turnPts } : p
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
  if (s.settings.coop) {
    sharedTokens += s.turnPts;
  } else {
    players = bankPoints(s);
  }
  const base: GameState = {
    ...s,
    players,
    sharedTokens,
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
    settings: { timer: true, mc: true, rob: true, winMode: "both", coop: false, freePlay: false },
    round: 0,
    sharedTokens: 0,
    phase: 0,
    card: null,
    targetHex: null,
    path: [],
    pathDoors: [],
    stepIdx: 0,
    turnPts: 0,
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
    awaitNewTurn: false,
    tourActive: false,
    tourStep: 0,
  };
}

// ── Actions ──

export type Action =
  | { type: "SHOW_SCREEN"; screen: GameState["screen"] }
  | { type: "GO_INST" }
  | { type: "GO_SIMPLE_GUIDE"; level: Level | null }
  | { type: "CLOSE_INST" }
  | { type: "INST_SET"; idx: number }
  | { type: "GO_SETUP" }
  | { type: "GO_SETUP_LEVEL"; level: Level }
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
  | { type: "TOUR_START" }
  | { type: "TOUR_SET"; step: number }
  | { type: "TOUR_END" }
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

    case "START_GAME": {
      const edgeColors = initEdgeColors(action.level);
      return {
        ...state,
        screen: "sg",
        players: action.players.map(p => ({ ...p, errorLog: p.errorLog ?? [], solvedCount: p.solvedCount ?? 0 })),
        level: action.level,
        settings: action.settings,
        cur: 0,
        round: 0,
        usedCards: [],
        sharedTokens: 0,
        edgeColors,
        turnUsedExprs: [],
        lastTurnExprs: [],
        lastExpr: "",
        turnHasOne: false,
        turnHasTen: false,
        winnerIdx: null,
        coopWin: false,
        awaitNewTurn: true,
      };
    }

    case "START_P1":
      return startNewTurnState(state, action.card, action.resetUsed);

    case "HEX_CLICK": {
      const n = action.n;
      if (state.phase === 1) {
        if (state.card && n === state.card.ans) {
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
      const total = timerTotalFor(state.level);
      return {
        ...state,
        path,
        pathDoors,
        phase: 3,
        stepIdx: 0,
        turnPts: 0,
        boardAns: false,
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
        boardAns: true,
        choices: action.choices,
        diceSpin: true,
        wrongAnswerVisible: false,
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
      const stolen = Math.min(15, Math.max(2, Math.round(t.tokens * 0.1)));
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
      if (state.settings.coop) {
        return { ...state, sharedTokens: state.sharedTokens + 1 };
      }
      const players = state.players.map((p, i) =>
        i === action.playerIdx ? { ...p, tokens: p.tokens + 1 } : p
      );
      return { ...state, players };
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
      return { ...state, tourActive: true, tourStep: 0 };

    case "TOUR_SET":
      return { ...state, tourStep: action.step };

    case "TOUR_END":
      // Leave the sample game and return to this level's setup screen.
      return { ...state, tourActive: false, tourStep: 0, modal: null, timerRunning: false, screen: "ss" };

    case "DEMO_STAGE": {
      // Drive the sample game into the phase a tour step is explaining, so the
      // real board and panel reflect that stage live. Host computes route/roll.
      const total = timerTotalFor(state.level);
      return {
        ...state,
        phase: action.phase,
        targetHex: action.targetHex,
        path: action.path,
        pathDoors: action.pathDoors,
        stepIdx: 0,
        turnPts: 0,
        boardAns: action.pendingRoll != null,
        pendingRoll: action.pendingRoll,
        choices: action.choices,
        diceSpin: false,
        mcWrong: null,
        mcCorrect: null,
        inputWrong: false,
        wrongHex: null,
        wrongAnswerVisible: false,
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
  return {
    ...state,
    boardAns: false,
    turnPts: state.turnPts + state.pendingRoll.pts,
    players,
    mcCorrect: state.pendingRoll.correct,
    wrongAnswerVisible: false,
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
    // Composite targets get an optional "break it into factors" challenge first.
    if (factorBonusActive(state.level) && hasFactorPair(hex)) {
      return { ...common, modal: { kind: "factor", hex, turnPts, sym: hexSym(hex), factorTiles } };
    }
    return { ...common, modal: { kind: "arrival", hex, turnPts, sym: hexSym(hex), factorTiles } };
  }
  return base;
}

export { isPrime };
