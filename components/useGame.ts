"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { boardMaxFor, DC, DOGS, PCOLORS } from "@/lib/engine/constants";
import { getDict } from "@/lib/i18n";
import {
  factKey,
  initState,
  makeChoices,
  parseFactors,
  pickReviewRoll,
  pickReviewTarget,
  pickSpecialId,
  pickTargetCard,
  reducer,
  rollDoor,
} from "@/lib/engine/gameReducer";
import { edgeColor, findPath } from "@/lib/engine/hexgrid";
import type { CardType, DoorKey, GameState, Level, Locale, Player, ReviewFact, SessionRecord, Settings, TrialRecord } from "@/lib/engine/types";

/** Which stage of a live sample turn a tour step demonstrates. */
export type DemoStage = "find" | "route" | "walk";

function usesMC(state: GameState): boolean {
  return state.settings.mc && (state.level === "beg" || state.level === "med");
}

/** Where finished games are stored on this device, for the research export. */
export const SESSIONS_KEY = "kaskash_sessions";
const LS_KEY = SESSIONS_KEY;
const LS_REVIEW = "kaskash_review";

export function useGame(locale: Locale) {
  const [state, dispatch] = useReducer(reducer, locale, initState);

  // Always-fresh snapshot for RNG/timer dispatchers (synced after commit).
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ── Review mode: each player's remembered missed facts, kept across games ──
  // Keyed by player name and persisted to localStorage, so a child's hard facts
  // carry over from one session to the next. Only read/written when the active
  // game has review mode on (the quick-launch presets) — the standard game never
  // touches it, so its behaviour is unchanged.
  const reviewRef = useRef<Map<string, ReviewFact[]>>(new Map());
  const loadReview = useCallback(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_REVIEW) || "{}") as Record<string, ReviewFact[]>;
      reviewRef.current = new Map(Object.entries(raw));
    } catch {
      reviewRef.current = new Map();
    }
  }, []);
  const saveReview = useCallback(() => {
    try {
      localStorage.setItem(LS_REVIEW, JSON.stringify(Object.fromEntries(reviewRef.current)));
    } catch {}
  }, []);
  /** Record a missed multiplication fact for a player (review mode). */
  const noteWrongFact = useCallback((name: string, expr: string, ans: number) => {
    const pair = parseFactors(expr);
    if (!pair) return; // only drill clean "a × b" facts (skip prime additions, etc.)
    const key = factKey(pair[0], pair[1]);
    const list = reviewRef.current.get(name) ?? [];
    const found = list.find((f) => f.key === key);
    if (found) {
      found.weight = Math.min(found.weight + 1, 5);
      found.expr = expr;
      found.ans = ans;
    } else {
      list.push({ key, expr, ans, weight: 2 });
    }
    reviewRef.current.set(name, list);
    saveReview();
  }, [saveReview]);
  /** A correct answer relaxes (and eventually retires) a remembered fact. */
  const noteRightFact = useCallback((name: string, expr: string) => {
    const pair = parseFactors(expr);
    if (!pair) return;
    const key = factKey(pair[0], pair[1]);
    const list = reviewRef.current.get(name);
    if (!list) return;
    const found = list.find((f) => f.key === key);
    if (!found) return;
    found.weight -= 1;
    if (found.weight <= 0) {
      reviewRef.current.set(name, list.filter((f) => f.key !== key));
    }
    saveReview();
  }, [saveReview]);

  // ── Chronometric logging (lives here, in the host, so the reducer stays pure) ──
  const trialLogRef = useRef<TrialRecord[]>([]);
  const itemRef = useRef<
    | null
    | {
        t0: number;
        lastAt: number;
        phase: "find" | "walk" | "factor";
        qType: string;
        expr: string;
        answer: number;
        attempt: number;
        hintUsed: boolean;
        revealed: boolean;
      }
  >(null);
  const gameStartRef = useRef<string>("");

  /** Mark the moment a question becomes readable (starts the response-time clock). */
  const presentItem = useCallback(
    (phase: "find" | "walk" | "factor", qType: string, expr: string, answer: number) => {
      const now = performance.now();
      itemRef.current = { t0: now, lastAt: now, phase, qType, expr, answer, attempt: 1, hintUsed: false, revealed: false };
    },
    []
  );

  /** Record one answer attempt with its response time. Skipped during the guided tour. */
  const recordTrial = useCallback(
    (response: number, correct: boolean, mode: "mc" | "typed" | "hex") => {
      const it = itemRef.current;
      const s = stateRef.current;
      if (!it || s.tourActive) return;
      const now = performance.now();
      const rt = it.attempt === 1 ? now - it.t0 : now - it.lastAt;
      trialLogRef.current.push({
        ts: new Date().toISOString(),
        player: s.players[s.cur]?.name ?? "",
        level: s.level,
        phase: it.phase,
        qType: it.qType,
        expr: it.expr,
        answer: it.answer,
        response,
        correct,
        attempt: it.attempt,
        rtMs: Math.round(rt),
        mode,
        hintUsed: it.hintUsed,
        revealed: it.revealed,
        timerOn: s.settings.timer,
        timeLeftMs: Math.max(0, s.timerSecs * 1000),
      });
      // Review mode: remember misses and relax on correct (find/walk facts only).
      if (s.settings.review) {
        const name = s.players[s.cur]?.name ?? "";
        if (name && (it.phase === "find" || it.phase === "walk")) {
          if (correct) noteRightFact(name, it.expr);
          else noteWrongFact(name, it.expr, it.answer);
        }
      }
      if (correct) itemRef.current = null;
      else {
        it.attempt += 1;
        it.lastAt = now;
      }
    },
    [noteRightFact, noteWrongFact]
  );

  const noteHint = useCallback(() => {
    if (itemRef.current) itemRef.current.hintUsed = true;
  }, []);

  // Auto-save session to localStorage when game ends.
  const savedThisGame = useRef(false);
  useEffect(() => {
    if (state.screen === "swin" && !savedThisGame.current) {
      savedThisGame.current = true;
      const s = stateRef.current;
      const session: SessionRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        level: s.level,
        settings: s.settings,
        coop: s.settings.coop,
        players: s.players.map((p) => ({
          name: p.name,
          tokens: p.tokens,
          errors: p.errors,
          // Free practice keeps no score, so the exercise count is the only
          // record of what the session actually contained.
          solvedCount: p.solvedCount,
          errorLog: p.errorLog,
        })),
        winnerName: s.coopWin ? null : s.winnerIdx !== null ? s.players[s.winnerIdx].name : null,
        sharedTokens: s.settings.coop ? s.sharedTokens : undefined,
        startedAt: gameStartRef.current || undefined,
        endedAt: new Date().toISOString(),
        trials: trialLogRef.current.slice(),
      };
      try {
        const existing: SessionRecord[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
        localStorage.setItem(LS_KEY, JSON.stringify([session, ...existing].slice(0, 100)));
      } catch {}
    } else if (state.screen !== "swin") {
      savedThisGame.current = false;
    }
  }, [state.screen]);

  const startP1 = useCallback(() => {
    const s = stateRef.current;
    // During the guided demo, prefer a composite target so the factoring step works.
    let picked = pickTargetCard(s.level, s.usedCards, Math.random, s.tourActive);
    // Review mode: about half the time, re-test a fact this player missed before.
    if (s.settings.review && !s.tourActive) {
      const facts = reviewRef.current.get(s.players[s.cur]?.name ?? "") ?? [];
      if (facts.length && Math.random() < 0.5) {
        const rev = pickReviewTarget(s.level, facts, s.usedCards, Math.random);
        if (rev) picked = rev;
      }
    }
    const { card, resetUsed } = picked;
    presentItem("find", "target", card.ex, card.ans);
    dispatch({ type: "START_P1", card, resetUsed });
  }, [presentItem]);

  // Begin a fresh turn whenever the engine requests one.
  useEffect(() => {
    if (state.awaitNewTurn) startP1();
  }, [state.awaitNewTurn, startP1]);

  // Turn timer. Frozen (shown but not counting down) while the guided demo runs.
  useEffect(() => {
    if (!state.timerRunning || state.tourActive) return;
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, [state.timerRunning, state.tourActive]);

  const showScreen = useCallback((screen: GameState["screen"]) => {
    dispatch({ type: "SHOW_SCREEN", screen });
  }, []);

  const goInst = useCallback(() => dispatch({ type: "GO_INST" }), []);
  const goSimpleGuide = useCallback(
    (level: Level | null) => dispatch({ type: "GO_SIMPLE_GUIDE", level }),
    []
  );
  const closeInst = useCallback(() => dispatch({ type: "CLOSE_INST" }), []);
  const instSet = useCallback((idx: number) => dispatch({ type: "INST_SET", idx }), []);
  const goSetup = useCallback(() => dispatch({ type: "GO_SETUP" }), []);
  const goSetupLevel = useCallback(
    (level: Level) => dispatch({ type: "GO_SETUP_LEVEL", level }),
    []
  );
  const goQuick = useCallback(() => dispatch({ type: "GO_QUICK" }), []);

  const startGame = useCallback(
    (players: Player[], level: Level, settings: Settings) => {
      trialLogRef.current = [];
      itemRef.current = null;
      gameStartRef.current = new Date().toISOString();
      // Pull in each player's remembered mistakes so review mode can re-serve them.
      loadReview();
      dispatch({ type: "START_GAME", players, level, settings });
    },
    [loadReview]
  );

  // Guided demo: spin up a gentle single-player sample game, then open the tour overlay.
  const startDemo = useCallback(
    (level: Level) => {
      // Remember where we came from so the tour returns there when it ends.
      const origin = stateRef.current.screen;
      const dict = getDict(locale);
      // Two players so the "help on another's turn" feature is actually visible.
      const mk = (name: string, color: string): Player => ({
        name,
        color,
        tokens: 0,
        hex: 1,
        errors: 0,
        errorLog: [],
        solvedCount: 0,
        foods: {},
      });
      const players: Player[] = [
        mk(dict.demoPlayerName, PCOLORS[0]),
        mk(dict.demoHelperName, PCOLORS[1]),
      ];
      const settings: Settings = {
        timer: false,
        mc: level === "beg" || level === "med",
        rob: false,
        winMode: "rounds",
        coop: false,
        freePlay: false,
        focus: false,
        review: false,
      };
      dispatch({ type: "START_GAME", players, level, settings });
      dispatch({ type: "TOUR_START", origin });
    },
    [locale]
  );
  const tourSet = useCallback((step: number) => dispatch({ type: "TOUR_SET", step }), []);
  const tourEnd = useCallback(() => dispatch({ type: "TOUR_END" }), []);
  /**
   * The tour's last button says "let's play" — so it starts a real game at the
   * same level, rather than dropping the player back on the settings form they
   * had already filled in before the tour.
   */
  const tourPlay = useCallback(() => {
    const s = stateRef.current;
    const dict = getDict(locale);
    dispatch({ type: "TOUR_END" });
    dispatch({
      type: "START_GAME",
      players: [
        {
          name: dict.defaultPlayerName(DOGS[0], 1),
          color: PCOLORS[0],
          tokens: 0,
          hex: 1,
          errors: 0,
          errorLog: [],
          solvedCount: 0,
          foods: {},
        },
      ],
      level: s.level,
      settings: {
        timer: false,
        mc: s.level === "beg" || s.level === "med",
        rob: false,
        winMode: "rounds",
        coop: false,
        freePlay: false,
        focus: false,
        review: false,
      },
    });
  }, [locale]);
  const setTourInteract = useCallback(
    (mode: "find" | "answer" | null) => dispatch({ type: "SET_TOUR_INTERACT", mode }),
    []
  );

  // Move the live sample game into the phase a tour step is explaining, so the
  // real board, route, panel, and clock reflect that stage as you read about it.
  const demoStage = useCallback((stage: DemoStage) => {
    const s = stateRef.current;
    const startHex = s.players[0]?.hex ?? 1;

    // Stage 1 — finding the target: clean phase-1 board with the target card.
    if (stage === "find" || !s.card) {
      dispatch({
        type: "DEMO_STAGE",
        phase: 1, targetHex: null, path: [], pathDoors: [],
        pendingRoll: null, choices: null, timerOn: false,
      });
      return;
    }

    // Build a real sample route from the dog to the target answer.
    const target = s.card.ans;
    const path = findPath(s.level, startHex, target);
    const pathDoors: DoorKey[] = path.map((h, i) =>
      edgeColor(s.edgeColors, s.level, i === 0 ? startHex : path[i - 1], h)
    );

    // Stage 2 — planning the route: phase 2 with the route drawn and confirmable.
    if (stage === "route" || path.length === 0) {
      dispatch({
        type: "DEMO_STAGE",
        phase: 2, targetHex: target, path, pathDoors,
        pendingRoll: null, choices: null, timerOn: false,
      });
      return;
    }

    // Stage 3 — setting off: phase 3 with a rolled question, answer UI, and clock.
    const door = DC[pathDoors[0]];
    const roll = rollDoor(door, {
      turnUsedExprs: [], lastTurnExprs: [], lastExpr: "",
      turnHasOne: false, turnHasTen: false,
    });
    const usesMc = s.settings.mc && (s.level === "beg" || s.level === "med");
    dispatch({
      type: "DEMO_STAGE",
      phase: 3, targetHex: target, path, pathDoors,
      pendingRoll: { rolls: roll.rolls, color: pathDoors[0], pts: door.pts, expr: roll.expr, correct: roll.correct },
      choices: usesMc ? makeChoices(roll.correct, door) : null,
      timerOn: true,
    });
  }, []);

  const hexClick = useCallback((n: number) => {
    const s = stateRef.current;
    // Log target-finding clicks (phase 1) and board-answer clicks (phase 3).
    if (s.phase === 1 && s.card) {
      recordTrial(n, n === s.card.ans, "hex");
    } else if (s.phase === 3 && s.boardAns && s.pendingRoll) {
      recordTrial(n, n === s.pendingRoll.correct, "hex");
    }
    dispatch({ type: "HEX_CLICK", n });
    if (s.phase === 1) {
      if (s.card && n !== s.card.ans) {
        setTimeout(() => dispatch({ type: "CLEAR_WRONG_HEX" }), 1800);
      }
    } else if (s.phase === 2) {
      // Flash non-adjacent (illegal) hex clicks briefly.
      setTimeout(() => dispatch({ type: "CLEAR_WRONG_HEX" }), 500);
    } else if (s.phase === 3 && s.boardAns && s.pendingRoll) {
      if (n === s.pendingRoll.correct) {
        // During the guided tour the tour drives the flow — don't auto-advance.
        if (!s.tourActive) setTimeout(() => dispatch({ type: "COMMIT_STEP" }), 420);
      } else {
        setTimeout(() => dispatch({ type: "CLEAR_WRONG_HEX" }), 520);
      }
    }
  }, [recordTrial]);

  const startP2 = useCallback(() => dispatch({ type: "START_P2" }), []);
  const clearPath = useCallback(() => dispatch({ type: "CLEAR_PATH" }), []);
  const confirmPath = useCallback(() => dispatch({ type: "CONFIRM_PATH" }), []);
  const revealTarget = useCallback(() => {
    if (itemRef.current) itemRef.current.revealed = true;
    dispatch({ type: "REVEAL_TARGET" });
  }, []);

  const rollDice = useCallback((step: number) => {
    const s = stateRef.current;
    const door = DC[s.pathDoors[step]];
    const guards = {
      turnUsedExprs: s.turnUsedExprs,
      lastTurnExprs: s.lastTurnExprs,
      lastExpr: s.lastExpr,
      turnHasOne: s.turnHasOne,
      turnHasTen: s.turnHasTen,
    };
    let roll = rollDoor(door, guards);
    // Review mode: about half the time, re-serve a missed fact that fits this door.
    if (s.settings.review && !s.tourActive) {
      const facts = reviewRef.current.get(s.players[s.cur]?.name ?? "") ?? [];
      if (facts.length && Math.random() < 0.5) {
        const rev = pickReviewRoll(door, facts, guards);
        if (rev) roll = rev;
      }
    }
    const choices = usesMC(s) ? makeChoices(roll.correct, door) : null;
    presentItem("walk", s.pathDoors[step], roll.expr, roll.correct);
    dispatch({ type: "ROLL_DICE", step, roll, choices });
    setTimeout(() => dispatch({ type: "STOP_SPIN" }), 380);
  }, [presentItem]);

  const mcAnswer = useCallback((chosen: number) => {
    const s = stateRef.current;
    const correct = s.pendingRoll?.correct;
    recordTrial(chosen, chosen === correct, "mc");
    dispatch({ type: "MC_ANSWER", chosen });
    if (chosen === correct) {
      if (!s.tourActive) setTimeout(() => dispatch({ type: "COMMIT_STEP" }), 420);
    } else {
      setTimeout(() => dispatch({ type: "CLEAR_ANSWER_FLASH" }), 420);
    }
  }, [recordTrial]);

  const inputAnswer = useCallback((value: number) => {
    const s = stateRef.current;
    const correct = s.pendingRoll?.correct;
    recordTrial(value, value === correct, "typed");
    dispatch({ type: "INPUT_ANSWER", value });
    if (value === correct) {
      if (!s.tourActive) setTimeout(() => dispatch({ type: "COMMIT_STEP" }), 420);
    } else {
      setTimeout(() => dispatch({ type: "CLEAR_ANSWER_FLASH" }), 520);
    }
  }, [recordTrial]);

  const openForfeit = useCallback(() => {
    if (itemRef.current) itemRef.current.revealed = true;
    dispatch({ type: "OPEN_FORFEIT" });
  }, []);
  const forfeitCollect = useCallback(() => dispatch({ type: "FORFEIT_COLLECT" }), []);

  const drawCard = useCallback((cardType: CardType) => {
    const s = stateRef.current;
    const cardId = pickSpecialId(cardType, s.level);
    const randData = {
      hex: Math.floor(Math.random() * boardMaxFor(s.level)) + 1,
      bool: Math.random() > 0.5,
      targetIdx: Math.floor(Math.random() * 4),
    };
    dispatch({ type: "OPEN_DRAW", cardType, cardId, randData });
  }, []);

  const collectNext = useCallback(() => dispatch({ type: "COLLECT_NEXT" }), []);
  const collectThenExtra = useCallback(() => dispatch({ type: "COLLECT_THEN_EXTRA" }), []);
  const openRob = useCallback(() => dispatch({ type: "OPEN_ROB" }), []);
  const doRob = useCallback((index: number) => dispatch({ type: "DO_ROB", index }), []);
  const closeModal = useCallback(() => dispatch({ type: "CLOSE_MODAL" }), []);
  const openConfirmEnd = useCallback(
    () => dispatch({ type: "OPEN_MODAL", modal: { kind: "confirmEnd" } }),
    []
  );
  const openSettingsHelp = useCallback(
    () => dispatch({ type: "OPEN_MODAL", modal: { kind: "settingsHelp" } }),
    []
  );
  const openVideo = useCallback(
    (videoKey: string) => dispatch({ type: "OPEN_MODAL", modal: { kind: "video", videoKey } }),
    []
  );

  const awardSpectatorBonus = useCallback((playerIdx: number) => {
    dispatch({ type: "SPECTATOR_BONUS", playerIdx });
  }, []);

  const openPrimeHex = useCallback((hex: number) => {
    dispatch({ type: "OPEN_PRIME_HEX", hex });
  }, []);

  const factorSolved = useCallback(() => dispatch({ type: "FACTOR_SOLVED" }), []);
  const factorSkip = useCallback(() => dispatch({ type: "FACTOR_SKIP" }), []);

  const goResults = useCallback(() => dispatch({ type: "SHOW_SCREEN", screen: "sresults" }), []);
  const endGame = useCallback(() => dispatch({ type: "END_GAME" }), []);

  return {
    state,
    trials: trialLogRef.current,
    actions: {
      noteHint,
      showScreen,
      goInst,
      goSimpleGuide,
      closeInst,
      instSet,
      goSetup,
      goSetupLevel,
      goQuick,
      startGame,
      startDemo,
      tourSet,
      tourEnd,
      tourPlay,
      setTourInteract,
      demoStage,
      startP1,
      hexClick,
      startP2,
      clearPath,
      confirmPath,
      revealTarget,
      rollDice,
      mcAnswer,
      inputAnswer,
      openForfeit,
      forfeitCollect,
      drawCard,
      collectNext,
      collectThenExtra,
      openRob,
      doRob,
      closeModal,
      openConfirmEnd,
      openSettingsHelp,
      openVideo,
      goResults,
      endGame,
      awardSpectatorBonus,
      openPrimeHex,
      factorSolved,
      factorSkip,
    },
  };
}

export type GameActions = ReturnType<typeof useGame>["actions"];
