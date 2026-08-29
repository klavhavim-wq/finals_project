/**
 * Making a lobby, and getting into one.
 *
 * Everything a browser sends is treated as a suggestion. The level, the settings
 * and the names are all re-checked here, because the only thing standing between
 * a curious child with the developer tools open and a broken game is this file.
 */
import { NextResponse } from "next/server";
import type { Level, Settings } from "@/lib/engine/types";
import { makeCode, normaliseCode } from "@/lib/online/codes";
import {
  type EntryBody,
  type ErrorReply,
  type LobbyErrorCode,
  type SeatReply,
} from "@/lib/online/protocol";
import {
  createLobby,
  freeSeat,
  loadLobby,
  nameTaken,
  toView,
  updateLobby,
  type LobbyRecord,
  type Member,
} from "@/lib/server/lobbies";

export const dynamic = "force-dynamic";

const LEVELS: Level[] = ["beg", "med", "adv", "champ", "hero"];
const NAME_MAX = 18;

function fail(error: LobbyErrorCode, status = 400) {
  return NextResponse.json<ErrorReply>({ ok: false, error }, { status });
}

function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim().replace(/\s+/g, " ").slice(0, NAME_MAX);
  return name.length ? name : null;
}

/** Only the settings the game actually has, and only in the shapes it expects. */
function cleanSettings(raw: unknown): Settings {
  const s = (raw ?? {}) as Partial<Settings>;
  const winMode = s.winMode === "first100" || s.winMode === "both" ? s.winMode : "rounds";
  return {
    timer: s.timer !== false,
    mc: !!s.mc,
    rob: !!s.rob,
    winMode,
    coop: !!s.coop,
    freePlay: !!s.freePlay,
    focus: !!s.focus,
    // Review mode re-serves facts a child got wrong before, and those live on
    // that child's own device. There is nothing sensible to re-serve from here,
    // so group games always run without it.
    review: false,
  };
}

export async function POST(req: Request) {
  let body: EntryBody;
  try {
    body = (await req.json()) as EntryBody;
  } catch {
    return fail("server");
  }

  const name = cleanName((body as { name?: unknown }).name);
  if (!name) return fail("server");

  if (body.op === "create") {
    const level = LEVELS.includes(body.level) ? body.level : "med";
    const settings = cleanSettings(body.settings);
    const locale = body.locale === "he" ? "he" : "en";
    const now = Date.now();

    const host: Member = {
      id: crypto.randomUUID(),
      name,
      seat: 0,
      isHost: true,
      lastSeen: now,
    };

    // Codes are short enough that two lobbies could ask for the same one. The
    // store refuses to overwrite an existing code, so we simply try again.
    for (let attempt = 0; attempt < 6; attempt++) {
      const record: LobbyRecord = {
        code: makeCode(),
        createdAt: now,
        updatedAt: now,
        seq: 1,
        phase: "waiting",
        level,
        settings,
        locale,
        members: [host],
        state: null,
        turnEndsAt: null,
        endedReason: null,
      };
      if (await createLobby(record)) {
        return NextResponse.json<SeatReply>({
          ok: true,
          code: record.code,
          playerId: host.id,
          seat: 0,
          view: toView(record),
        });
      }
    }
    return fail("busy", 503);
  }

  if (body.op === "join") {
    const code = normaliseCode(String(body.code ?? ""));
    if (!code) return fail("badCode", 404);
    if (!(await loadLobby(code))) return fail("notFound", 404);

    let joined: Member | null = null;
    const err: { code: LobbyErrorCode } = { code: "server" };

    const result = await updateLobby(code, (record) => {
      joined = null;
      if (record.phase !== "waiting") {
        err.code = record.phase === "ended" ? "gameEnded" : "alreadyStarted";
        return false;
      }
      if (nameTaken(record, name)) {
        err.code = "nameTaken";
        return false;
      }
      const seat = freeSeat(record);
      if (seat === null) {
        err.code = "full";
        return false;
      }
      joined = {
        id: crypto.randomUUID(),
        name,
        seat,
        isHost: false,
        lastSeen: Date.now(),
      };
      record.members.push(joined);
    });

    if (!result.ok) {
      if (result.reason === "notFound") return fail("notFound", 404);
      if (result.reason === "busy") return fail("busy", 503);
      return fail(err.code, err.code === "full" || err.code === "nameTaken" ? 409 : 400);
    }

    const member = joined as Member | null;
    if (!member) return fail("server", 500);
    return NextResponse.json<SeatReply>({
      ok: true,
      code,
      playerId: member.id,
      seat: member.seat,
      view: toView(result.record),
    });
  }

  return fail("server");
}

