"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import RichText from "./RichText";
import type { Dict, TourStage, TourTarget } from "@/lib/i18n";
import type { GameState } from "@/lib/engine/types";
import type { GameActions } from "./useGame";

/** Which on-screen element each tour step spotlights. */
const SELECTORS: Record<TourTarget, string | null> = {
  board: ".hivewrap",
  panel: ".phasewin, .phasedock",
  sidebar: ".sq-bank",
  doors: ".hivewrap",
  header: ".ghdr",
  center: null,
};

/**
 * Which live phase to drive the sample game into for a step, keyed by its icon
 * (icons are identical across languages). Route-building steps show phase 2 with
 * a real route; the "set off" step shows phase 3 with a question and the clock.
 */
const STAGE_BY_ICON: Record<string, TourStage> = {
  "🐾": "route",
  "🧠": "route",
  "🧩": "route", // factoring: gold factor tiles on the board (phase 2)
  "🦴": "walk",
  "🙋": "walk", // spectator helping (phase 3 panel)
};

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const MARGIN = 14;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(v, hi));
}

/**
 * Place the popup beside the highlighted area (in the side with the most room)
 * so the spotlighted element stays visible. Falls back to above/below, then to
 * the largest gap clamped into the viewport. Centered when nothing is highlighted.
 */
function computeCardStyle(
  rect: Rect | null,
  size: { w: number; h: number },
  vw: number,
  vh: number
): React.CSSProperties {
  const { w, h } = size;
  if (!rect) {
    return { left: Math.round((vw - w) / 2), top: Math.round((vh - h) / 2) };
  }
  const gapLeft = rect.left;
  const gapRight = vw - (rect.left + rect.width);
  const gapTop = rect.top;
  const gapBottom = vh - (rect.top + rect.height);
  const needW = w + MARGIN * 2;
  const needH = h + MARGIN * 2;
  const vTop = clamp(rect.top + rect.height / 2 - h / 2, MARGIN, vh - h - MARGIN);
  const hLeft = clamp(rect.left + rect.width / 2 - w / 2, MARGIN, vw - w - MARGIN);

  const candidates = [
    { fits: gapRight >= needW, room: gapRight, left: rect.left + rect.width + MARGIN, top: vTop },
    { fits: gapLeft >= needW, room: gapLeft, left: rect.left - w - MARGIN, top: vTop },
    { fits: gapBottom >= needH, room: gapBottom, left: hLeft, top: rect.top + rect.height + MARGIN },
    { fits: gapTop >= needH, room: gapTop, left: hLeft, top: rect.top - h - MARGIN },
  ];
  const fitting = candidates.filter((c) => c.fits).sort((a, b) => b.room - a.room);
  const pick = fitting[0] ?? [...candidates].sort((a, b) => b.room - a.room)[0];
  return {
    left: Math.round(clamp(pick.left, MARGIN, vw - w - MARGIN)),
    top: Math.round(clamp(pick.top, MARGIN, vh - h - MARGIN)),
  };
}

export default function GuidedTour({
  t,
  state,
  actions,
}: {
  t: Dict;
  state: GameState;
  actions: GameActions;
}) {
  const steps = t.tour(state.level);
  const idx = Math.min(Math.max(state.tourStep, 0), steps.length - 1);
  const step = steps[idx];
  const isLast = idx === steps.length - 1;
  const selector = SELECTORS[step.target];
  const interact = step.interact ?? null;

  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardSize, setCardSize] = useState({ w: 340, h: 300 });
  const [solved, setSolved] = useState(false);

  // Live exercise the player should solve in a hands-on step.
  const liveExpr =
    interact === "find" ? state.card?.ex : interact === "answer" ? state.pendingRoll?.expr : null;

  // Measure the popup so it can be placed beside (not over) the highlighted area.
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    setCardSize({ w: el.offsetWidth, h: el.offsetHeight });
  }, [idx, state.phase]);

  // The live phase a given step demonstrates (icons are language-agnostic).
  const stageFor = (i: number): TourStage =>
    steps[i]?.stage ?? STAGE_BY_ICON[steps[i]?.i ?? ""] ?? "find";

  useLayoutEffect(() => {
    const measure = () => {
      if (!selector) {
        setRect(null);
        return;
      }
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      // Bring the spotlighted element into view before measuring so the popup
      // isn't placed over empty space when the target is below the fold.
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        setRect(null);
        return;
      }
      const pad = 6;
      setRect({
        top: r.top - pad,
        left: r.left - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      });
    };
    measure();
    // The panel's size/position settles after the phase change re-renders —
    // re-measure shortly after so the spotlight lands in the right place.
    const tid = window.setTimeout(measure, 80);
    const tid2 = window.setTimeout(measure, 220);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(tid);
      window.clearTimeout(tid2);
      window.removeEventListener("resize", measure);
    };
  }, [selector, idx, state.phase, state.path.length]);

  const go = (d: number) => {
    const next = idx + d;
    if (next < 0) return;
    if (next >= steps.length) {
      actions.tourEnd();
      return;
    }
    actions.demoStage(stageFor(next));
    actions.tourSet(next);
  };

  // Stable "advance one step" for the auto-advance timer (doesn't churn on render).
  const idxRef = useRef(idx);
  idxRef.current = idx;
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const { setTourInteract, demoStage, tourSet, tourEnd: endTour } = actions;
  const advance = useCallback(() => {
    const i = idxRef.current;
    const st = stepsRef.current;
    const next = i + 1;
    if (next >= st.length) {
      endTour();
      return;
    }
    const stg = st[next]?.stage ?? STAGE_BY_ICON[st[next]?.i ?? ""] ?? "find";
    demoStage(stg);
    tourSet(next);
  }, [demoStage, tourSet, endTour]);

  // Tell the engine whether this step needs the player to really act, and reset
  // the "solved" celebration when the step changes.
  useEffect(() => {
    setSolved(false);
    setTourInteract(interact);
  }, [idx, interact, setTourInteract]);

  // Detect that the player completed the hands-on action, then move on.
  useEffect(() => {
    if (!interact) return;
    const done = interact === "find" ? state.targetHex != null : state.mcCorrect != null;
    if (!done) return;
    setSolved(true);
    const id = window.setTimeout(advance, 1400);
    return () => window.clearTimeout(id);
  }, [interact, state.targetHex, state.mcCorrect, advance]);

  const { tourEnd } = actions;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") tourEnd();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tourEnd]);

  // Place the popup beside the highlighted area so both stay visible.
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const cardStyle = computeCardStyle(rect, cardSize, vw, vh);

  return (
    <div className="tour-layer">
      {/* Blocks interaction with the live sample game — except during a hands-on
          step, where the player needs to click the real board/panel. */}
      <div
        className="tour-blocker"
        style={{
          background: rect ? "transparent" : "rgba(15,23,42,.6)",
          pointerEvents: interact ? "none" : "auto",
        }}
      />

      {rect && (
        <div
          className="tour-spot"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}

      <div className="tour-card" ref={cardRef} style={cardStyle} role="dialog" aria-modal="true">
        <button className="tour-close" onClick={actions.tourEnd} title={t.tourExit} aria-label={t.tourExit}>
          ✕
        </button>
        <div className="tour-ico">{step.i}</div>
        <div className="tour-titl">{step.t}</div>
        <RichText className="tour-text" html={step.x} />
        {interact &&
          (solved ? (
            <div className="tour-try done">{t.tourSolved}</div>
          ) : (
            liveExpr && (
              <div className="tour-try">
                <span className="tour-try-lbl">{t.tourYourTurn}</span>
                <span className="mathex tour-try-ex">{liveExpr} = ?</span>
              </div>
            )
          ))}
        <div className="tour-nav">
          <button
            className="iback"
            style={{ visibility: idx ? "visible" : "hidden" }}
            onClick={() => go(-1)}
          >
            {t.back}
          </button>
          <div style={{ display: "flex", gap: 5 }}>
            {steps.map((_, i) => (
              <div
                key={i}
                className={"idot" + (i === idx ? " on" : "")}
                onClick={() => {
                  actions.demoStage(stageFor(i));
                  actions.tourSet(i);
                }}
              />
            ))}
          </div>
          <button className="ibtn" onClick={() => go(1)}>
            {isLast ? t.tourFinish : t.next}
          </button>
        </div>
      </div>
    </div>
  );
}
