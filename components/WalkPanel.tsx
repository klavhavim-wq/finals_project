"use client";

import { useEffect, useRef, useState } from "react";
import ActionPanel from "./ActionPanel";
import type { GameState } from "@/lib/engine/types";
import type { GameActions } from "./useGame";
import type { Dict } from "@/lib/i18n";

/**
 * The walk-stage ("Go!") controls — dice and questions — as a compact panel that
 * floats beside the board instead of covering it, so the dog's progress along the
 * route stays in view. Drag it anywhere by its title bar. It mounts only during
 * the walk stage, so its position resets to the default spot each turn; a resize
 * or rotate also re-docks it (so a dragged panel can't end up stranded off-screen).
 */
export default function WalkPanel({
  t,
  state,
  actions,
  onDock,
}: {
  t: Dict;
  state: GameState;
  actions: GameActions;
  /** How much of the bottom edge this sheet covers, in pixels (0 when it floats). */
  onDock: (px: number | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef({ active: false, dx: 0, dy: 0 });
  const report = useRef<() => void>(() => {});

  // Tell the screen how much of the bottom edge this sheet really takes, so the
  // board gives up exactly that much and no more. It used to be told to give up
  // a flat 59% of the screen, which on the commonest phone left the board a
  // 157-pixel sliver with a 260-pixel empty gap under it. Dragged away from the
  // bottom, the sheet reserves nothing at all: it floats, and the board — which
  // can now be dragged — is pulled out from under it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const sitsOnBottom = window.innerHeight - r.bottom <= 24;
      onDock(sitsOnBottom ? Math.round(window.innerHeight - r.top + 6) : 0);
    };
    report.current = () => requestAnimationFrame(measure);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      onDock(null);
    };
  }, [onDock]);

  // Re-dock to the default spot whenever the window resizes or the phone rotates.
  useEffect(() => {
    const reset = () => setPos(null);
    window.addEventListener("resize", reset);
    window.addEventListener("orientationchange", reset);
    return () => {
      window.removeEventListener("resize", reset);
      window.removeEventListener("orientationchange", reset);
    };
  }, []);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    drag.current = { active: true, dx: e.clientX - r.left, dy: e.clientY - r.top };
    el.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (!d.active || !el) return;
    const w = el.offsetWidth, h = el.offsetHeight;
    const x = Math.max(6, Math.min(e.clientX - d.dx, window.innerWidth - w - 6));
    const y = Math.max(6, Math.min(e.clientY - d.dy, window.innerHeight - h - 6));
    setPos({ x, y });
    report.current();
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current.active = false;
    ref.current?.releasePointerCapture(e.pointerId);
    report.current();
  };

  return (
    <div
      ref={ref}
      className="phasewin pw-walk"
      style={pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto", transform: "none" } : undefined}
    >
      <div
        className="phasewin-head pw-drag"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <span className="phasewin-grip" aria-hidden="true">⠿</span>
        <span className="phasewin-title">{t.winWalkTitle}</span>
      </div>
      <div className="phasewin-body">
        <ActionPanel t={t} state={state} actions={actions} />
      </div>
    </div>
  );
}
