"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import HexBoard from "../HexBoard";
import PlayerCards from "../PlayerCards";
import StepPrize from "../StepPrize";
import SidebarRoute from "../SidebarRoute";
import SidebarHelper from "../SidebarHelper";
import OnlineHelper from "../OnlineHelper";
import RouteConfirm from "../RouteConfirm";
import ActionPanel from "../ActionPanel";
import WalkPanel from "../WalkPanel";
import LanguageSwitch from "../LanguageSwitch";
import MusicControl from "../MusicControl";
import { useDeviceLayout } from "../useDeviceLayout";
import { routeReachesTarget } from "@/lib/engine/gameReducer";
import { DOGS } from "@/lib/engine/constants";
import { boardSvgSize } from "@/lib/engine/hexgrid";
import type { GameState, Locale } from "@/lib/engine/types";
import type { GameActions } from "../useGame";
import type { Dict } from "@/lib/i18n";

function fmtTime(s: number): string {
  return "⏱ " + Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
}

// ── One-time tip: a phone held upright suggests turning it sideways ──
// The board is wide and flat, so a sideways phone shows it far bigger. The tip
// only appears while the phone is upright, and one tap retires it for good.
const ROTATE_TIP_KEY = "kn-rotate-tip";
/** Fit-to-screen, board centred — the board view a phone starts on. */
const ORIGIN = { x: 0, y: 0 };
const rotateTipListeners = new Set<() => void>();

function subscribeRotateTip(onChange: () => void): () => void {
  rotateTipListeners.add(onChange);
  window.addEventListener("resize", onChange);
  window.addEventListener("orientationchange", onChange);
  return () => {
    rotateTipListeners.delete(onChange);
    window.removeEventListener("resize", onChange);
    window.removeEventListener("orientationchange", onChange);
  };
}

function rotateTipSnapshot(): boolean {
  if (window.innerHeight <= window.innerWidth) return false;
  try {
    return localStorage.getItem(ROTATE_TIP_KEY) !== "1";
  } catch {
    return true;
  }
}

function dismissRotateTip(): void {
  try { localStorage.setItem(ROTATE_TIP_KEY, "1"); } catch {}
  rotateTipListeners.forEach((cb) => cb());
}

export default function GameScreen({
  t,
  state,
  actions,
  locale,
  mySeat,
  musicMuted,
  musicVolume,
  onToggleMusic,
  onMusicVolume,
}: {
  t: Dict;
  state: GameState;
  actions: GameActions;
  locale: Locale;
  /** seat of the player on this device in a game played together; null when playing alone */
  mySeat: number | null;
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

  // ── Which layout: a side column, or the board on the whole screen ──
  // The rule lives in one place, because the guides describe the screen and must
  // agree with it.
  const isDesktop = useDeviceLayout() === "desktop";
  const [bankOpen, setBankOpen] = useState(false);
  // Close the mobile drawer whenever the stage changes.
  useEffect(() => { setBankOpen(false); }, [state.phase]);

  // ── Board view on a phone: drag with one finger, pinch with two ──
  // `base` is the fit-to-screen size (zoom = 1), measured from the board area so
  // the fit stays exact on any phone or orientation. The board is then moved and
  // scaled with a CSS transform rather than by scrolling, for two reasons: a
  // transform is smooth enough to follow a live pinch, and — unlike scrolling —
  // it still works when the board already fits the screen. That second point is
  // what stops the board going dead: a panel lying over it (the route strip, the
  // walk sheet) used to leave the hexes underneath unreachable, because a board
  // that fits its box has nothing to scroll.
  const ZMIN = 0.5, ZMAX = 4;
  const scrollRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(ORIGIN);
  const [base, setBase] = useState<{ w: number; h: number } | null>(null);
  // The live view during a gesture, written straight onto the element so a pinch
  // never waits for a re-render; committed to state when the fingers lift.
  const view = useRef({ z: 1, x: 0, y: 0 });
  const baseRef = useRef<{ w: number; h: number } | null>(null);
  useEffect(() => { view.current = { z: zoom, x: pan.x, y: pan.y }; }, [zoom, pan]);
  useEffect(() => { baseRef.current = base; }, [base]);

  // How far the board may be dragged. Past the point where its edge meets the
  // screen edge it may go a little further still — that slack is what lets a hex
  // hidden under a panel be pulled into view even at fit-to-screen size.
  const clampPan = (x: number, y: number, z: number) => {
    const el = scrollRef.current, b = baseRef.current;
    if (!el || !b) return { x, y };
    const mx = Math.max(0, (b.w * z - el.clientWidth) / 2) + el.clientWidth * 0.3;
    const my = Math.max(0, (b.h * z - el.clientHeight) / 2) + el.clientHeight * 0.4;
    return { x: Math.min(mx, Math.max(-mx, x)), y: Math.min(my, Math.max(-my, y)) };
  };
  const applyView = (z: number, x: number, y: number) => {
    const c = clampPan(x, y, z);
    view.current = { z, x: c.x, y: c.y };
    if (boardRef.current)
      boardRef.current.style.transform = "translate(" + c.x + "px," + c.y + "px) scale(" + z + ")";
  };
  const commitView = () => {
    setZoom(view.current.z);
    setPan((p) =>
      p.x === view.current.x && p.y === view.current.y ? p : { x: view.current.x, y: view.current.y }
    );
  };
  // The buttons zoom about the middle of the board area, so what you were
  // looking at stays where it was.
  const zoomBy = (d: number) => {
    const z = Math.min(ZMAX, Math.max(ZMIN, Math.round((view.current.z + d) * 10) / 10));
    const k = z / view.current.z;
    applyView(z, view.current.x * k, view.current.y * k);
    commitView();
  };
  const resetView = () => { applyView(1, 0, 0); commitView(); };

  // ── Fingers on the board ──
  // One finger drags, two pinch. A tap that never moved still picks a hex.
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const grab = useRef({ pinch: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0, d0: 1, z0: 1, mx: 0, my: 0 });
  // Set when a gesture turned out to be a drag, so the click it ends with does
  // not also pick whatever hex the finger happened to lift over. Cleared when
  // the next gesture starts, which is always after that click.
  const blockTap = useRef(false);
  // A wide screen keeps the old mouse drag: there the board is scrolled inside
  // its box, not transformed.
  const mouseScroll = useRef({ active: false, x: 0, y: 0, l: 0, t: 0 });

  // Where the fingers are, measured from the middle of the board area, and how
  // far apart they are.
  const fingerMid = () => {
    const el = scrollRef.current;
    const pts = [...ptrs.current.values()];
    if (!el || pts.length === 0) return { x: 0, y: 0, d: 1 };
    const r = el.getBoundingClientRect();
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const d = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 1;
    return { x: cx - (r.left + r.width / 2), y: cy - (r.top + r.height / 2), d: d || 1 };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDesktop) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      const el = scrollRef.current;
      if (!el) return;
      blockTap.current = false;
      grab.current.moved = false;
      mouseScroll.current = { active: true, x: e.clientX, y: e.clientY, l: el.scrollLeft, t: el.scrollTop };
      return;
    }
    if (ptrs.current.size === 0) blockTap.current = false;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.current.size === 1) {
      grab.current = { ...grab.current, pinch: false, moved: false,
        sx: e.clientX, sy: e.clientY, ox: view.current.x, oy: view.current.y };
    } else if (ptrs.current.size === 2) {
      const m = fingerMid();
      grab.current = { pinch: true, moved: true, sx: 0, sy: 0,
        ox: view.current.x, oy: view.current.y, d0: m.d, z0: view.current.z, mx: m.x, my: m.y };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDesktop) {
      const p = mouseScroll.current;
      if (!p.active) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      if (!grab.current.moved && Math.abs(dx) + Math.abs(dy) > 6) {
        grab.current.moved = true;
        scrollRef.current?.setPointerCapture(e.pointerId);
      }
      if (grab.current.moved && scrollRef.current) {
        scrollRef.current.scrollLeft = p.l - dx;
        scrollRef.current.scrollTop = p.t - dy;
      }
      return;
    }
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = grab.current;
    if (g.pinch && ptrs.current.size >= 2) {
      const m = fingerMid();
      const z = Math.min(ZMAX, Math.max(ZMIN, g.z0 * (m.d / g.d0)));
      // Keep the spot between the fingers under the fingers, and let it follow
      // them if the whole hand slides.
      const k = z / g.z0;
      applyView(z, m.x - k * (g.mx - g.ox), m.y - k * (g.my - g.oy));
      return;
    }
    const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
    if (!g.moved) {
      // Below this it is still a tap, so picking a hex keeps working.
      if (Math.abs(dx) + Math.abs(dy) < 8) return;
      g.moved = true;
      try { scrollRef.current?.setPointerCapture(e.pointerId); } catch {}
    }
    applyView(view.current.z, g.ox + dx, g.oy + dy);
  };

  const endPan = (e?: React.PointerEvent<HTMLDivElement>) => {
    if (isDesktop) {
      mouseScroll.current.active = false;
      if (grab.current.moved) {
        blockTap.current = true;
        grab.current.moved = false;
      }
      return;
    }
    if (e) ptrs.current.delete(e.pointerId);
    else ptrs.current.clear();
    if (ptrs.current.size === 1) {
      // A finger lifted mid-pinch: carry on dragging with the one still down.
      const p = [...ptrs.current.values()][0];
      grab.current = { ...grab.current, pinch: false, moved: true,
        sx: p.x, sy: p.y, ox: view.current.x, oy: view.current.y };
      return;
    }
    if (ptrs.current.size > 0) return;
    commitView();
    if (grab.current.moved) blockTap.current = true;
    grab.current.pinch = false;
    grab.current.moved = false;
  };

  const guardedHexClick = (n: number) => {
    if (blockTap.current) { blockTap.current = false; return; }
    actions.hexClick(n);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isDesktop) { setBase(null); return; }
    const measure = () => {
      const cw = el.clientWidth - 6, ch = el.clientHeight - 6;
      if (cw <= 0 || ch <= 0) return;
      const { w: nw, h: nh } = boardSvgSize(state.level);
      const fit = Math.min(cw / nw, ch / nh);
      const w = nw * fit, h = nh * fit;
      setBase((b) => (b && Math.abs(b.w - w) < 0.5 && Math.abs(b.h - h) < 0.5 ? b : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isDesktop, state.level]);

  // The board area changes size whenever a panel opens or the phone turns. Pull
  // the board back inside the new bounds so it can never be parked off-screen.
  useEffect(() => {
    if (!base) return;
    baseRef.current = base;
    setPan((p) => {
      const c = clampPan(p.x, p.y, view.current.z);
      return c.x === p.x && c.y === p.y ? p : c;
    });
  }, [base]);

  // Back to fit-to-screen on a new board, and when leaving the phone layout.
  // Done as the render that brings the change in, not afterwards in an effect,
  // so the board never paints once at the old zoom before snapping back.
  const viewFor = state.level + "|" + isDesktop;
  const [viewSetFor, setViewSetFor] = useState(viewFor);
  if (viewSetFor !== viewFor) {
    setViewSetFor(viewFor);
    setZoom(1);
    setPan(ORIGIN);
  }

  // How much of the bottom of the screen the walk sheet covers. The board area
  // gives up that much and nothing more (see WalkPanel); until it says, the old
  // flat reservation in the stylesheet stands.
  const [walkReserve, setWalkReserve] = useState<number | null>(null);
  const noteWalkReserve = useCallback(
    (px: number | null) => setWalkReserve((v) => (v === px ? v : px)),
    []
  );
  const mainStyle =
    walkReserve == null
      ? undefined
      : ({ "--walk-h": walkReserve + "px" } as CSSProperties);

  // Is the tip to turn the phone sideways showing? (see rotateTipSnapshot)
  const rotateTip = useSyncExternalStore(subscribeRotateTip, rotateTipSnapshot, () => false);

  // The board is laid out at its fit-to-screen size; zoom and pan ride on top of
  // that as a transform.
  const boardSize =
    !isDesktop && base
      ? { width: base.w, height: base.h, maxWidth: "none", maxHeight: "none" }
      : undefined;
  const viewMoved = Math.abs(zoom - 1) > 0.001 || pan.x !== 0 || pan.y !== 0;

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
  // A finished route puts the confirm window along the bottom edge on a phone —
  // the zoom buttons step up out of its way.
  const routeReady = state.phase === 2 && routeReachesTarget(state);
  const dockTitle = state.phase === 1 ? t.winFindTitle : t.winRouteTitle;

  // On a wide screen the in-turn controls live as a card at the top of the side
  // column, so the board itself gets the full height of the stage (much bigger
  // hexes, no wasted side margins). On mobile they stay as a thin bar docked
  // above the board.
  const dockNode = docked ? (
    <div
      className={
        "phasedock " +
        (isDesktop ? "pd-side" : state.phase === 1 ? "pd-find" : "pd-route") +
        // Phone: once the bottom "route ready" strip is up, it carries the
        // confirm/clear buttons — the docked bar hides its copies of them.
        (routeReady && !isDesktop ? " ready" : "")
      }
    >
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
        <div className="gstage-main" style={mainStyle}>
          {/* Mobile: a thin bar docked above the board (find & route stages) */}
          {!isDesktop && dockNode}

          {/* Phone held upright: one-time nudge that sideways shows a bigger board.
              Stays out of the guided tour's way. */}
          {!isDesktop && rotateTip && !state.tourActive && (
            <div className="rotate-tip">
              <span>{t.rotateHint}</span>
              <button className="rotate-tip-btn" onClick={dismissRotateTip}>
                {t.rotateHintClose}
              </button>
            </div>
          )}

          <div
            ref={scrollRef}
            className="hivewrap"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPan}
            onPointerCancel={endPan}
            onPointerLeave={endPan}
            style={isDesktop ? undefined : { touchAction: "none" }}
          >
            {isDesktop || !base ? (
              <HexBoard state={state} onHexClick={guardedHexClick} />
            ) : (
              <div
                ref={boardRef}
                className="boardpan"
                style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}
              >
                <HexBoard state={state} onHexClick={guardedHexClick} sizeStyle={boardSize} />
              </div>
            )}
          </div>

          {/* Mobile: drag the board with one finger, pinch with two, or use these
              buttons. Kept during the walk as well — the board area is at its
              smallest there, so being able to zoom in on the dog matters most. */}
          {!isDesktop && (
            <div className={"board-zoom" + (routeReady ? " lifted" : "")}>
              <button className="bz-btn" onClick={() => zoomBy(-0.3)} disabled={zoom <= ZMIN}
                aria-label={t.zoomOut} title={t.zoomOut}>−</button>
              {viewMoved && (
                <button className="bz-btn bz-reset" onClick={resetView}
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
          {/* Playing together, the helper is a window of its own on the screen of
              whoever is not playing — so it is not in this column as well. */}
          {mySeat === null && (
            <SidebarHelper
              key={state.pendingRoll?.expr ?? ""}
              t={t}
              state={state}
              actions={actions}
            />
          )}
        </aside>
      </div>

      {/* Route stage: once the route reaches the target, the confirm step comes
          to the front of the screen — the board stays live behind it. */}
      <RouteConfirm t={t} state={state} actions={actions} />

      {/* Playing together: helping a friend, on the screen of whoever is waiting. */}
      {mySeat !== null && (
        <OnlineHelper
          key={state.pendingRoll?.expr ?? ""}
          t={t}
          state={state}
          actions={actions}
          mySeat={mySeat}
        />
      )}

      {/* Walk stage: a movable panel floating beside the board — drag it by the
          title bar so the dog's progress along the route stays visible. */}
      {state.phase === 3 && (
        <WalkPanel t={t} state={state} actions={actions} onDock={noteWalkReserve} />
      )}
    </div>
  );
}
