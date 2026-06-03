import type { DoorKey, EffResult, Level, Locale, WinMode } from "../engine/types";
import { en } from "./en";
import { he } from "./he";

export interface InstPage {
  i: string;
  t: string;
  /** rich HTML body */
  x: string;
}

export interface LabelDesc {
  icon: string;
  name: string;
  desc: string;
}

export interface CardCopy {
  t: string;
  /** rich HTML */
  tx: string;
}

export interface Dict {
  dir: "ltr" | "rtl";

  // Welcome
  logoAlt: string;
  title: string;
  welcomeSub: string;
  welcomeSub2a: string;
  welcomeSub2b: string;
  startGame: string;
  howToPlay: string;
  tutorialVideos: string;

  // Instructions
  inst: InstPage[];
  back: string;
  next: string;
  gotItDone: string;

  // Setup
  setupTitle: string;
  howManyPlayers: string;
  playerNamesLabel: string;
  playerPlaceholder: (dog: string, i: number) => string;
  difficulty: string;
  levels: Record<Level, LabelDesc>;
  watch: string;
  options: string;
  whatsThis: string;
  optTimer: string;
  optMc: string;
  optRob: string;
  optCoop: string;
  winCondition: string;
  winModes: Record<WinMode, LabelDesc>;
  startShort: string;

  // Game header / panel
  gameTitle: string;
  turn: (name: string) => string;
  defaultPlayerName: (dog: string, i: number) => string;

  // Phase 1
  p1Hint: string;
  targetCardLabel: (id: number, prime: boolean) => string;
  targetExpr: (ex: string) => string;
  targetInstruction: (prime: boolean) => string;
  showAnswer: string;
  wrongHexInline: (n: number) => string;
  hintBtn: string;
  hintResult: (expr: string) => string;

  // Phase 2
  p2Hint: (target: number) => string;
  p2Empty: string;
  stepHexLabel: (h: number) => string;
  doorLabel: (key: DoorKey) => string;
  pathDoorLabel: (key: DoorKey, pts: number) => string;
  possiblePellets: (pts: number, steps: number) => string;
  routeNotReach: (target: number) => string;
  confirmRoute: string;
  clearRoute: string;
  newTarget: string;

  // Phase 3
  p3Hint: (step: number, total: number, doorLabel: string, pts: number, turnPts: number) => string;
  rollFor: (doorLabel: string) => string;
  orClickHex: string;
  answerPlaceholder: string;
  confirmAnswer: string;
  wrongTryAgain: string;
  revealEndsTurn: string;

  // Modals
  revealTitle: (ans: number) => string;
  revealBody: (ans: number) => string;
  gotItThumbs: string;
  foundTitle: (n: number) => string;
  foundBody: (sym: string) => string;
  planRoute: string;
  arrivalTitle: (hex: number) => string;
  pelletsThisTurn: (pts: number) => string;
  drawBonus: string;
  drawLimit: string;
  drawTwist: string;
  steal: string;
  coopNoRob: string;
  collectPellets: string;
  cards: Record<string, CardCopy>;
  formatEff: (r: EffResult) => string;
  extraTurnBtn: string;
  robTitle: string;
  robTarget: (name: string, tokens: number) => string;
  skip: string;
  robResultTitle: string;
  robResultBody: (stolen: number, name: string) => string;
  forfeitTitle: (correct: number) => string;
  forfeitBody: (hex: number, turnPts: number) => string;
  saveNext: string;
  timeoutTitle: string;
  timeoutBody: (hex: number) => string;
  confirmEndTitle: string;
  confirmEndBody: string;
  cancel: string;
  endGame: string;
  close: string;

  // Settings help (rich HTML)
  settingsHelpTitle: string;
  settingsHelpBody: string;

  // Videos
  videoLabels: Record<string, string>;
  videoComingSoon: string;
  videoComingSoonHint: string;
  videoMenuTitle: string;
  videoMenuTutorial: string;
  videoMenuGameplay: string;
  videoMenuNote: string;

  // Win
  winnerTitle: string;
  winnerSuffix: string;
  newGameBtn: string;
  coopWinTitle: string;
  coopWinName: string;
  coopTeamwork: string;
  coopTogether: (shared: number) => string;
  resultsSaved: string;
  viewResultsBtn: string;

  // Results screen
  viewResults: string;
  resultsTitle: string;
  noResults: string;
  clearResults: string;
  downloadResults: string;

  // Sidebar
  sharedBank: string;
  sharedProgress: (shared: number) => string;
  hexLabel: (h: number) => string;

  // Door legend
  doorLegendTitle: string;
  doorLegendPts: (pts: number) => string;

  // Help card
  helpCardBtn: string;

  // Spectator answering
  spectatorPrompt: string;
  spectatorAnswerFor: (name: string) => string;
  spectatorCorrect: (name: string) => string;
  spectatorWrong: string;

  // Prime hex explanation modal
  primeHexTitle: (n: number) => string;
  primeHexMsg: (n: number) => string;
  drawTwistAfterPrime: string;

  // Free play mode
  optFreePlay: string;
  freeSolvedCount: (n: number) => string;

  // Phase 2 coop hint
  p2CoopHint: string;

  // Quick start
  quickStartBtn: string;
  quickStartTitle: string;
  quickStartSteps: [string, string, string];
  quickStartGo: string;

  // Phase labels (for the action panel header)
  phaseLabels: [string, string, string];
}

const DICTS: Record<Locale, Dict> = { en, he };

export function getDict(locale: Locale): Dict {
  return DICTS[locale];
}

/** Level / win-mode icons are language-agnostic but referenced for rendering. */
export const MEDALS = ["🥇", "🥈", "🥉", "4️⃣"];
