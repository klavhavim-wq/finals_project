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
    <div id="door-legend" style={{
      padding: "10px 12px", background: "white",
      borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,.07)",
      marginTop: 8,
    }}>
      <div style={{ fontWeight: 700, color: "#9ca3af", fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
        {t.doorLegendTitle}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {unique.map(d => {
          const dc = DC[d];
          const range = dc.ranges
            ? `${dc.ranges[0][0]}–${dc.ranges[0][1]} × ${dc.ranges[1][0]}–${dc.ranges[1][1]}`
            : `${dc.min}–${dc.max}`;
          return (
            <div key={d} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: dc.color + "18",
              borderRadius: 8, padding: "5px 8px",
              borderLeft: `4px solid ${dc.color}`,
            }}>
              <span style={{ fontSize: "1rem", lineHeight: 1 }}>
                {t.doorLabel(d).split(" ")[0]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: ".82rem", color: "#1f2937", lineHeight: 1.2 }}>
                  {t.doorLabel(d).split(" ").slice(1).join(" ")}
                </div>
                <div style={{ fontSize: ".74rem", color: "#6b7280", direction: "ltr", unicodeBidi: "embed", lineHeight: 1.3 }}>
                  ×({range})
                </div>
              </div>
              <span style={{
                fontWeight: 800, fontSize: ".88rem", color: dc.color,
                background: "white", borderRadius: 6,
                padding: "2px 7px", flexShrink: 0,
                border: `1.5px solid ${dc.color}`,
              }}>
                {t.doorLegendPts(dc.pts)}
              </span>
            </div>
          );
        })}
      </div>
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
            <div style={{ display: "flex", gap: 4, flex: 1 }}>
              {([1, 2, 3] as const).map((i) => (
                <div
                  key={i}
                  style={{
                    flex: 1, textAlign: "center", fontSize: ".68rem",
                    fontWeight: i === state.phase ? 800 : 500,
                    background: i === state.phase ? "#FDE68A" : i < state.phase ? "#d1fae5" : "transparent",
                    color: i === state.phase ? "#92400E" : i < state.phase ? "#065F46" : "#b45309",
                    borderRadius: 6, padding: "2px 3px", transition: "all .2s",
                  }}
                >
                  {PHASE_ICONS[i]} {t.phaseLabels[i - 1]}
                </div>
              ))}
            </div>
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
