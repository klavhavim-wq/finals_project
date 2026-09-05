"use client";

import { DC, LVL_DOORS, PELLET } from "@/lib/engine/constants";
import type { DoorKey, GameState } from "@/lib/engine/types";
import type { Dict } from "@/lib/i18n";

/** Short product-range label for a door (e.g. "4–20" or "11–19 × 2–9"). */
function doorRange(d: DoorKey): string {
  const dc = DC[d];
  if (dc.ranges) return `${dc.ranges[0][0]}–${dc.ranges[0][1]} × ${dc.ranges[1][0]}–${dc.ranges[1][1]}`;
  if (dc.band) return `${dc.band[0]}–${dc.band[1]}`;
  return `${dc.min}–${dc.max}`;
}

/** N little pellet (kibble) dots — the visual "this door pays N pellets". */
function Pellets({ n }: { n: number }) {
  return (
    <span className="prize-kibbles">
      {Array.from({ length: Math.min(n, 12) }, (_, i) => (
        <span key={i} className="kibble">{PELLET}</span>
      ))}
    </span>
  );
}

/** The door's colour as a plain swatch — what identifies a door on the board. */
function Swatch({ d, big }: { d: DoorKey; big?: boolean }) {
  return (
    <span
      className={"door-swatch" + (big ? " big" : "")}
      style={{ background: DC[d].color }}
      aria-hidden="true"
    />
  );
}

/**
 * The door's line exactly as it is drawn between hexes — same colour, same dash
 * pattern. The legend has to show the pattern too, or the pattern on the board
 * is a code with no key for anyone who cannot use the colour.
 */
const DOOR_DASH: Record<DoorKey, string | undefined> = {
  blue: undefined,
  purple: "14 5",
  yellow: "7 5",
  red: "2.5 4.5",
  redlong: "13 4 2.5 4",
};

function DoorLine({ d }: { d: DoorKey }) {
  return (
    <svg viewBox="0 0 44 8" width="44" height="8" style={{ display: "block", flexShrink: 0 }} aria-hidden="true">
      <line
        x1="1"
        y1="4"
        x2="43"
        y2="4"
        stroke={DC[d].color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={DOOR_DASH[d]}
      />
    </svg>
  );
}

export default function StepPrize({ t, state }: { t: Dict; state: GameState }) {
  const doors = [...new Set(LVL_DOORS[state.level])];
  const walking = state.phase === 3;
  const curDoor = walking ? state.pathDoors[state.stepIdx] ?? null : null;

  return (
    <div className="sq sq-prize" id="door-legend">
      <div className="sq-title">{walking ? t.stepPrizeTitle : t.doorMenuTitle}</div>

      {curDoor && (
        <div className="prize-hero" style={{ borderColor: DC[curDoor].color, background: DC[curDoor].color + "14" }}>
          <div className="prize-hero-food"><Swatch d={curDoor} big /></div>
          <div className="prize-hero-info">
            <div className="prize-hero-name" style={{ color: DC[curDoor].color }}>{t.doorLabel(curDoor)}</div>
            <Pellets n={DC[curDoor].pts} />
            <div className="prize-hero-worth">= {t.pelletsUnit(DC[curDoor].pts)}</div>
          </div>
        </div>
      )}

      {/* The colour → difficulty → prize link, said once above the list. Only
          worth saying when the level actually has more than one door. */}
      {doors.length > 1 && <div className="prize-lead">{t.doorMenuLead}</div>}

      <div className="prize-menu">
        {doors.map((d) => {
          const dc = DC[d];
          const active = d === curDoor;
          return (
            <div
              key={d}
              className={"prizerow" + (active ? " active" : "")}
              style={{ borderInlineStartColor: dc.color, background: active ? dc.color + "12" : undefined }}
            >
              <span className="prizerow-ico"><DoorLine d={d} /></span>
              <div className="prizerow-mid">
                <div className="prizerow-name">{t.doorLabel(d)}</div>
                {/* How hard it is, in words — the number range alone never said so */}
                <div className="prizerow-diff">{t.doorDifficulty(d)}</div>
                <div className="prizerow-range" dir="ltr">{doorRange(d)}</div>
              </div>
              <span className="prizerow-val" style={{ color: dc.color, borderColor: dc.color }}>
                {dc.pts} {PELLET}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
