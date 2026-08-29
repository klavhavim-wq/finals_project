/**
 * The shared vocabulary between a player's browser and the server that runs the
 * group game. Both sides import this file, so neither can drift from the other.
 *
 * Nothing here touches React, the DOM, or Netlify — it is plain data.
 */
import type { CardType, GameState, Level, Settings } from "@/lib/engine/types";

/** The board has four dogs and four colours, so a lobby holds four players. */
export const MAX_PLAYERS = 4;

/** How often a browser asks the server for news. The game is turn-based, so a
 *  couple of seconds is invisible in play and keeps the running cost sane. */
export const POLL_MS = 2000;

/** A player who hasn't been heard from for this long is shown as disconnected. */
export const OFFLINE_AFTER_MS = 12_000;

/** Lobbies are forgotten after this long, whether or not anyone said goodbye. */
export const LOBBY_TTL_MS = 6 * 60 * 60 * 1000;

/** If the acting player vanishes mid-flourish, the server finishes the pending
 *  animation step itself rather than leaving everyone staring at a frozen board. */
export const SETTLE_STUCK_MS = 5000;

export type LobbyPhase = "waiting" | "playing" | "ended";

/** What one player looks like to everybody else. Never carries a player's
 *  private key — that stays between them and the server. */
export interface MemberView {
  seat: number;
  name: string;
  isHost: boolean;
  connected: boolean;
}

/** The whole shared situation, as sent to every player on every poll. */
export interface LobbyView {
  code: string;
  seq: number;
  phase: LobbyPhase;
  level: Level;
  settings: Settings;
  members: MemberView[];
  /** null until the host starts the game */
  state: GameState | null;
  /** wall-clock moment the current turn runs out, so every device counts down
   *  to the same instant instead of each running its own stopwatch */
  turnEndsAt: number | null;
  /** set when the host ends the game for everyone */
  endedReason: "host" | "finished" | null;
}

/** Everything a player can ask the server to do to the shared game.
 *
 *  These are requests, not commands: the server re-checks whose turn it is and
 *  runs the real rulebook itself, so a doctored message can't move another
 *  player's dog or award anybody points.
 */
export type Intent =
  | { t: "hexClick"; n: number }
  | { t: "clearWrongHex" }
  | { t: "commitStep" }
  | { t: "startP2" }
  | { t: "clearPath" }
  | { t: "confirmPath" }
  | { t: "revealTarget" }
  | { t: "rollDice"; step: number }
  | { t: "stopSpin" }
  | { t: "mcAnswer"; chosen: number }
  | { t: "inputAnswer"; value: number }
  | { t: "clearAnswerFlash" }
  | { t: "openForfeit" }
  | { t: "forfeitCollect" }
  | { t: "drawCard"; cardType: CardType }
  | { t: "collectNext" }
  | { t: "collectThenExtra" }
  | { t: "openRob" }
  | { t: "doRob"; index: number }
  | { t: "closeModal" }
  | { t: "spectatorBonus"; playerIdx: number }
  | { t: "openPrimeHex"; hex: number }
  | { t: "factorSolved" }
  | { t: "factorSkip" };

/** Intents any player may send, even when it isn't their turn — a watching
 *  friend solving the open question earns a bonus, and that is the point. */
export const SPECTATOR_INTENTS: ReadonlySet<Intent["t"]> = new Set(["spectatorBonus"]);

export type LobbyErrorCode =
  | "badCode"
  | "notFound"
  | "full"
  | "alreadyStarted"
  | "nameTaken"
  | "notYourTurn"
  | "notHost"
  | "notPlaying"
  | "needPlayers"
  | "gameEnded"
  | "busy"
  | "server";

export interface ErrorReply {
  ok: false;
  error: LobbyErrorCode;
}

/** Handed back once when a player creates or joins. The `playerId` is that
 *  player's private key for the rest of the game — it never goes to anyone else. */
export interface SeatReply {
  ok: true;
  code: string;
  playerId: string;
  seat: number;
  view: LobbyView;
}

export type PollReply =
  | { ok: true; changed: false; seq: number }
  | { ok: true; changed: true; view: LobbyView }
  | ErrorReply;

export type ActReply = { ok: true; view: LobbyView } | ErrorReply;

/** POST bodies for the two endpoints. */
export type CreateBody = {
  op: "create";
  name: string;
  level: Level;
  settings: Settings;
  locale: "en" | "he";
};
export type JoinBody = { op: "join"; code: string; name: string };
export type EntryBody = CreateBody | JoinBody;

export type RoomBody =
  | { op: "start"; playerId: string }
  | { op: "act"; playerId: string; intent: Intent }
  | { op: "leave"; playerId: string }
  | { op: "end"; playerId: string };
