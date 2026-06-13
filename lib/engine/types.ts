export type Locale = "en" | "he";

export type DoorKey = "blue" | "purple" | "yellow" | "red" | "redlong";

export type Level = "beg" | "med" | "adv" | "champ" | "hero";

export type WinMode = "rounds" | "first100" | "both";

export type Screen = "sw" | "si" | "ss" | "sg" | "swin" | "sresults";

/** 0 = not in game; 1 = find target; 2 = plan route; 3 = execute */
export type Phase = 0 | 1 | 2 | 3;

export type CardType = "lim" | "bon" | "twi";

export type Effect =
  | "dblPts"
  | "add10"
  | "add15"
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

export interface Door {
  key: DoorKey;
  /** symmetric dice range (blue/purple/yellow/red) */
  min?: number;
  max?: number;
  /** asymmetric ranges per die (hero / redlong) */
  ranges?: [number, number][];
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
}

export interface Player {
  name: string;
  color: string;
  tokens: number;
  hex: number;
  errors: number;
  errorLog: ErrorRecord[];
  solvedCount: number;
}

export interface SessionRecord {
  id: string;
  date: string;
  level: Level;
  settings?: Settings;
  coop: boolean;
  players: { name: string; tokens: number; errors: number; errorLog?: ErrorRecord[] }[];
  winnerName: string | null;
  sharedTokens?: number;
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
  | { eff: "add15"; total: number }
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
  | { kind: "arrival"; hex: number; turnPts: number; sym: string }
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

  /** win screen data */
  winnerIdx: number | null;
  coopWin: boolean;

  /** set when the game should begin a fresh turn (engine asks the host to pick a card) */
  awaitNewTurn: boolean;
}
