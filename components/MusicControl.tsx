"use client";

import { useEffect, useRef, useState } from "react";
import type { Dict } from "@/lib/i18n";

/** The speaker pill in the top bar. Tapping the speaker silences the music;
 *  the little arrow beside it opens a slider for finer control. */
export default function MusicControl({
  t,
  muted,
  volume,
  onToggle,
  onVolume,
}: {
  t: Dict;
  muted: boolean;
  volume: number;
  onToggle: () => void;
  onVolume: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Close the slider when the player clicks elsewhere or presses Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const muteLabel = muted ? t.musicOff : t.musicOn;
  const pct = Math.round(volume * 100);

  return (
    <div className="musicctl" ref={wrap}>
      <div className="musicpill">
        <button
          type="button"
          className="mp-icon"
          onClick={onToggle}
          aria-label={muteLabel}
          title={muteLabel}
          aria-pressed={muted}
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <button
          type="button"
          className="mp-arrow"
          onClick={() => setOpen((o) => !o)}
          aria-label={t.musicVolume}
          title={t.musicVolume}
          aria-expanded={open}
        >
          ▾
        </button>
      </div>

      {open && (
        <div className="musicpop">
          <span className="mp-lbl">{t.musicVolume}</span>
          <div className="mp-row">
            <span aria-hidden="true">🔈</span>
            <input
              type="range"
              className="mp-range"
              min={0}
              max={100}
              step={1}
              value={pct}
              onChange={(e) => onVolume(Number(e.target.value) / 100)}
              aria-label={t.musicVolume}
            />
            <span aria-hidden="true">🔊</span>
          </div>
          <span className="mp-pct">{pct}%</span>
        </div>
      )}
    </div>
  );
}
