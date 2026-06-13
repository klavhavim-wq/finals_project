"use client";

import { useLayoutEffect, useState } from "react";
import RichText from "./RichText";
import type { Dict, TourTarget } from "@/lib/i18n";
import type { GameState } from "@/lib/engine/types";
import type { GameActions } from "./useGame";

/** Which on-screen element each tour step spotlights. */
const SELECTORS: Record<TourTarget, string | null> = {
  board: ".hivewrap",
  panel: ".floatpanel",
  sidebar: ".sidebar",
  doors: "#door-legend",
  header: ".ghdr",
  center: null,
};

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
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

  const [rect, setRect] = useState<Rect | null>(null);

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
    // The floating action panel settles its position in an effect after mount —
    // re-measure shortly after so the spotlight lands in the right place.
    const tid = window.setTimeout(measure, 80);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(tid);
      window.removeEventListener("resize", measure);
    };
  }, [selector, idx]);

  const go = (d: number) => {
    const next = idx + d;
    if (next < 0) return;
    if (next >= steps.length) {
      actions.tourEnd();
      return;
    }
    actions.tourSet(next);
  };

  // Place the popup so it doesn't sit on top of the highlighted area.
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  let cardStyle: React.CSSProperties;
  if (!rect) {
    cardStyle = { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  } else if (rect.top + rect.height > vh * 0.62) {
    // Highlighted area is low on screen → put the card up top.
    cardStyle = { top: 20, left: "50%", transform: "translateX(-50%)" };
  } else {
    // Highlighted area is high/middle → put the card near the bottom.
    cardStyle = { bottom: 24, left: "50%", transform: "translateX(-50%)" };
  }

  return (
    <div className="tour-layer">
      {/* Blocks interaction with the live sample game behind the tour. */}
      <div
        className="tour-blocker"
        style={{ background: rect ? "transparent" : "rgba(15,23,42,.6)" }}
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

      <div className="tour-card" style={cardStyle}>
        <button className="tour-close" onClick={actions.tourEnd} title={t.tourExit}>
          ✕
        </button>
        <div className="tour-ico">{step.i}</div>
        <div className="tour-titl">{step.t}</div>
        <RichText className="tour-text" html={step.x} />
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
                onClick={() => actions.tourSet(i)}
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
