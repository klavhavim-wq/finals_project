import type { DoorKey, EffResult, Level, Locale, WinMode } from "../engine/types";
import { en } from "./en";
import { he } from "./he";

export interface InstPage {
  i: string;
  t: string;
  /** rich HTML body */
  x: string;
}

/** Which area of the live game a tour step spotlights. */
export type TourTarget = "board" | "panel" | "sidebar" | "doors" | "header" | "center";

/** Which live phase of the sample game a tour step drives the board into. */
export type TourStage = "find" | "route" | "walk";

export interface TourStep {
  /** big icon */
  i: string;
  t: string;
  /** rich HTML body */
  x: string;
  target: TourTarget;
  /** live phase to show while this step is on screen (default "find") */
  stage?: TourStage;
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
  chooseLevel: string;
  demoVideo: string;
  howToPlay: string;
  tutorialVideos: string;

  // Instructions
  inst: InstPage[];
  /** short, child-friendly guide; tailored to a level, or all levels when null */
  simpleGuide: (level: Level | null) => InstPage[];
  fullGuideBtn: string;
  back: string;
  next: string;
  gotItDone: string;

  // Guided demo tour
  /** step-by-step popups shown over a live sample game, tailored per level */
  tour: (level: Level) => TourStep[];
  demoGameBtn: string;
  demoPlayerName: string;
  demoHelperName: string;
  tourFinish: string;
  tourExit: string;

  // Setup
  setupTitle: string;
  howManyPlayers: string;
  playerNamesLabel: string;
  playerPlaceholder: (dog: string, i: number) => string;
  difficulty: string;
  levels: Record<Level, LabelDesc>;
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

  // Factoring add-on (Advanced level and up)
  factorTitle: (n: number) => string;
  factorPrompt: (n: number) => string;
  factorCheck: string;
  factorSkipBtn: string;
  factorCorrect: (a: number, b: number, n: number, bonus: number) => string;
  factorWrong: (n: number) => string;
  factorTilesBonus: (count: number, pts: number) => string;
  factorHuntHint: (target: number) => string;

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
