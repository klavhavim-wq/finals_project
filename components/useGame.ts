"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { boardMaxFor, DC, PCOLORS } from "@/lib/engine/constants";
import { getDict } from "@/lib/i18n";
import {
  initState,
  makeChoices,
  pickSpecialId,
  pickTargetCard,
  reducer,
  rollDoor,
} from "@/lib/engine/gameReducer";
import type { CardType, GameState, Level, Locale, Player, SessionRecord, Settings } from "@/lib/engine/types";

function usesMC(state: GameState): boolean {
  return state.settings.mc && (state.level === "beg" || state.level === "med");
}

const LS_KEY = "kaskash_sessions";

export function useGame(locale: Locale) {
  const [state, dispatch] = useReducer(reducer, locale, initState);

  // Always-fresh snapshot for RNG/timer dispatchers (synced after commit).
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
        players: s.players.map((p) => ({ name: p.name, tokens: p.tokens, errors: p.errors, errorLog: p.errorLog })),
        winnerName: s.coopWin ? null : s.winnerIdx !== null ? s.players[s.winnerIdx].name : null,
        sharedTokens: s.settings.coop ? s.sharedTokens : undefined,
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
    const { card, resetUsed } = pickTargetCard(s.level, s.usedCards);
    dispatch({ type: "START_P1", card, resetUsed });
  }, []);

  // Begin a fresh turn whenever the engine requests one.
  useEffect(() => {
    if (state.awaitNewTurn) startP1();
  }, [state.awaitNewTurn, startP1]);

  // Turn timer.
  useEffect(() => {
    if (!state.timerRunning) return;
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, [state.timerRunning]);

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

  const startGame = useCallback(
    (players: Player[], level: Level, settings: Settings) => {
      dispatch({ type: "START_GAME", players, level, settings });
    },
    []
  );

  // Guided demo: spin up a gentle single-player sample game, then open the tour overlay.
  const startDemo = useCallback(
    (level: Level) => {
      const players: Player[] = [
        {
          name: getDict(locale).demoPlayerName,
          color: PCOLORS[0],
          tokens: 0,
          hex: 1,
          errors: 0,
          errorLog: [],
          solvedCount: 0,
        },
      ];
      const settings: Settings = {
        timer: false,
        mc: level === "beg" || level === "med",
        rob: false,
        winMode: "rounds",
        coop: false,
        freePlay: false,
      };
      dispatch({ type: "START_GAME", players, level, settings });
      dispatch({ type: "TOUR_START" });
    },
    [locale]
  );
  const tourSet = useCallback((step: number) => dispatch({ type: "TOUR_SET", step }), []);
  const tourEnd = useCallback(() => dispatch({ type: "TOUR_END" }), []);

  const hexClick = useCallback((n: number) => {
    const s = stateRef.current;
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
        setTimeout(() => dispatch({ type: "COMMIT_STEP" }), 420);
      } else {
        setTimeout(() => dispatch({ type: "CLEAR_WRONG_HEX" }), 520);
      }
    }
  }, []);

  const startP2 = useCallback(() => dispatch({ type: "START_P2" }), []);
  const clearPath = useCallback(() => dispatch({ type: "CLEAR_PATH" }), []);
  const confirmPath = useCallback(() => dispatch({ type: "CONFIRM_PATH" }), []);
  const revealTarget = useCallback(() => dispatch({ type: "REVEAL_TARGET" }), []);

  const rollDice = useCallback((step: number) => {
    const s = stateRef.current;
    const door = DC[s.pathDoors[step]];
    const roll = rollDoor(door, {
      turnUsedExprs: s.turnUsedExprs,
      lastTurnExprs: s.lastTurnExprs,
      lastExpr: s.lastExpr,
      turnHasOne: s.turnHasOne,
      turnHasTen: s.turnHasTen,
    });
    const choices = usesMC(s) ? makeChoices(roll.correct, door) : null;
    dispatch({ type: "ROLL_DICE", step, roll, choices });
    setTimeout(() => dispatch({ type: "STOP_SPIN" }), 380);
  }, []);

  const mcAnswer = useCallback((chosen: number) => {
    const s = stateRef.current;
    const correct = s.pendingRoll?.correct;
    dispatch({ type: "MC_ANSWER", chosen });
    if (chosen === correct) {
      setTimeout(() => dispatch({ type: "COMMIT_STEP" }), 420);
    } else {
      setTimeout(() => dispatch({ type: "CLEAR_ANSWER_FLASH" }), 420);
    }
  }, []);

  const inputAnswer = useCallback((value: number) => {
    const s = stateRef.current;
    const correct = s.pendingRoll?.correct;
    dispatch({ type: "INPUT_ANSWER", value });
    if (value === correct) {
      setTimeout(() => dispatch({ type: "COMMIT_STEP" }), 420);
    } else {
      setTimeout(() => dispatch({ type: "CLEAR_ANSWER_FLASH" }), 520);
    }
  }, []);

  const openForfeit = useCallback(() => dispatch({ type: "OPEN_FORFEIT" }), []);
  const forfeitCollect = useCallback(() => dispatch({ type: "FORFEIT_COLLECT" }), []);

  const drawCard = useCallback((cardType: CardType) => {
    const s = stateRef.current;
    const cardId = pickSpecialId(cardType);
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

  return {
    state,
    actions: {
      showScreen,
      goInst,
      goSimpleGuide,
      closeInst,
      instSet,
      goSetup,
      goSetupLevel,
      startGame,
      startDemo,
      tourSet,
      tourEnd,
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
      awardSpectatorBonus,
      openPrimeHex,
      factorSolved,
      factorSkip,
    },
  };
}

export type GameActions = ReturnType<typeof useGame>["actions"];
