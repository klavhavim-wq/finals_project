"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { initState } from "@/lib/engine/gameReducer";
import type {
  CardType,
  GameState,
  Level,
  Locale,
  ModalState,
  Screen,
  SessionRecord,
  Settings,
  TrialRecord,
} from "@/lib/engine/types";
import {
  POLL_MS,
  type ActReply,
  type Intent,
  type LobbyErrorCode,
  type LobbyView,
  type MemberView,
  type PollReply,
  type SeatReply,
} from "@/lib/online/protocol";
import { SESSIONS_KEY, type GameActions } from "./useGame";

/** Where this player's seat is remembered, so a tablet that goes to sleep or a
 *  tab that reloads walks straight back into the same game. */
const SEAT_KEY = "dogylishios:online-seat";

/** Modals that belong to one person's screen rather than to the shared game.
 *  Opening the help must not open it on everybody else's tablet. */
const PRIVATE_MODALS: ReadonlySet<ModalState["kind"]> = new Set([
  "settingsHelp",
  "video",
  "confirmEnd",
]);

export interface Seat {
  code: string;
  playerId: string;
  seat: number;
}

/** The bits of the screen that belong to this device alone. Everything else
 *  comes from the server, so all four screens agree. */
interface PrivateUi {
  instOpen: boolean;
  instIdx: number;
  instMode: "simple" | "full";
  instLevel: Level | null;
  modal: ModalState | null;
  screen: Screen | null;
  /** this device left the shared game rather than playing it out */
  endedEarly: boolean;
}

const FRESH_UI: PrivateUi = {
  instOpen: false,
  instIdx: 0,
  instMode: "simple",
  instLevel: null,
  modal: null,
  screen: null,
  endedEarly: false,
};

function readSeat(): Seat | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SEAT_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Seat;
    return s && s.code && s.playerId ? s : null;
  } catch {
    return null;
  }
}

function writeSeat(seat: Seat | null) {
  try {
    if (seat) localStorage.setItem(SEAT_KEY, JSON.stringify(seat));
    else localStorage.removeItem(SEAT_KEY);
  } catch {
    /* storage blocked — the game still works, it just won't survive a reload */
  }
}

/**
 * A game played together, over the network.
 *
 * It hands back the same set of actions as the single-player game, so the board,
 * the panels and the modals render from it unchanged. The difference is what the
 * actions do: instead of deciding anything, they ask the server, and the server's
 * answer becomes what everyone sees.
 */
export function useOnlineGame(locale: Locale, onExit?: () => void) {
  // Held in a ref so a caller passing a fresh arrow function every render
  // doesn't rebuild everything that depends on it.
  const exitRef = useRef(onExit);
  useEffect(() => {
    exitRef.current = onExit;
  }, [onExit]);

  const [seat, setSeat] = useState<Seat | null>(null);
  const [view, setView] = useState<LobbyView | null>(null);
  const [error, setError] = useState<LobbyErrorCode | null>(null);
  const [busy, setBusy] = useState(false);
  const [ui, setUi] = useState<PrivateUi>(FRESH_UI);
  const [now, setNow] = useState(() => Date.now());

  // Kept alongside the state so the network callbacks — which run long after the
  // render that created them — always act on the current seat.
  const seatRef = useRef<Seat | null>(null);
  const seqRef = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    seatRef.current = seat;
  }, [seat]);

  // Walk back into a game this device was already in.
  //
  // This has to happen after the first paint rather than as an initial value:
  // the page is prerendered on the server, where there is no saved seat, so
  // starting out already in a lobby would make the first render disagree with
  // the delivered HTML.
  useEffect(() => {
    const saved = readSeat();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setSeat(saved);
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    []
  );

  const applyView = useCallback((next: LobbyView) => {
    seqRef.current = next.seq;
    setView(next);
  }, []);

  const takeSeat = useCallback((next: Seat | null) => {
    seatRef.current = next;
    writeSeat(next);
    setSeat(next);
  }, []);

  // ── Polling ───────────────────────────────────────────────────────────────
  // The one place news arrives from. It asks "anything newer than what I have?"
  // so an idle lobby costs almost nothing to sit in.
  useEffect(() => {
    if (!seat) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const url = `/api/lobby/${seat.code}?since=${seqRef.current}&playerId=${encodeURIComponent(seat.playerId)}`;
        const res = await fetch(url, { cache: "no-store" });
        const data = (await res.json()) as PollReply;
        if (!alive) return;
        if (data.ok) {
          if (data.changed) applyView(data.view);
        } else if (data.error === "notFound") {
          // The lobby is gone — stop pretending we're still in it.
          takeSeat(null);
          setView(null);
          setError("notFound");
          return;
        }
      } catch {
        /* a dropped connection is normal on school wifi — try again shortly */
      }
      if (alive) timer = setTimeout(poll, POLL_MS);
    };

    void poll();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [seat, applyView, takeSeat]);

  // ── The shared clock ──────────────────────────────────────────────────────
  // Every device counts down to the same moment rather than running its own
  // stopwatch, so nobody's turn ends early or late.
  useEffect(() => {
    if (!view?.turnEndsAt) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [view?.turnEndsAt]);

  const post = useCallback(async (body: unknown): Promise<ActReply | null> => {
    const s = seatRef.current;
    if (!s) return null;
    try {
      const res = await fetch(`/api/lobby/${s.code}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      return (await res.json()) as ActReply;
    } catch {
      return null;
    }
  }, []);

  /** Ask the server to do something to the shared game. Its reply is the new
   *  truth, which is why the acting player sees their own move immediately
   *  while everyone else picks it up on their next poll. */
  const send = useCallback(
    async (intent: Intent) => {
      const s = seatRef.current;
      if (!s) return;
      const reply = await post({ op: "act", playerId: s.playerId, intent });
      if (!reply) return;
      if (reply.ok) applyView(reply.view);
      // "Not your turn" is a race, not a fault — someone else's move landed
      // first. The next poll shows the real situation, so stay quiet about it.
      else if (reply.error !== "notYourTurn") setError(reply.error);
    },
    [post, applyView]
  );

  /** The little flourishes — a red flash, a spinning die — are cleared a moment
   *  later by the device that caused them, exactly as in the single-player game.
   *  If that device disappears first, the server tidies up instead. */
  const later = useCallback(
    (ms: number, intent: Intent) => {
      const id = setTimeout(() => void send(intent), ms);
      timers.current.push(id);
    },
    [send]
  );

  // ── The game as this device should draw it ────────────────────────────────
  const serverState = view?.state ?? null;

  const clockSecs = useMemo(() => {
    if (!view?.turnEndsAt) return null;
    return Math.max(0, Math.ceil((view.turnEndsAt - now) / 1000));
  }, [view?.turnEndsAt, now]);

  const state: GameState = useMemo(() => {
    const base = serverState ?? initState(locale);
    const shared = base.modal && !PRIVATE_MODALS.has(base.modal.kind) ? base.modal : null;
    return {
      ...base,
      locale,
      screen: ui.screen ?? base.screen,
      instOpen: ui.instOpen,
      instIdx: ui.instIdx,
      instMode: ui.instMode,
      instLevel: ui.instLevel,
      // A private modal always wins: it was opened on this screen only.
      modal: ui.modal ?? shared,
      timerSecs: clockSecs ?? base.timerSecs,
      endedEarly: ui.endedEarly || base.endedEarly,
      // The guided tour is a single-player teaching aid; it has no place in a
      // shared game where it would freeze the board for everyone else.
      tourActive: false,
      tourInteract: null,
    };
  }, [serverState, locale, ui, clockSecs]);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const me: MemberView | null = useMemo(() => {
    if (!view || !seat) return null;
    return view.members.find((m) => m.seat === seat.seat) ?? null;
  }, [view, seat]);

  const isMyTurn =
    view?.phase === "playing" && !!serverState && seat !== null && serverState.cur === seat.seat;

  // ── Research logging ──────────────────────────────────────────────────────
  // Response times must be measured on the device where the child actually
  // answered — routing them through the network would fold the connection's
  // delay into the measurement. So each device times and stores its own answers,
  // exactly as the single-player game does.
  const trialLog = useRef<TrialRecord[]>([]);
  const item = useRef<null | {
    t0: number;
    lastAt: number;
    phase: "find" | "walk" | "factor";
    qType: string;
    expr: string;
    answer: number;
    attempt: number;
    hintUsed: boolean;
    revealed: boolean;
  }>(null);
  const gameStart = useRef<string>("");

  const present = useCallback(
    (phase: "find" | "walk" | "factor", qType: string, expr: string, answer: number) => {
      const t = performance.now();
      item.current = {
        t0: t,
        lastAt: t,
        phase,
        qType,
        expr,
        answer,
        attempt: 1,
        hintUsed: false,
        revealed: false,
      };
    },
    []
  );

  // A question becomes readable when the server's version of the board says so.
  const shownCard = useRef<string>("");
  useEffect(() => {
    if (!serverState || !isMyTurn) return;
    if (serverState.phase === 1 && serverState.card) {
      const key = `find:${serverState.card.id}:${serverState.card.ex}`;
      if (shownCard.current !== key) {
        shownCard.current = key;
        present("find", "target", serverState.card.ex, serverState.card.ans);
      }
    } else if (serverState.phase === 3 && serverState.pendingRoll) {
      const r = serverState.pendingRoll;
      const key = `walk:${serverState.stepIdx}:${r.expr}`;
      if (shownCard.current !== key) {
        shownCard.current = key;
        present("walk", r.color, r.expr, r.correct);
      }
    }
  }, [serverState, isMyTurn, present]);

  const record = useCallback((response: number, correct: boolean, mode: "mc" | "typed" | "hex") => {
    const it = item.current;
    const s = stateRef.current;
    if (!it) return;
    const t = performance.now();
    const rt = it.attempt === 1 ? t - it.t0 : t - it.lastAt;
    trialLog.current.push({
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
    if (correct) item.current = null;
    else {
      it.attempt += 1;
      it.lastAt = t;
    }
  }, []);

  // Save this device's own record of the game when it finishes, the same way the
  // single-player game does, so a group game still feeds the research data.
  const saved = useRef(false);
  useEffect(() => {
    if (view?.phase !== "ended" || !serverState) {
      if (view?.phase === "playing") saved.current = false;
      return;
    }
    if (saved.current) return;
    saved.current = true;
    const s = serverState;
    const session: SessionRecord = {
      id: `${Date.now()}`,
      date: new Date().toISOString(),
      level: s.level,
      settings: s.settings,
      coop: s.settings.coop,
      players: s.players.map((p) => ({
        name: p.name,
        tokens: p.tokens,
        errors: p.errors,
        errorLog: p.errorLog,
      })),
      winnerName: s.coopWin ? null : s.winnerIdx !== null ? s.players[s.winnerIdx].name : null,
      sharedTokens: s.settings.coop ? s.sharedTokens : undefined,
      startedAt: gameStart.current || undefined,
      endedAt: new Date().toISOString(),
      trials: trialLog.current.slice(),
    };
    try {
      const existing: SessionRecord[] = JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]");
      localStorage.setItem(SESSIONS_KEY, JSON.stringify([session, ...existing].slice(0, 100)));
    } catch {
      /* nothing to save into — the game itself is unaffected */
    }
  }, [view?.phase, serverState]);

  useEffect(() => {
    if (view?.phase === "playing" && !gameStart.current) {
      gameStart.current = new Date().toISOString();
    }
  }, [view?.phase]);

  // ── Joining, starting, leaving ────────────────────────────────────────────
  const entry = useCallback(
    async (body: unknown): Promise<boolean> => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/lobby", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as SeatReply | { ok: false; error: LobbyErrorCode };
        if (!data.ok) {
          setError(data.error);
          return false;
        }
        setUi(FRESH_UI);
        trialLog.current = [];
        gameStart.current = "";
        saved.current = false;
        applyView(data.view);
        takeSeat({ code: data.code, playerId: data.playerId, seat: data.seat });
        return true;
      } catch {
        setError("server");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [applyView, takeSeat]
  );

  const createLobby = useCallback(
    (name: string, level: Level, settings: Settings) =>
      entry({ op: "create", name, level, settings, locale }),
    [entry, locale]
  );

  const joinLobby = useCallback(
    (code: string, name: string) => entry({ op: "join", code, name }),
    [entry]
  );

  const startGame = useCallback(async () => {
    const s = seatRef.current;
    if (!s) return;
    setBusy(true);
    const reply = await post({ op: "start", playerId: s.playerId });
    setBusy(false);
    if (!reply) return;
    if (reply.ok) applyView(reply.view);
    else setError(reply.error);
  }, [post, applyView]);

  const endGame = useCallback(async () => {
    const s = seatRef.current;
    if (!s) return;
    const reply = await post({ op: "end", playerId: s.playerId });
    if (reply?.ok) applyView(reply.view);
  }, [post, applyView]);

  const leave = useCallback(async () => {
    const s = seatRef.current;
    if (s) void post({ op: "leave", playerId: s.playerId });
    takeSeat(null);
    setView(null);
    setUi(FRESH_UI);
    seqRef.current = 0;
    exitRef.current?.();
  }, [post, takeSeat]);

  // ── The actions the board and panels call ─────────────────────────────────
  // Same shape as the single-player game, so every screen renders unchanged.
  const patchUi = useCallback((patch: Partial<PrivateUi>) => {
    setUi((u) => ({ ...u, ...patch }));
  }, []);

  const noop = useCallback(() => {}, []);

  // The handlers that consult the timing record or the latest board live out
  // here rather than inside the action list, so nothing reaches for a ref while
  // the screen is being drawn.
  const markHint = useCallback(() => {
    if (item.current) item.current.hintUsed = true;
  }, []);

  const markRevealed = useCallback(() => {
    if (item.current) item.current.revealed = true;
  }, []);

  const onHexClick = useCallback(
    (n: number) => {
      const s = stateRef.current;
      if (s.phase === 1 && s.card) record(n, n === s.card.ans, "hex");
      else if (s.phase === 3 && s.boardAns && s.pendingRoll) {
        record(n, n === s.pendingRoll.correct, "hex");
      }
      void send({ t: "hexClick", n });
      if (s.phase === 1) {
        if (s.card && n !== s.card.ans) later(1800, { t: "clearWrongHex" });
      } else if (s.phase === 2) {
        later(500, { t: "clearWrongHex" });
      } else if (s.phase === 3 && s.boardAns && s.pendingRoll) {
        if (n === s.pendingRoll.correct) later(420, { t: "commitStep" });
        else later(520, { t: "clearWrongHex" });
      }
    },
    [record, send, later]
  );

  const onAnswer = useCallback(
    (value: number, mode: "mc" | "typed") => {
      const s = stateRef.current;
      const correct = s.pendingRoll?.correct;
      record(value, value === correct, mode);
      void send(mode === "mc" ? { t: "mcAnswer", chosen: value } : { t: "inputAnswer", value });
      if (value === correct) later(420, { t: "commitStep" });
      else later(mode === "mc" ? 420 : 520, { t: "clearAnswerFlash" });
    },
    [record, send, later]
  );

  /** Closes a modal this player opened for themselves. Returns true if it did,
   *  so the caller knows not to bother the rest of the room about it. */
  const closePrivateModal = useCallback(() => {
    const m = stateRef.current.modal;
    if (m && PRIVATE_MODALS.has(m.kind)) {
      patchUi({ modal: null });
      return true;
    }
    return false;
  }, [patchUi]);

  const actions: GameActions = useMemo(() => {
    return {
      noteHint: markHint,
      noteReveal: markRevealed,

      // Leaving the board means leaving the room; everything else is just this
      // screen changing what it shows.
      showScreen: (screen: Screen) => {
        if (screen === "sw") void leave();
        else patchUi({ screen });
      },

      goInst: () => patchUi({ instOpen: true, instMode: "full", instIdx: 0 }),
      goSimpleGuide: (level: Level | null) =>
        patchUi({ instOpen: true, instMode: "simple", instLevel: level, instIdx: 0 }),
      closeInst: () => patchUi({ instOpen: false }),
      instSet: (idx: number) => patchUi({ instIdx: idx }),

      // Reached only from screens a group game never shows.
      goSetup: noop,
      goSetupLevel: noop,
      goQuick: noop,
      startGame: noop,
      startDemo: noop,
      tourSet: noop,
      tourEnd: noop,
      tourPlay: noop,
      setTourInteract: noop,
      demoStage: noop,
      // The server deals each new turn as soon as one is due.
      startP1: noop,

      hexClick: (n: number) => {
        if (!isMyTurn) return;
        onHexClick(n);
      },

      startP2: () => { if (isMyTurn) void send({ t: "startP2" }); },
      clearPath: () => { if (isMyTurn) void send({ t: "clearPath" }); },
      confirmPath: () => { if (isMyTurn) void send({ t: "confirmPath" }); },

      revealTarget: () => {
        if (!isMyTurn) return;
        markRevealed();
        void send({ t: "revealTarget" });
      },

      rollDice: (step: number) => {
        if (!isMyTurn) return;
        void send({ t: "rollDice", step });
        later(380, { t: "stopSpin" });
      },

      mcAnswer: (chosen: number) => {
        if (!isMyTurn) return;
        onAnswer(chosen, "mc");
      },

      inputAnswer: (value: number) => {
        if (!isMyTurn) return;
        onAnswer(value, "typed");
      },

      openForfeit: () => {
        if (!isMyTurn) return;
        markRevealed();
        void send({ t: "openForfeit" });
      },
      forfeitCollect: () => { if (isMyTurn) void send({ t: "forfeitCollect" }); },
      drawCard: (cardType: CardType) => {
        if (!isMyTurn) return;
        void send({ t: "drawCard", cardType });
      },
      collectNext: () => { if (isMyTurn) void send({ t: "collectNext" }); },
      collectThenExtra: () => { if (isMyTurn) void send({ t: "collectThenExtra" }); },
      openRob: () => { if (isMyTurn) void send({ t: "openRob" }); },
      doRob: (index: number) => {
        if (!isMyTurn) return;
        void send({ t: "doRob", index });
      },

      closeModal: () => {
        // A modal this player opened for themselves closes for themselves.
        if (closePrivateModal()) return;
        if (isMyTurn) void send({ t: "closeModal" });
      },

      openConfirmEnd: () => patchUi({ modal: { kind: "confirmEnd" } }),
      openSettingsHelp: () => patchUi({ modal: { kind: "settingsHelp" } }),
      openVideo: (videoKey: string) => patchUi({ modal: { kind: "video", videoKey } }),
      goResults: () => patchUi({ screen: "sresults" }),
      // Leaving a shared game shows this device its own end screen, which is
      // also what writes the session to the results log.
      endGame: () => patchUi({ screen: "swin", modal: null, endedEarly: true }),

      // A watching friend solving the open question is the whole point of the
      // feature, so this one is allowed when it isn't your turn.
      awardSpectatorBonus: (playerIdx: number) => void send({ t: "spectatorBonus", playerIdx }),

      openPrimeHex: (hex: number) => {
        if (!isMyTurn) return;
        void send({ t: "openPrimeHex", hex });
      },
      factorSolved: () => { if (isMyTurn) void send({ t: "factorSolved" }); },
      factorSkip: () => { if (isMyTurn) void send({ t: "factorSkip" }); },
    };
  }, [
    isMyTurn,
    later,
    send,
    patchUi,
    leave,
    noop,
    markHint,
    markRevealed,
    onHexClick,
    onAnswer,
    closePrivateModal,
  ]);

  // The answer log below is only ever read once the game is over, and it is
  // appended to as answers happen rather than re-created, so handing the live
  // array out is deliberate — the same way the single-player game does it.
  // eslint-disable-next-line react-hooks/refs
  return {
    seat,
    view,
    me,
    state,
    // eslint-disable-next-line react-hooks/refs
    trials: trialLog.current,
    actions,
    isMyTurn,
    error,
    busy,
    clearError: useCallback(() => setError(null), []),
    createLobby,
    joinLobby,
    startGame,
    endGame,
    leave,
  };
}

export type OnlineGame = ReturnType<typeof useOnlineGame>;
