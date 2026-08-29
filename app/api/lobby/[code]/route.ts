/**
 * One lobby: hearing what's new, and asking to do something.
 *
 * GET is the poll every player makes while they wait. It is deliberately
 * read-only in the normal case — the turn clock is a shared deadline that each
 * device counts down to on its own, so watching the clock costs nothing. The
 * server only writes when that deadline actually passes and the turn has to time
 * out for real.
 */
import { NextResponse } from "next/server";
import { PCOLORS } from "@/lib/engine/constants";
import { initState, reducer } from "@/lib/engine/gameReducer";
import type { Player } from "@/lib/engine/types";
import { normaliseCode } from "@/lib/online/codes";
import {
  OFFLINE_AFTER_MS,
  SPECTATOR_INTENTS,
  type ActReply,
  type ErrorReply,
  type Intent,
  type LobbyErrorCode,
  type PollReply,
  type RoomBody,
} from "@/lib/online/protocol";
import { applyIntent, catchUpClock, settle, unstick } from "@/lib/server/lobbyEngine";
import { findMember, loadLobby, toView, updateLobby, type LobbyRecord } from "@/lib/server/lobbies";

export const dynamic = "force-dynamic";

/** Presence is written at most this often per player, so the constant polling of
 *  four devices doesn't turn into a constant stream of writes. */
const HEARTBEAT_MS = 6000;

function fail(error: LobbyErrorCode, status = 400) {
  return NextResponse.json<ErrorReply>({ ok: false, error }, { status });
}

/**
 * Keep the shared clock honest.
 *
 * The turn's deadline is wall-clock, so every device shows the same countdown.
 * It is set once, when the clock starts running, and then left alone: recomputing
 * it from the seconds left on every write would push it forward with each tap,
 * and the clock would never actually count down. Instead the seconds stored in
 * the game state are caught up to the deadline that already exists — which is
 * also how a turn that ran out while nobody was looking gets settled.
 */
function syncClock(record: LobbyRecord): void {
  const s = record.state;
  if (!s || !s.timerRunning) {
    record.turnEndsAt = null;
    return;
  }
  if (record.turnEndsAt === null) {
    record.turnEndsAt = Date.now() + s.timerSecs * 1000;
    return;
  }
  const elapsedMs = s.timerSecs * 1000 - (record.turnEndsAt - Date.now());
  if (elapsedMs >= 1000) {
    const caught = catchUpClock(s, elapsedMs);
    record.state = caught;
    if (!caught.timerRunning) record.turnEndsAt = null;
  }
}

/** Has this lobby's turn clock actually run out? */
function expired(record: LobbyRecord): boolean {
  return (
    record.phase === "playing" && record.turnEndsAt !== null && Date.now() >= record.turnEndsAt
  );
}

/** Bring the shared game up to the present: run out the clock if it ran out,
 *  clear any animation the acting player abandoned, deal a turn if one is due. */
function advance(record: LobbyRecord): void {
  if (!record.state) return;
  const idle = Date.now() - record.updatedAt;
  syncClock(record);
  let s = record.state;
  s = unstick(s, idle);
  s = settle(s);
  record.state = s;
  syncClock(record);
  s = record.state;
  if (s.screen === "swin") {
    record.phase = "ended";
    record.endedReason = "finished";
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await ctx.params;
  const code = normaliseCode(rawCode);
  if (!code) return fail("badCode", 404);

  const url = new URL(req.url);
  const since = Number(url.searchParams.get("since") ?? "0");
  const playerId = url.searchParams.get("playerId") ?? "";

  const loaded = await loadLobby(code);
  if (!loaded) return fail("notFound", 404);

  const me = findMember(loaded.record, playerId);
  const quiet = me ? Date.now() - me.lastSeen > HEARTBEAT_MS : false;
  const wasOffline = me ? Date.now() - me.lastSeen > OFFLINE_AFTER_MS : false;
  const ranOut = expired(loaded.record);

  // Only touch the store when there is a real reason to: the turn ran out, or
  // this player's presence has gone quiet long enough to be worth recording.
  if (ranOut || quiet) {
    const result = await updateLobby(code, (record) => {
      const m = findMember(record, playerId);
      if (m) m.lastSeen = Date.now();
      advance(record);
    });
    if (result.ok) {
      const view = toView(result.record);
      // A silent heartbeat shouldn't wake every other device; the clock running
      // out, or somebody reappearing after dropping off, should.
      if (!ranOut && !wasOffline && since && view.seq - 1 <= since) {
        return NextResponse.json<PollReply>({ ok: true, changed: false, seq: view.seq });
      }
      return NextResponse.json<PollReply>({ ok: true, changed: true, view });
    }
  }

  const view = toView(loaded.record);
  if (since && view.seq === since) {
    return NextResponse.json<PollReply>({ ok: true, changed: false, seq: view.seq });
  }
  return NextResponse.json<PollReply>({ ok: true, changed: true, view });
}

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await ctx.params;
  const code = normaliseCode(rawCode);
  if (!code) return fail("badCode", 404);

  let body: RoomBody;
  try {
    body = (await req.json()) as RoomBody;
  } catch {
    return fail("server");
  }
  const playerId = String(body.playerId ?? "");
  if (!playerId) return fail("server");

  const err: { code: LobbyErrorCode } = { code: "server" };

  const result = await updateLobby(code, (record) => {
    const me = findMember(record, playerId);
    if (!me) {
      err.code = "notFound";
      return false;
    }
    me.lastSeen = Date.now();

    if (body.op === "start") {
      if (!me.isHost) {
        err.code = "notHost";
        return false;
      }
      if (record.phase !== "waiting") {
        err.code = record.phase === "ended" ? "gameEnded" : "alreadyStarted";
        return false;
      }
      if (!record.members.length) {
        err.code = "needPlayers";
        return false;
      }
      // Seats become board players, in seat order, so the dog and colour a child
      // sees in the waiting room is the one they get on the board.
      const players: Player[] = record.members
        .slice()
        .sort((a, b) => a.seat - b.seat)
        .map((m, i) => ({
          name: m.name,
          color: PCOLORS[i],
          tokens: 0,
          hex: 1,
          errors: 0,
          errorLog: [],
          solvedCount: 0,
          foods: {},
        }));
      let s = initState(record.locale);
      s = reducer(s, {
        type: "START_GAME",
        players,
        level: record.level,
        settings: record.settings,
      });
      record.state = settle(s);
      record.phase = "playing";
      record.turnEndsAt = null;
      syncClock(record);
      return;
    }

    if (body.op === "end") {
      if (!me.isHost) {
        err.code = "notHost";
        return false;
      }
      record.phase = "ended";
      record.endedReason = "host";
      return;
    }

    if (body.op === "leave") {
      if (record.phase === "waiting") {
        record.members = record.members.filter((m) => m.id !== playerId);
        // Somebody has to be able to press start; hand it to whoever is left.
        if (me.isHost && record.members.length) {
          record.members.slice().sort((a, b) => a.seat - b.seat)[0].isHost = true;
        }
      } else {
        // Mid-game their dog stays on the board — the rules have no way to drop a
        // player without renumbering everyone. Showing them as gone is honest,
        // and the turn clock carries play past them.
        me.lastSeen = 0;
      }
      return;
    }

    if (body.op === "act") {
      if (record.phase !== "playing" || !record.state) {
        err.code = record.phase === "ended" ? "gameEnded" : "notPlaying";
        return false;
      }
      const intent = body.intent as Intent;
      if (!intent || typeof intent.t !== "string") {
        err.code = "server";
        return false;
      }
      advance(record);
      if (!record.state) {
        err.code = "server";
        return false;
      }
      // Whose turn it is is decided here, not by the browser that asked.
      if (!SPECTATOR_INTENTS.has(intent.t) && record.state.cur !== me.seat) {
        err.code = "notYourTurn";
        return false;
      }
      let s = applyIntent(record.state, intent);
      s = settle(s);
      record.state = s;
      // Note: this only starts a clock that just began running, or clears one
      // that stopped — a turn already being timed keeps the deadline it has, so
      // playing does not push the countdown forward.
      syncClock(record);
      s = record.state;
      if (s.screen === "swin") {
        record.phase = "ended";
        record.endedReason = "finished";
      }
      return;
    }

    err.code = "server";
    return false;
  });

  if (!result.ok) {
    if (result.reason === "notFound") return fail("notFound", 404);
    if (result.reason === "busy") return fail("busy", 503);
    return fail(err.code, err.code === "notYourTurn" ? 409 : 400);
  }

  return NextResponse.json<ActReply>({ ok: true, view: toView(result.record) });
}
