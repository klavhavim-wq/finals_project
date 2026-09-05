export type Locale = "en" | "he";

export type DoorKey = "blue" | "purple" | "yellow" | "red" | "redlong";

export type Level = "beg" | "med" | "adv" | "champ" | "hero";

export type WinMode = "rounds" | "first100" | "both";

/** Quick-launch presets — one-tap setups for common scenarios. */
export type PresetId = "focus" | "full" | "calm" | "free";

export type Screen = "sw" | "si" | "ss" | "sq" | "sg" | "swin" | "sresults";

/** 0 = not in game; 1 = find target; 2 = plan route; 3 = execute */
export type Phase = 0 | 1 | 2 | 3;

export type CardType = "lim" | "bon" | "twi";

export type Effect =
  | "dblPts"
  | "add10"
  | "speedBonus"
  | "stepsBonus"
  | "evenOnly"
  | "oddOnly"
  | "threeColors"
  | "noRed"
  | "shortPath"
  | "extraTurn"
  | "teleport"
  | "swapHex"
  | "dblOrHalf"
  | "giveTokens";

export interface ErrorRecord {
  phase: 1 | 3;
  expr: string;
  correct: number;
  wrong: number;
}

/**
 * One row per answer attempt — the research-grade chronometric log.
 * Built in the host (useGame) where timing lives, so the reducer stays pure.
 */
export interface TrialRecord {
  /** ISO timestamp of the answer */
  ts: string;
  player: string;
  level: Level;
  /** which stage produced the question */
  phase: "find" | "walk" | "factor";
  /** "target" for find; door key for walk; "factor" for factoring */
  qType: string;
  expr: string;
  answer: number;
  response: number;
  correct: boolean;
  /** attempt number within this item (1 = first try) */
  attempt: number;
  /** response time in ms (attempt 1: from presentation; later: from previous answer) */
  rtMs: number;
  /** how the answer was entered */
  mode: "mc" | "typed" | "hex";
  hintUsed: boolean;
  revealed: boolean;
  timerOn: boolean;
  timeLeftMs: number;
}

export interface Door {
  key: DoorKey;
  /** symmetric dice range (legacy fallback) */
  min?: number;
  max?: number;
  /** asymmetric ranges per die (hero / redlong) */
  ranges?: [number, number][];
  /**
   * The exact factor pairs (a ≤ b) this door asks. Doors are fact families, not
   * product ranges: how hard a multiplication fact is depends on whether it can
   * be derived by a rule, not on how big its answer is.
   */
  family?: [number, number][];
  cnt: number;
  pts: number;
  color: string;
}

export interface TargetCard {
  id: number;
  ex: string;
  ans: number;
  prime?: boolean;
}

export interface SpecialCardDef {
  id: string;
  type: CardType;
  icon: string;
  eff: Effect;
}

export interface Settings {
  timer: boolean;
  mc: boolean;
  rob: boolean;
  winMode: WinMode;
  coop: boolean;
  freePlay: boolean;
  /** Calm mode: hide the special tiles (bonus/limit/rob/twist) for a low-distraction run. */
  focus: boolean;
  /** Remember a player's missed facts and re-serve them for spaced practice. */
  review: boolean;
}

/** A math fact a player got wrong, kept for spaced re-practice (review mode). */
export interface ReviewFact {
  /** normalised factor key, e.g. "4x13" (min×max) — dedups pairs of the same fact */
  key: string;
  /** the expression as it was shown, e.g. "7 × 8" */
  expr: string;
  /** the correct answer (the product) */
  ans: number;
  /** how strongly it's still due for review; counts down on correct, up on wrong */
  weight: number;
}

/** How many of each food (door type) a player has banked, for the bank breakdown. */
export type FoodTally = Partial<Record<DoorKey, number>>;

export interface Player {
  name: string;
  color: string;
  tokens: number;
  hex: number;
  errors: number;
  errorLog: ErrorRecord[];
  solvedCount: number;
  /** Foods banked over the whole game, by door type (the bank breakdown). */
  foods: FoodTally;
}

export interface SessionRecord {
  id: string;
  date: string;
  level: Level;
  settings?: Settings;
  coop: boolean;
  players: { name: string; tokens: number; errors: number; solvedCount?: number; errorLog?: ErrorRecord[] }[];
  winnerName: string | null;
  sharedTokens?: number;
  /** chronometric log */
  startedAt?: string;
  endedAt?: string;
  trials?: TrialRecord[];
}

export interface PendingRoll {
  rolls: number[];
  color: DoorKey;
  pts: number;
  expr: string;
  correct: number;
}

/** Structured outcome of a special card so messages can be localized in the UI. */
export type EffResult =
  | { eff: "dblPts"; total: number }
  | { eff: "add10"; total: number }
  | { eff: "speedBonus"; applied: boolean; total: number }
  | { eff: "stepsBonus"; steps: number; total: number }
  | { eff: "evenOnly"; applied: boolean; total: number }
  | { eff: "oddOnly"; applied: boolean; total: number }
  | { eff: "threeColors"; count: number; applied: boolean; total: number }
  | { eff: "noRed"; count: number; lost: number; applied: boolean; total: number }
  | { eff: "shortPath"; steps: number; applied: boolean; total: number }
  | { eff: "extraTurn"; total: number }
  | { eff: "teleport"; hex: number; total: number }
  | { eff: "swapHex"; withName: string; myNewHex: number; total: number }
  | { eff: "dblOrHalf"; doubled: boolean; total: number }
  | { eff: "giveTokens"; given: number; toName: string; total: number };

export type ModalState =
  | { kind: "reveal"; ans: number }
  | { kind: "found"; hex: number; sym: string }
  | { kind: "arrival"; hex: number; turnPts: number; sym: string; factorTiles: number }
  | { kind: "factor"; hex: number; turnPts: number; sym: string; factorTiles: number }
  | {
      kind: "card";
      cardType: CardType;
      cardId: string;
      isExtra: boolean;
      turnPts: number;
      effResult: EffResult | null;
    }
  | { kind: "rob"; targets: { index: number; name: string; tokens: number }[] }
  | { kind: "robResult"; stolen: number; name: string }
  | { kind: "forfeit"; correct: number; hex: number; turnPts: number }
  | { kind: "timeout"; hex: number }
  | { kind: "confirmEnd" }
  | { kind: "settingsHelp" }
  | { kind: "video"; videoKey: string }
  | { kind: "primeHex"; hex: number };

export interface GameState {
  screen: Screen;
  locale: Locale;

  players: Player[];
  cur: number;
  level: Level;
  settings: Settings;
  round: number;
  sharedTokens: number;

  phase: Phase;
  card: TargetCard | null;
  targetHex: number | null;
  path: number[];
  pathDoors: DoorKey[];
  stepIdx: number;
  turnPts: number;
  /** foods earned during the current walk, banked at end of turn */
  turnFoods: FoodTally;
  /** shared foods bank (cooperative mode) */
  sharedFoods: FoodTally;

  timerSecs: number;
  timerTotal: number;
  timerRunning: boolean;

  pendingRoll: PendingRoll | null;
  boardAns: boolean;
  edgeColors: Record<string, DoorKey>;
  usedCards: number[];
  extraTurn: boolean;

  /** exercise-repetition guards */
  turnUsedExprs: string[];
  lastTurnExprs: string[];
  lastExpr: string;
  turnHasOne: boolean;
  turnHasTen: boolean;

  /** transient UI: feedback on board, mc/input answer state */
  wrongHex: number | null;
  wrongAnswerVisible: boolean;
  /** name of a watching friend who just answered the open question correctly,
   *  so the active player can choose to reveal that answer (the solution) */
  helperSolvedBy: string | null;
  mcWrong: number | null;
  mcCorrect: number | null;
  inputWrong: boolean;
  choices: number[] | null;
  diceSpin: boolean;

  modal: ModalState | null;

  /** instructions wizard page index */
  instIdx: number;
  /** instructions shown as an overlay on top of the current screen */
  instOpen: boolean;
  /** which guide is open: the short simple one or the full detailed one */
  instMode: "simple" | "full";
  /** level the simple guide is tailored to (null = all levels / welcome) */
  instLevel: Level | null;

  /** win screen data */
  winnerIdx: number | null;
  coopWin: boolean;
  /**
   * The players stopped the game themselves rather than playing it out. The end
   * screen says so instead of crowning a winner — and, crucially, stopping still
   * goes through that screen, because that is where the session is saved.
   */
  endedEarly: boolean;

  /** set when the game should begin a fresh turn (engine asks the host to pick a card) */
  awaitNewTurn: boolean;

  /** guided demo tour: overlay of step-by-step popups over a live sample game */
  tourActive: boolean;
  tourStep: number;
  /** screen to return to when the tour ends (where it was launched from) */
  tourReturn: Screen;
  /** when set, the current tour step asks the player to really do this action */
  tourInteract: "find" | "answer" | null;
}
