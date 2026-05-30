"use client";

import { useRef } from "react";
import HexBoard from "../HexBoard";
import PlayerCards from "../PlayerCards";
import ActionPanel from "../ActionPanel";
import LanguageSwitch from "../LanguageSwitch";
import type { GameState, Locale } from "@/lib/engine/types";
import type { GameActions } from "../useGame";
import type { Dict } from "@/lib/i18n";

function fmtTime(s: number): string {
  return "⏱ " + Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
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

  // Mouse drag-to-pan for the board (touch pans natively via overflow scroll).
  const scrollRef = useRef<HTMLDivElement>(null);
  const pan = useRef({ active: false, moved: false, x: 0, y: 0, l: 0, t: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;
    pan.current = {
      active: true,
      moved: false,
      x: e.clientX,
      y: e.clientY,
      l: el.scrollLeft,
      t: el.scrollTop,
    };
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
  };

  const guardedHexClick = (n: number) => {
    if (pan.current.moved) {
      pan.current.moved = false;
      return;
    }
    actions.hexClick(n);
  };

  return (
    <div id="sg" className="screen active">
      <div className="ghdr">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt={t.logoAlt} className="brand-logo-sm" />
        <span className="ghtitle">{t.gameTitle}</span>
        <span className="ghturn">{t.turn(curName)}</span>
        <div className={timerClass}>
          <div className="tnum">{fmtTime(state.timerSecs)}</div>
          <div className="tbar">
            <div className="tfill" style={{ width: pct + "%" }} />
          </div>
        </div>
        <LanguageSwitch locale={locale} />
        <button className="ghbtn" onClick={actions.goInst}>
          📖
        </button>
        <button className="ghbtn" onClick={actions.openConfirmEnd}>
          ✖
        </button>
      </div>
      <div className="gbody">
        <div
          ref={scrollRef}
          className="hivewrap"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPan}
          onPointerLeave={endPan}
        >
          <HexBoard state={state} onHexClick={guardedHexClick} />
        </div>
        <div className="sidebar">
          <PlayerCards t={t} state={state} />
          <div className="apanel">
            <div className="aphdots">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={
                    "apdot" + (i < state.phase ? " done" : i === state.phase ? " cur" : "")
                  }
                />
              ))}
            </div>
            <ActionPanel t={t} state={state} actions={actions} />
          </div>
        </div>
      </div>
    </div>
  );
}
