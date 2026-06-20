"use client";

import { useEffect, useRef, useState } from "react";
import HexBoard from "../HexBoard";
import PlayerCards from "../PlayerCards";
import SidebarHelper from "../SidebarHelper";
import ActionPanel from "../ActionPanel";
import LanguageSwitch from "../LanguageSwitch";
import type { GameState, Locale } from "@/lib/engine/types";
import type { GameActions } from "../useGame";
import type { Dict } from "@/lib/i18n";

function fmtTime(s: number): string {
  return "⏱ " + Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
}

/** Keep a dragged window inside the viewport (at least ~120px always reachable). */
function clamp(x: number, y: number, w: number): { x: number; y: number } {
  if (typeof window === "undefined") return { x, y };
  const maxX = window.innerWidth - 120;
  const minX = -(w - 120);
  const maxY = window.innerHeight - 80;
  return { x: Math.min(maxX, Math.max(minX, x)), y: Math.min(maxY, Math.max(0, y)) };
}

const WIN_W = 320;

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

  // ── Board pan ──
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
    if (pan.current.moved) setTimeout(() => { pan.current.moved = false; }, 0);
  };
  const guardedHexClick = (n: number) => {
    if (pan.current.moved) { pan.current.moved = false; return; }
    actions.hexClick(n);
  };

  // ── Responsive + mobile bank drawer ──
  const [isDesktop, setIsDesktop] = useState(true);
  const [bankOpen, setBankOpen] = useState(false);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth > 820);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  // Close the mobile drawer whenever the stage changes.
  useEffect(() => { setBankOpen(false); }, [state.phase]);

  // ── Phase-1 draggable window ──
  const [winPos, setWinPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef({ active: false, ox: 0, oy: 0 });
  // Reset the find window to a sensible spot at the start of each find stage.
  useEffect(() => {
    if (state.phase === 1) {
      const x = typeof window !== "undefined" ? Math.max(12, (window.innerWidth - WIN_W) / 2) : 40;
      setWinPos(clamp(x, 74, WIN_W));
    } else {
      setWinPos(null);
    }
  }, [state.phase, state.card?.id]);

  const onDragDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!winPos) return;
    drag.current = { active: true, ox: e.clientX - winPos.x, oy: e.clientY - winPos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    setWinPos(clamp(e.clientX - drag.current.ox, e.clientY - drag.current.oy, WIN_W));
  };
  const onDragUp = () => { drag.current.active = false; };

  const winTitle =
    state.phase === 1 ? t.winFindTitle :
    state.phase === 2 ? t.winRouteTitle :
    state.phase === 3 ? t.winWalkTitle : "";

  return (
    <div id="sg" className="screen active board-canvas">
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
        {!isDesktop && (
          <button className="ghbtn ghbank" onClick={() => setBankOpen((v) => !v)} aria-label={t.bankBtnLabel} title={t.bankBtnLabel}>
            🏦
          </button>
        )}
        <LanguageSwitch locale={locale} />
        <button className="ghbtn" onClick={actions.goInst} aria-label={t.instAria} title={t.instAria}>
          📖
        </button>
        <button className="ghbtn" onClick={actions.openConfirmEnd} aria-label={t.endGame} title={t.endGame}>
          ✖
        </button>
      </div>

      <div className="gstage">
        <div
          ref={scrollRef}
          className="hivewrap"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPan}
          onPointerLeave={endPan}
        >
          <HexBoard state={state} onHexClick={guardedHexClick} portrait={!isDesktop} />
        </div>

        {/* Side bar: bank + helper. Fixed on desktop, a slide-in drawer on mobile. */}
        {!isDesktop && bankOpen && <div className="drawer-backdrop" onClick={() => setBankOpen(false)} />}
        <aside className={"gsidebar" + (!isDesktop ? " drawer" : "") + (bankOpen ? " open" : "")}>
          {!isDesktop && (
            <button className="drawer-close" onClick={() => setBankOpen(false)} aria-label={t.close}>✕</button>
          )}
          <PlayerCards t={t} state={state} />
          <SidebarHelper t={t} state={state} actions={actions} />
        </aside>
      </div>

      {/* Per-stage floating window over the board */}
      {state.phase >= 1 && state.phase <= 3 && (
        <div
          className={
            "phasewin " +
            (state.phase === 1 ? "pw-find" : state.phase === 2 ? "pw-route" : "pw-walk")
          }
          style={state.phase === 1 && winPos ? { left: winPos.x, top: winPos.y } : undefined}
        >
          <div
            className="phasewin-head"
            onPointerDown={state.phase === 1 ? onDragDown : undefined}
            onPointerMove={state.phase === 1 ? onDragMove : undefined}
            onPointerUp={state.phase === 1 ? onDragUp : undefined}
          >
            <span className="phasewin-title">{winTitle}</span>
            {state.phase === 1 && <span className="phasewin-grip">⠿</span>}
          </div>
          <div className="phasewin-body">
            <ActionPanel t={t} state={state} actions={actions} />
          </div>
        </div>
      )}
    </div>
  );
}
