"use client";

import { useEffect, useRef, useState } from "react";
import HexBoard from "../HexBoard";
import PlayerCards from "../PlayerCards";
import StepPrize from "../StepPrize";
import SidebarRoute from "../SidebarRoute";
import SidebarHelper from "../SidebarHelper";
import ActionPanel from "../ActionPanel";
import WalkPanel from "../WalkPanel";
import LanguageSwitch from "../LanguageSwitch";
import MusicControl from "../MusicControl";
import { DOGS } from "@/lib/engine/constants";
import { boardSvgSize } from "@/lib/engine/hexgrid";
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
  musicMuted,
  musicVolume,
  onToggleMusic,
  onMusicVolume,
}: {
  t: Dict;
  state: GameState;
  actions: GameActions;
  locale: Locale;
  musicMuted: boolean;
  musicVolume: number;
  onToggleMusic: () => void;
  onMusicVolume: (v: number) => void;
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
    // Big-screen layout (a fixed side column with the bank always visible) only
    // when there's real room for it: a wide desktop, or a tablet/desktop in
    // landscape that's also tall enough. Phones — including a phone turned
    // sideways (short height) — use the slide-out bank drawer with its edge tab,
    // so the board keeps the full width and the bank is one tap away.
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const tallEnough = h >= 600;
      setIsDesktop(tallEnough && (w > 820 || (w >= 640 && w > h)));
    };
    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);
  // Close the mobile drawer whenever the stage changes.
  useEffect(() => { setBankOpen(false); }, [state.phase]);

  // ── Mobile board zoom ──
  // On phones the whole board is scaled to fit the screen. These let the player
  // make the hexes bigger (to read/tap) or smaller, panning by dragging when the
  // board is larger than the screen. `base` is the fit-to-screen size (zoom = 1),
  // measured from the board area so the fit stays exact on any phone/orientation.
  const ZMIN = 0.6, ZMAX = 3;
  const [zoom, setZoom] = useState(1);
  const [base, setBase] = useState<{ w: number; h: number } | null>(null);
  const zoomBy = (d: number) =>
    setZoom((z) => Math.min(ZMAX, Math.max(ZMIN, Math.round((z + d) * 10) / 10)));

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isDesktop) { setBase(null); return; }
    const measure = () => {
      const cw = el.clientWidth - 6, ch = el.clientHeight - 6;
      if (cw <= 0 || ch <= 0) return;
      const { w: nw, h: nh } = boardSvgSize(state.level);
      const fit = Math.min(cw / nw, ch / nh);
      setBase({ w: nw * fit, h: nh * fit });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isDesktop, state.level]);

  // Reset the zoom back to fit-to-screen when leaving the phone layout.
  useEffect(() => { if (isDesktop) setZoom(1); }, [isDesktop]);

  const boardSize =
    !isDesktop && base
      ? { width: base.w * zoom, height: base.h * zoom, maxWidth: "none", maxHeight: "none" }
      : undefined;

  // ── Draggable bank tab (mobile) ──
  // The edge tab can be dragged anywhere so it never sits on top of a hex the
  // player needs to tap. A plain tap (no drag) still opens the bank drawer.
  const [tabPos, setTabPos] = useState<{ x: number; y: number } | null>(null);
  const tabDrag = useRef({ active: false, moved: false, dx: 0, dy: 0, sx: 0, sy: 0 });
  // Rotating the phone re-docks the tab to its default edge; a plain resize (e.g.
  // the mobile address bar showing/hiding) just keeps it inside the screen so a
  // dragged tab can never end up stranded out of reach.
  useEffect(() => {
    const reset = () => setTabPos(null);
    const clamp = () =>
      setTabPos((p) =>
        p
          ? {
              x: Math.max(4, Math.min(p.x, window.innerWidth - 70)),
              y: Math.max(4, Math.min(p.y, window.innerHeight - 70)),
            }
          : p
      );
    window.addEventListener("orientationchange", reset);
    window.addEventListener("resize", clamp);
    return () => {
      window.removeEventListener("orientationchange", reset);
      window.removeEventListener("resize", clamp);
    };
  }, []);
  const onTabDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    tabDrag.current = {
      active: true, moved: false,
      dx: e.clientX - r.left, dy: e.clientY - r.top, sx: e.clientX, sy: e.clientY,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onTabMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = tabDrag.current;
    if (!d.active) return;
    // Only treat it as a drag once the finger has clearly moved, so a tap still opens the bank.
    if (!d.moved && Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) < 6) return;
    d.moved = true;
    const el = e.currentTarget;
    const w = el.offsetWidth, h = el.offsetHeight;
    const x = Math.max(4, Math.min(e.clientX - d.dx, window.innerWidth - w - 4));
    const y = Math.max(4, Math.min(e.clientY - d.dy, window.innerHeight - h - 4));
    setTabPos({ x, y });
  };
  const onTabUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    tabDrag.current.active = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const onTabClick = () => {
    // A drag ends with a click too — only open the bank on a real tap.
    if (tabDrag.current.moved) { tabDrag.current.moved = false; return; }
    setBankOpen(true);
  };

  // Find (1) and route (2) stages dock a fixed bar above the board so it never
  // covers the hexes. The walk stage (3) shows a movable panel that floats to
  // the side of the board, so the dog stays visible as it walks.
  const docked = state.phase === 1 || state.phase === 2;
  const dockTitle = state.phase === 1 ? t.winFindTitle : t.winRouteTitle;

  // On a wide screen the in-turn controls live as a card at the top of the side
  // column, so the board itself gets the full height of the stage (much bigger
  // hexes, no wasted side margins). On mobile they stay as a thin bar docked
  // above the board.
  const dockNode = docked ? (
    <div className={"phasedock " + (isDesktop ? "pd-side" : state.phase === 1 ? "pd-find" : "pd-route")}>
      <div className="phasedock-title">{dockTitle}</div>
      <div className="phasedock-body">
        <ActionPanel t={t} state={state} actions={actions} />
      </div>
    </div>
  ) : null;

  return (
    <div id="sg" className={"screen active board-canvas" + (state.phase === 3 ? " walk-mode" : "")}>
      <div className="ghdr">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt={t.logoAlt} className="brand-logo-sm" />
        <span className="ghtitle">{t.gameTitle}</span>
        <span className="ghturn">{t.turn(`${DOGS[state.cur]} ${curName}`)}</span>
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
        <MusicControl
          t={t}
          muted={musicMuted}
          volume={musicVolume}
          onToggle={onToggleMusic}
          onVolume={onMusicVolume}
        />
        <button className="ghbtn" onClick={actions.goInst} aria-label={t.instAria} title={t.instAria}>
          📖
        </button>
        <button className="ghbtn" onClick={actions.openConfirmEnd} aria-label={t.endGame} title={t.endGame}>
          ✖
        </button>
      </div>

      <div className="gstage">
        <div className="gstage-main">
          {/* Mobile: a thin bar docked above the board (find & route stages) */}
          {!isDesktop && dockNode}

          <div
            ref={scrollRef}
            className="hivewrap"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPan}
            onPointerLeave={endPan}
          >
            <HexBoard state={state} onHexClick={guardedHexClick} sizeStyle={boardSize} />
          </div>

          {/* Mobile: make the board bigger/smaller. Drag the board to pan when it
              grows past the screen. Hidden during the walk (the dog drives itself). */}
          {!isDesktop && state.phase !== 3 && (
            <div className="board-zoom">
              <button className="bz-btn" onClick={() => zoomBy(-0.3)} disabled={zoom <= ZMIN}
                aria-label={t.zoomOut} title={t.zoomOut}>−</button>
              {Math.abs(zoom - 1) > 0.001 && (
                <button className="bz-btn bz-reset" onClick={() => setZoom(1)}
                  aria-label={t.zoomReset} title={t.zoomReset}>⤢</button>
              )}
              <button className="bz-btn" onClick={() => zoomBy(0.3)} disabled={zoom >= ZMAX}
                aria-label={t.zoomIn} title={t.zoomIn}>+</button>
            </div>
          )}
        </div>

        {/* Mobile: a bold tab stuck to the screen edge opens the side panel
            (bank, route, helper). Lives on the edge, not in the top bar. */}
        {!isDesktop && !bankOpen && (
          <button
            className={"bank-tab" + (tabPos ? " moved" : "")}
            onClick={onTabClick}
            onPointerDown={onTabDown}
            onPointerMove={onTabMove}
            onPointerUp={onTabUp}
            onPointerCancel={onTabUp}
            style={
              tabPos
                ? { left: tabPos.x, top: tabPos.y, right: "auto", insetInlineStart: "auto", insetInlineEnd: "auto", transform: "none", animation: "none", touchAction: "none" }
                : { touchAction: "none" }
            }
            aria-label={t.bankBtnLabel}
            title={t.bankBtnLabel}
          >
            <span className="bank-tab-ico">🏦</span>
            <span className="bank-tab-lbl">{t.bankTab}</span>
          </button>
        )}

        {/* Side bar: bank + door legend + route detail + helper.
            Fixed column on desktop, a slide-in drawer on mobile. */}
        {!isDesktop && bankOpen && <div className="drawer-backdrop" onClick={() => setBankOpen(false)} />}
        <aside className={"gsidebar" + (!isDesktop ? " drawer" : "") + (bankOpen ? " open" : "")}>
          {!isDesktop && (
            <button className="drawer-close" onClick={() => setBankOpen(false)} aria-label={t.close}>✕</button>
          )}
          {/* Desktop: the in-turn controls sit at the top of the side column */}
          {isDesktop && dockNode}
          <PlayerCards t={t} state={state} />
          <StepPrize t={t} state={state} />
          <SidebarRoute t={t} state={state} />
          <SidebarHelper t={t} state={state} actions={actions} />
        </aside>
      </div>

      {/* Walk stage: a movable panel floating beside the board — drag it by the
          title bar so the dog's progress along the route stays visible. */}
      {state.phase === 3 && <WalkPanel t={t} state={state} actions={actions} />}
    </div>
  );
}
