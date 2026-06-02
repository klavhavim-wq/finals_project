"use client";

import { useEffect, useRef, useState } from "react";
import HexBoard from "../HexBoard";
import PlayerCards from "../PlayerCards";
import ActionPanel from "../ActionPanel";
import LanguageSwitch from "../LanguageSwitch";
import { DC, LVL_DOORS } from "@/lib/engine/constants";
import type { GameState, Locale } from "@/lib/engine/types";
import type { GameActions } from "../useGame";
import type { Dict } from "@/lib/i18n";

function DoorLegend({ t, state }: { t: Dict; state: GameState }) {
  const doors = LVL_DOORS[state.level];
  const unique = [...new Set(doors)];
  return (
    <div style={{
      padding: "10px 14px", background: "white",
      borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,.07)",
      marginTop: 8, fontSize: ".78rem",
    }}>
      <div style={{ fontWeight: 700, color: "#9ca3af", fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 7 }}>
        {t.doorLegendTitle}
      </div>
      {unique.map(d => {
        const dc = DC[d];
        const range = dc.ranges
          ? `${dc.ranges[0][0]}–${dc.ranges[0][1]} × ${dc.ranges[1][0]}–${dc.ranges[1][1]}`
          : `${dc.min}–${dc.max}`;
        return (
          <div key={d} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: dc.color, flexShrink: 0 }} />
            <span style={{ color: "#374151", direction: "ltr", unicodeBidi: "embed" }}>
              {t.doorLabel(d)} · ×({range}) ·{" "}
              <strong style={{ color: dc.color }}>{t.doorLegendPts(dc.pts)}</strong>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function fmtTime(s: number): string {
  return "⏱ " + Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
}

const PHASE_ICONS = ["", "🎯", "🗺️", "🐕"];

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

  // Floating panel drag
  const [isDesktop, setIsDesktop] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 15, y: 65 });
  const fpDrag = useRef({ active: false, ox: 0, oy: 0 });
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const wide = window.innerWidth > 820;
      setIsDesktop(wide);
      if (wide) {
        // Start on the right side of the board, clear of the 274px sidebar
        setPanelPos({ x: window.innerWidth - 580, y: 70 });
      }
    }
    const onResize = () => setIsDesktop(window.innerWidth > 820);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDesktop) return;
    fpDrag.current = { active: true, ox: e.clientX - panelPos.x, oy: e.clientY - panelPos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };
  const onHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!fpDrag.current.active || !isDesktop) return;
    e.stopPropagation();
    setPanelPos({ x: e.clientX - fpDrag.current.ox, y: e.clientY - fpDrag.current.oy });
  };
  const onHandleUp = (e: React.PointerEvent<HTMLDivElement>) => {
    fpDrag.current.active = false;
    e.stopPropagation();
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

        {/* Action panel — floats on desktop, flows in sidebar on mobile */}
        <div
          className={"floatpanel" + (isDesktop ? " float-active" : "")}
          style={isDesktop ? { left: panelPos.x, top: panelPos.y } : undefined}
        >
          <div
            className="floatpanel-handle"
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
          >
            <div className="aphdots fp-dots">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={
                    "apdot" + (i < state.phase ? " done" : i === state.phase ? " cur" : "")
                  }
                />
              ))}
            </div>
            <span className="fp-phase">{PHASE_ICONS[state.phase]}</span>
            {isDesktop && <span className="fp-grip">⠿</span>}
          </div>
          <div className="floatpanel-body">
            <ActionPanel t={t} state={state} actions={actions} />
          </div>
        </div>

        <div className="sidebar">
          <PlayerCards t={t} state={state} />
          <DoorLegend t={t} state={state} />
        </div>
      </div>
    </div>
  );
}
