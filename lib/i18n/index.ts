import type { DoorKey, EffResult, Level, Locale, PresetId, WinMode } from "../engine/types";
import { en } from "./en";
import { he } from "./he";

export interface InstPage {
  i: string;
  t: string;
  /** rich HTML body */
  x: string;
}

/**
 * Which layout the player is actually looking at. The guides describe where
 * things are on screen, and the two layouts put them in different places — a
 * side column on a computer, an edge tab and a drawer on a phone — so every
 * page that says "over here" is written twice, once per device.
 */
export type Device = "desktop" | "mobile";

/** Which area of the live game a tour step spotlights. */
export type TourTarget = "board" | "panel" | "sidebar" | "helper" | "routedetail" | "doors" | "header" | "center";

/** Imported so every reason a lobby can turn you away has real words in both
 *  languages — a child who mistypes a code should be told that, not "error". */
import type { LobbyErrorCode } from "@/lib/online/protocol";

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
  /** if set, this step asks the player to really do the action (a hands-on taste) */
  interact?: "find" | "answer";
}

export interface LabelDesc {
  icon: string;
  name: string;
  desc: string;
  /** Optional short board-only label, used on the welcome screen level tiles. */
  board?: string;
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
  /** full guide; the pages that describe the screen are written per device */
  inst: (device: Device) => InstPage[];
  /** short, child-friendly guide; tailored to a level, or all levels when null */
  simpleGuide: (level: Level | null, device: Device) => InstPage[];
  fullGuideBtn: string;
  back: string;
  next: string;
  gotItDone: string;

  // Guided demo tour
  /** step-by-step popups shown over a live sample game, tailored per level */
  tour: (level: Level, device: Device) => TourStep[];
  demoGameBtn: string;
  demoPlayerName: string;
  demoHelperName: string;
  tourFinish: string;
  tourExit: string;
  /** shown when the player completes a hands-on tour step */
  tourSolved: string;
  /** prompt prefix shown above the live exercise in a hands-on tour step */
  tourYourTurn: string;

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
  optFocus: string;
  winCondition: string;
  winModes: Record<WinMode, LabelDesc>;
  startShort: string;

  // Game header / panel
  gameTitle: string;
  turn: (name: string) => string;
  roundLabel: (round: number, total: number) => string;
  instAria: string;
  musicOn: string;
  musicOff: string;
  musicVolume: string;
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
  /** the confirm-your-route window that pops to the front once the route reaches the target */
  routeReadyTitle: string;
  routeReadyLine: (pts: number, steps: number) => string;

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

  // Game squares (bank / step prize / door menu / mobile views)
  bankTitle: string;
  /** title of the "this step's prize" square while walking */
  stepPrizeTitle: string;
  /** title of the door-values menu shown when not walking */
  doorMenuTitle: string;
  /** "N pellets" — what a door is worth */
  pelletsUnit: (n: number) => string;
  /** shown in the bank before any pellets are collected */
  bankEmpty: string;
  /** tooltip on a bank chip: "blue door × 3" */
  bankChipTitle: (door: string, count: number) => string;
  /** mobile two-screen tab labels */
  tabPlay: string;
  tabBoard: string;
  /** slim banner shown on the mobile board screen, per phase */
  boardBannerFind: string;
  boardBannerRoute: (target: number) => string;
  boardBannerWalk: string;

  /** per-stage floating windows over the board */
  winFindTitle: string;
  winRouteTitle: string;
  winWalkTitle: string;
  /** walk-stage progress line */
  progStep: (step: number, total: number) => string;
  progEarned: (n: number) => string;
  progLeft: (steps: number, pellets: number) => string;
  progDogAt: (hex: number) => string;
  /** side-bar helper-friend feature */
  helperTitle: string;
  helperWaiting: string;
  /** shown to the active player after a friend answers correctly */
  helperSolvedNote: (name: string) => string;
  helperRevealBtn: string;
  helperAnswerReveal: (ans: number) => string;
  /** mobile bank drawer button */
  bankBtnLabel: string;
  /** short label for the mobile side-edge bank tab */
  bankTab: string;
  /** mobile board zoom controls */
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;

  // Help card
  helpCardBtn: string;

  // Spectator answering
  spectatorPrompt: string;
  spectatorAnswerFor: (name: string) => string;
  spectatorCorrect: (name: string) => string;
  spectatorWrong: string;
  /** playing together: the helper window that pops up for whoever is not playing */
  helperOnlineTitle: (name: string) => string;
  /** the quiet line shown while the player in turn is given a chance to answer alone */
  helperOnlineHold: (name: string) => string;
  helperOnlineSend: string;

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

  // Skill metrics (chronometric)
  statTitle: string;
  statAccuracy: (correct: number, total: number) => string;
  statSpeed: (sec: string) => string;
  statNoData: string;

  // Quick start
  quickStartBtn: string;
  quickStartTitle: string;
  quickStartSteps: [string, string, string];
  quickStartGo: string;

  // Quick launch (preset screen)
  quickLaunchBtn: string;
  qlTitle: string;
  qlSub: string;
  qlLevelLabel: string;
  qlPlayersLabel: string;
  qlReviewNote: string;
  qlAdvanced: string;
  qlPickSetup: string;
  qlLearnLabel: string;
  qlTourHint: string;
  qlStart: (presetName: string) => string;
  presets: Record<PresetId, LabelDesc>;

  // Phase labels (for the action panel header)
  phaseLabels: [string, string, string];

  // Group game — the lobby, the waiting room, and playing together
  playTogether: string;
  lobbyTitle: string;
  lobbyIntro: string;
  lobbyCreateBtn: string;
  lobbyJoinBtn: string;
  lobbyBackBtn: string;
  lobbyYourNameLabel: string;
  lobbyCodeEnterLabel: string;
  lobbyJoinGoBtn: string;
  lobbyCreateGoBtn: string;
  lobbyWaitTitle: string;
  lobbyCodeLabel: string;
  lobbyCodeHint: string;
  lobbyPlayersHere: (here: number, max: number) => string;
  lobbyHostTag: string;
  lobbyYouTag: string;
  lobbyAwayTag: string;
  lobbyWaitingForPlayer: string;
  lobbyWaitingForHost: string;
  lobbyStartBtn: string;
  lobbyLeaveBtn: string;
  lobbyClosedTitle: string;
  lobbyClosedBody: string;
  lobbyErrors: Record<LobbyErrorCode, string>;
  onlineYourTurn: string;
  onlineWaitingFor: (name: string) => string;
  onlineEndForAll: string;
}

const DICTS: Record<Locale, Dict> = { en, he };

export function getDict(locale: Locale): Dict {
  return DICTS[locale];
}

/** Level / win-mode icons are language-agnostic but referenced for rendering. */
export const MEDALS = ["🥇", "🥈", "🥉", "4️⃣"];
