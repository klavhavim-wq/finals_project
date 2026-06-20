"use client";

import { useEffect, useRef, useState } from "react";
import HexBoard from "../HexBoard";
import PlayerCards from "../PlayerCards";
import StepPrize from "../StepPrize";
import ActionPanel from "../ActionPanel";
import LanguageSwitch from "../LanguageSwitch";
import type { GameState, Locale } from "@/lib/engine/types";
import type { GameActions } from "../useGame";
import type { Dict } from "@/lib/i18n";

function fmtTime(s: number): string {
  return "⏱ " + Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
}

const PHASE_ICONS = ["", "🎯", "🗺️", "🐕"];

/** The 1 → 2 → 3 step strip that sits on top of the command square. */
function PhaseStrip({ t, state }: { t: Dict; state: GameState }) {
  return (
    <div className="phasestrip">
      {([1, 2, 3] as const).map((i) => (
        <div
          key={i}
          className={
            "phasestep" +
            (i === state.phase ? " cur" : i < state.phase ? " done" : "")
          }
        >
          {PHASE_ICONS[i]} {t.phaseLabels[i - 1]}
        </div>
      ))}
    </div>
  );
}

/** Slim contextual banner shown on the mobile board screen so the player knows
 *  what to do while looking at the board. */
function BoardBanner({ t, state }: { t: Dict; state: GameState }) {
  let body: React.ReactNode = null;
  if (state.phase === 1 && state.card) {
    body = (
      <>
        <span className="bbn-ex">{t.targetExpr(state.card.ex)}</span>
        <span className="bbn-sub">{t.boardBannerFind}</span>
      </>
    );
  } else if (state.phase === 2) {
    body = <span className="bbn-sub">{t.boardBannerRoute(state.targetHex ?? 0)}</span>;
  } else if (state.phase === 3) {
    body = (
      <>
        {state.pendingRoll && <span className="bbn-ex">{state.pendingRoll.expr} = ?</span>}
        <span className="bbn-sub">{t.boardBannerWalk}</span>
      </>
    );
  }
  if (!body) return null;
  return <div className="boardbanner">{body}</div>;
}

export default function GameScreen({
  t,
  state,
  actions,
  locale,
}: {
  t: Dict;
  state: GameState;
  actions: GameActions;
  locale: Locale;
}) {
  const timerClass =
    "ghtimer" +
    (state.timerRunning ? " show" : "") +
    (state.timerSecs <= 30 ? " urg" : state.timerSecs <= 60 ? " warn" : "");
  const pct = state.timerTotal ? Math.max(0, (state.timerSecs / state.timerTotal) * 100) : 0;
  const curName = state.players[state.cur]?.name ?? "";

  // Board pan
  const scrollRef = useRef<HTMLDivElement>(null);
  const pan = useRef({ active: false, moved: false, x: 0, y: 0, l: 0, t: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;
    pan.current = { active: true, moved: false, x: e.clientX, y: e.clientY, l: el.scrollLeft, t: el.scrollTop };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pan.current;
    if (!p.active) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (!p.moved && Math.abs(dx) + Math.abs(dy) > 6) {
      p.moved = true;
      scrollRef.current?.setPointerCapture(e.pointerId);
    }
    if (p.moved && scrollRef.current) {
      scrollRef.current.scrollLeft = p.l - dx;
      scrollRef.current.scrollTop = p.t - dy;
    }
  };
  const endPan = () => {
    pan.current.active = false;
    if (pan.current.moved) {
      setTimeout(() => { pan.current.moved = false; }, 0);
    }
  };
  const guardedHexClick = (n: number) => {
    if (pan.current.moved) {
      pan.current.moved = false;
      return;
    }
    actions.hexClick(n);
  };

  // Desktop vs mobile, and which mobile screen is showing.
  const [isDesktop, setIsDesktop] = useState(true);
  const [mobileView, setMobileView] = useState<"play" | "board">("play");
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth > 820);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // The two-screen split is active only during real play on a phone (the guided
  // tour keeps everything stacked so its spotlights always find their target).
  const split = !isDesktop && !state.tourActive;

  // Smart default: finding the target and planning the route need the board;
  // solving the door exercise happens on the play screen.
  useEffect(() => {
    if (!split) return;
    if (state.phase === 1 || state.phase === 2) setMobileView("board");
  }, [state.phase, split]);

  // Watch the dog move right after a correct answer, then come back to solve.
  useEffect(() => {
    if (!split || state.phase !== 3) return;
    if (state.mcCorrect != null) setMobileView("board");
  }, [state.mcCorrect, state.phase, split]);
  useEffect(() => {
    if (!split || state.phase !== 3) return;
    if (state.pendingRoll == null && !state.modal) setMobileView("play");
  }, [state.pendingRoll, state.modal, state.phase, split]);

  const showBoard = !split || mobileView === "board";
  const showPlay = !split || mobileView === "play";

  return (
    <div id="sg" className={"screen active" + (split ? " split-mode" : "")}>
      <div className="ghdr">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt={t.logoAlt} className="brand-logo-sm" />
        <span className="ghtitle">{t.gameTitle}</span>
        <span className="ghturn">{t.turn(curName)}</span>
        {!state.settings.freePlay && state.settings.winMode !== "first100" && (
          <span className="ghround">{t.roundLabel(Math.min(state.round + 1, 4), 4)}</span>
        )}
        <div className={timerClass}>
          <div className="tnum">{fmtTime(state.timerSecs)}</div>
          <div className="tbar">
            <div className="tfill" style={{ width: pct + "%" }} />
          </div>
        </div>
        <LanguageSwitch locale={locale} />
        <button className="ghbtn" onClick={actions.goInst} aria-label={t.instAria} title={t.instAria}>
          📖
        </button>
        <button className="ghbtn" onClick={actions.openConfirmEnd} aria-label={t.endGame} title={t.endGame}>
          ✖
        </button>
      </div>

      {split && (
        <div className="mtabs">
          <button
            className={"mtab" + (mobileView === "play" ? " on" : "")}
            onClick={() => setMobileView("play")}
          >
            {t.tabPlay}
          </button>
          <button
            className={"mtab" + (mobileView === "board" ? " on" : "")}
            onClick={() => setMobileView("board")}
          >
            {t.tabBoard}
          </button>
        </div>
      )}

      <div className={"gbody" + (split ? " split" : "")}>
        {showBoard && (
          <div
            ref={scrollRef}
            className="hivewrap"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPan}
            onPointerLeave={endPan}
          >
            {split && <BoardBanner t={t} state={state} />}
            <HexBoard state={state} onHexClick={guardedHexClick} portrait={split && mobileView === "board"} />
          </div>
        )}

        {showPlay && (
          <div className="gsidebar">
            <PlayerCards t={t} state={state} />
            <StepPrize t={t} state={state} />
            <div className="sq sq-command">
              <PhaseStrip t={t} state={state} />
              <div className="sq-command-body">
                <ActionPanel t={t} state={state} actions={actions} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
