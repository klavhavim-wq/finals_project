"use client";

import { useEffect, useRef, useState } from "react";
import HexBoard from "../HexBoard";
import PlayerCards from "../PlayerCards";
import StepPrize from "../StepPrize";
import SidebarRoute from "../SidebarRoute";
import SidebarHelper from "../SidebarHelper";
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

  // Find (1) and route (2) stages dock a fixed bar above the board so it never
  // covers the hexes. The walk stage (3) — where you don't tap the board —
  // shows a centered window over it.
  const docked = state.phase === 1 || state.phase === 2;
  const dockTitle = state.phase === 1 ? t.winFindTitle : t.winRouteTitle;

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
        <div className="gstage-main">
          {/* Fixed bar above the board for the find & route stages */}
          {docked && (
            <div className={"phasedock " + (state.phase === 1 ? "pd-find" : "pd-route")}>
              <div className="phasedock-title">{dockTitle}</div>
              <div className="phasedock-body">
                <ActionPanel t={t} state={state} actions={actions} />
              </div>
            </div>
          )}

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
        </div>

        {/* Side bar: bank + door legend + route detail + helper.
            Fixed column on desktop, a slide-in drawer on mobile. */}
        {!isDesktop && bankOpen && <div className="drawer-backdrop" onClick={() => setBankOpen(false)} />}
        <aside className={"gsidebar" + (!isDesktop ? " drawer" : "") + (bankOpen ? " open" : "")}>
          {!isDesktop && (
            <button className="drawer-close" onClick={() => setBankOpen(false)} aria-label={t.close}>✕</button>
          )}
          <PlayerCards t={t} state={state} />
          <StepPrize t={t} state={state} />
          <SidebarRoute t={t} state={state} />
          <SidebarHelper t={t} state={state} actions={actions} />
        </aside>
      </div>

      {/* Walk stage: centered window over the board (no board answering here) */}
      {state.phase === 3 && (
        <div className="phasewin pw-walk">
          <div className="phasewin-head">
            <span className="phasewin-title">{t.winWalkTitle}</span>
          </div>
          <div className="phasewin-body">
            <ActionPanel t={t} state={state} actions={actions} />
          </div>
        </div>
      )}
    </div>
  );
}
