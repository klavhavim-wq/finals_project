"use client";

import { DC, DOOR_ICON, LVL_DOORS, PELLET } from "@/lib/engine/constants";
import type { DoorKey, GameState } from "@/lib/engine/types";
import type { Dict } from "@/lib/i18n";

/** Short product-range label for a door (e.g. "4–20" or "11–19 × 2–9"). */
function doorRange(d: DoorKey): string {
  const dc = DC[d];
  if (dc.ranges) return `${dc.ranges[0][0]}–${dc.ranges[0][1]} × ${dc.ranges[1][0]}–${dc.ranges[1][1]}`;
  if (dc.band) return `${dc.band[0]}–${dc.band[1]}`;
  return `${dc.min}–${dc.max}`;
}

/** N little pellet (kibble) dots — the visual "this food holds N pellets". */
function Pellets({ n }: { n: number }) {
  return (
    <span className="prize-kibbles">
      {Array.from({ length: Math.min(n, 12) }, (_, i) => (
        <span key={i} className="kibble">{PELLET}</span>
      ))}
    </span>
  );
}

export default function StepPrize({ t, state }: { t: Dict; state: GameState }) {
  const doors = [...new Set(LVL_DOORS[state.level])];
  const walking = state.phase === 3;
  const curDoor = walking ? state.pathDoors[state.stepIdx] ?? null : null;

  const nameOf = (d: DoorKey) => t.doorLabel(d).split(" ").slice(1).join(" ");

  return (
    <div className="sq sq-prize" id="door-legend">
      <div className="sq-title">{walking ? t.stepPrizeTitle : t.foodMenuTitle}</div>

      {curDoor && (
        <div className="prize-hero" style={{ borderColor: DC[curDoor].color, background: DC[curDoor].color + "14" }}>
          <div className="prize-hero-food">{DOOR_ICON[curDoor]}</div>
          <div className="prize-hero-info">
            <div className="prize-hero-name" style={{ color: DC[curDoor].color }}>{nameOf(curDoor)}</div>
            <Pellets n={DC[curDoor].pts} />
            <div className="prize-hero-worth">= {t.pelletsUnit(DC[curDoor].pts)}</div>
          </div>
        </div>
      )}

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
              <span className="prizerow-ico">{DOOR_ICON[d]}</span>
              <div className="prizerow-mid">
                <div className="prizerow-name">{nameOf(d)}</div>
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
