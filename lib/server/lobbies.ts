/**
 * Where a group game actually lives between requests.
 *
 * Netlify hands us a small shared store. It matters that this is shared storage
 * and not memory: each request may be answered by a different machine, so
 * anything kept "in memory" would vanish between one player's tap and the next.
 */
import { getStore } from "@netlify/blobs";
import type { GameState, Level, Settings } from "@/lib/engine/types";
import {
  LOBBY_TTL_MS,
  MAX_PLAYERS,
  OFFLINE_AFTER_MS,
  type LobbyPhase,
  type LobbyView,
  type MemberView,
} from "@/lib/online/protocol";

/** One player, as the server knows them — including the private key we never
 *  show to anybody else in the room. */
export interface Member {
  id: string;
  name: string;
  seat: number;
  isHost: boolean;
  lastSeen: number;
}

export interface LobbyRecord {
  code: string;
  createdAt: number;
  updatedAt: number;
  /** bumped on every change, so a browser can ask "anything new since 12?" */
  seq: number;
  phase: LobbyPhase;
  level: Level;
  settings: Settings;
  locale: "en" | "he";
  members: Member[];
  state: GameState | null;
  turnEndsAt: number | null;
  endedReason: "host" | "finished" | null;
}

const STORE = "dog-game-lobbies";

function store() {
  return getStore({ name: STORE, consistency: "strong" });
}

export interface Loaded {
  record: LobbyRecord;
  etag?: string;
}

export async function loadLobby(code: string): Promise<Loaded | null> {
  const res = await store().getWithMetadata(code, { type: "json" });
  if (!res) return null;
  const record = res.data as LobbyRecord;
  // A lobby nobody has touched for hours is treated as gone, whether or not the
  // cleanup ever got round to it.
  if (Date.now() - record.updatedAt > LOBBY_TTL_MS) {
    await store().delete(code).catch(() => {});
    return null;
  }
  return { record, etag: res.etag };
}

/**
 * Save, but only if nobody else changed the lobby while we were thinking.
 *
 * This is the guard against two children tapping in the same instant: the second
 * write is refused rather than quietly erasing the first, and the caller retries
 * against the newer situation.
 */
export async function saveLobby(record: LobbyRecord, etag?: string): Promise<boolean> {
  record.updatedAt = Date.now();
  record.seq += 1;
  // With an etag we can insist nothing changed underneath us. Without one — some
  // environments don't hand one back — we still have to save, or the lobby would
  // be frozen forever. The sequence number then carries the safety instead.
  const res = etag
    ? await store().setJSON(record.code, record, { onlyIfMatch: etag })
    : await store().setJSON(record.code, record);
  return res.modified;
}

export async function createLobby(record: LobbyRecord): Promise<boolean> {
  const res = await store().setJSON(record.code, record, { onlyIfNew: true });
  return res.modified;
}

export async function deleteLobby(code: string): Promise<void> {
  await store().delete(code).catch(() => {});
}

/**
 * Read, change, save — retrying if somebody got there first.
 *
 * `change` may be called more than once, so it must not have side effects of its
 * own beyond editing the record it is handed.
 */
export async function updateLobby(
  code: string,
  change: (record: LobbyRecord) => boolean | void,
  attempts = 4
): Promise<{ ok: true; record: LobbyRecord } | { ok: false; reason: "notFound" | "busy" | "rejected" }> {
  for (let i = 0; i < attempts; i++) {
    const loaded = await loadLobby(code);
    if (!loaded) return { ok: false, reason: "notFound" };
    const accepted = change(loaded.record);
    if (accepted === false) return { ok: false, reason: "rejected" };
    if (await saveLobby(loaded.record, loaded.etag)) {
      return { ok: true, record: loaded.record };
    }
  }
  return { ok: false, reason: "busy" };
}

export function findMember(record: LobbyRecord, playerId: string): Member | undefined {
  return record.members.find((m) => m.id === playerId);
}

export function nameTaken(record: LobbyRecord, name: string): boolean {
  const wanted = name.trim().toLowerCase();
  return record.members.some((m) => m.name.trim().toLowerCase() === wanted);
}

export function freeSeat(record: LobbyRecord): number | null {
  for (let seat = 0; seat < MAX_PLAYERS; seat++) {
    if (!record.members.some((m) => m.seat === seat)) return seat;
  }
  return null;
}

/** What every player is allowed to see: the shared game, and who else is here —
 *  never anybody's private key. */
export function toView(record: LobbyRecord): LobbyView {
  const now = Date.now();
  const members: MemberView[] = record.members
    .slice()
    .sort((a, b) => a.seat - b.seat)
    .map((m) => ({
      seat: m.seat,
      name: m.name,
      isHost: m.isHost,
      connected: now - m.lastSeen < OFFLINE_AFTER_MS,
    }));
  return {
    code: record.code,
    seq: record.seq,
    phase: record.phase,
    level: record.level,
    settings: record.settings,
    members,
    state: record.state,
    turnEndsAt: record.turnEndsAt,
    endedReason: record.endedReason,
  };
}
