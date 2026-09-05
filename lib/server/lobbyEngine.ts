/**
 * Runs the real game rules on the server.
 *
 * In the single-player game these decisions happen on the player's own device.
 * That cannot work for a group: four devices each rolling their own dice would
 * see four different games. So every roll, card draw and question pick happens
 * here, once, and the result is handed to everybody.
 *
 * The rulebook itself is untouched — it already accepted randomness as an input
 * rather than reaching for it, so it runs here exactly as it does in a browser.
 */
import { boardMaxFor, DC } from "@/lib/engine/constants";
import {
  makeChoices,
  pickSpecialId,
  pickTargetCard,
  reducer,
  rollDoor,
} from "@/lib/engine/gameReducer";
import type { GameState } from "@/lib/engine/types";
import { SETTLE_STUCK_MS, type Intent } from "@/lib/online/protocol";

function usesMC(s: GameState): boolean {
  return s.settings.mc && (s.level === "beg" || s.level === "med");
}

/**
 * The rulebook can ask for a fresh turn to be dealt. On a device that request is
 * answered by an effect; here we answer it immediately, so the state we save is
 * never mid-thought. The guard is a safety rail against a rule change that could
 * one day ask for turns forever.
 */
export function settle(state: GameState): GameState {
  let s = state;
  for (let i = 0; i < 8 && s.awaitNewTurn; i++) {
    // Same guard as the single-device game: a target on the dog's own hex cannot
    // be routed to, and the confirm button would stay dead with no explanation.
    const { card, resetUsed } = pickTargetCard(
      s.level, s.usedCards, Math.random, false, s.players[s.cur]?.hex
    );
    s = reducer(s, { type: "START_P1", card, resetUsed });
  }
  return s;
}

/** Apply one player request to the shared game. */
export function applyIntent(state: GameState, intent: Intent): GameState {
  switch (intent.t) {
    case "hexClick":
      return reducer(state, { type: "HEX_CLICK", n: intent.n });
    case "clearWrongHex":
      return reducer(state, { type: "CLEAR_WRONG_HEX" });
    case "commitStep":
      return reducer(state, { type: "COMMIT_STEP" });
    case "startP2":
      return reducer(state, { type: "START_P2" });
    case "clearPath":
      return reducer(state, { type: "CLEAR_PATH" });
    case "confirmPath":
      return reducer(state, { type: "CONFIRM_PATH" });
    case "revealTarget":
      return reducer(state, { type: "REVEAL_TARGET" });

    case "rollDice": {
      // The dice, rolled once for the whole room.
      const key = state.pathDoors[intent.step];
      const door = key ? DC[key] : undefined;
      if (!door) return state;
      const roll = rollDoor(door, {
        turnUsedExprs: state.turnUsedExprs,
        lastTurnExprs: state.lastTurnExprs,
        lastExpr: state.lastExpr,
        turnHasOne: state.turnHasOne,
        turnHasTen: state.turnHasTen,
      });
      const choices = usesMC(state) ? makeChoices(roll.correct, door) : null;
      return reducer(state, { type: "ROLL_DICE", step: intent.step, roll, choices });
    }
    case "stopSpin":
      return reducer(state, { type: "STOP_SPIN" });

    case "mcAnswer":
      return reducer(state, { type: "MC_ANSWER", chosen: intent.chosen });
    case "inputAnswer":
      return reducer(state, { type: "INPUT_ANSWER", value: intent.value });
    case "clearAnswerFlash":
      return reducer(state, { type: "CLEAR_ANSWER_FLASH" });

    case "openForfeit":
      return reducer(state, { type: "OPEN_FORFEIT" });
    case "forfeitCollect":
      return reducer(state, { type: "FORFEIT_COLLECT" });

    case "drawCard": {
      // The special card, drawn once for the whole room.
      const cardId = pickSpecialId(intent.cardType, state.level);
      const randData = {
        hex: Math.floor(Math.random() * boardMaxFor(state.level)) + 1,
        bool: Math.random() > 0.5,
        targetIdx: Math.floor(Math.random() * 4),
      };
      return reducer(state, {
        type: "OPEN_DRAW",
        cardType: intent.cardType,
        cardId,
        randData,
      });
    }

    case "collectNext":
      return reducer(state, { type: "COLLECT_NEXT" });
    case "collectThenExtra":
      return reducer(state, { type: "COLLECT_THEN_EXTRA" });
    case "openRob":
      return reducer(state, { type: "OPEN_ROB" });
    case "doRob":
      return reducer(state, { type: "DO_ROB", index: intent.index });
    case "closeModal":
      return reducer(state, { type: "CLOSE_MODAL" });
    case "spectatorBonus":
      return reducer(state, { type: "SPECTATOR_BONUS", playerIdx: intent.playerIdx });
    case "openPrimeHex":
      return reducer(state, { type: "OPEN_PRIME_HEX", hex: intent.hex });
    case "factorSolved":
      return reducer(state, { type: "FACTOR_SOLVED" });
    case "factorSkip":
      return reducer(state, { type: "FACTOR_SKIP" });
  }
}

/**
 * Advance the shared turn clock to now.
 *
 * Each device used to count down on its own, and two devices never quite agree.
 * Instead the server owns the clock: whenever anybody talks to it, it works out
 * how many seconds really passed and lets the rulebook handle each of them, so
 * a turn times out at the same moment for everyone.
 */
export function catchUpClock(state: GameState, elapsedMs: number): GameState {
  if (!state.timerRunning || state.settings.freePlay) return state;
  const seconds = Math.floor(elapsedMs / 1000);
  if (seconds <= 0) return state;
  let s = state;
  // Cap the catch-up so a lobby left open overnight doesn't burn a long loop.
  const steps = Math.min(seconds, state.timerSecs + 1, 600);
  for (let i = 0; i < steps && s.timerRunning; i++) {
    s = reducer(s, { type: "TICK" });
  }
  return s;
}

/**
 * Finish an animation the acting player never finished.
 *
 * A red flash and a dice spin are cleared a fraction of a second later by the
 * device that caused them. If that device closes its lid mid-flourish, nobody
 * else can clear it, and the board would sit there wrong-looking forever. So if
 * one of those has been hanging around far longer than any animation, the server
 * tidies it up itself.
 */
export function unstick(state: GameState, idleMs: number): GameState {
  if (idleMs < SETTLE_STUCK_MS) return state;
  let s = state;
  if (s.diceSpin) s = reducer(s, { type: "STOP_SPIN" });
  if (s.wrongHex !== null) s = reducer(s, { type: "CLEAR_WRONG_HEX" });
  if (s.mcWrong !== null || s.inputWrong) s = reducer(s, { type: "CLEAR_ANSWER_FLASH" });
  return s;
}
