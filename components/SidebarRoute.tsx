"use client";

import RichText from "./RichText";
import { DC } from "@/lib/engine/constants";
import type { GameState } from "@/lib/engine/types";
import type { Dict } from "@/lib/i18n";

/**
 * Route-planning detail in the side bar (route stage only). Lists the chosen
 * hexes step by step — each step's door, its product range and pellet value —
 * plus the running total. Lives beside the board so the planning controls in
 * the docked bar stay minimal and never crowd the hexes.
 */
export default function SidebarRoute({ t, state }: { t: Dict; state: GameState }) {
  if (state.phase !== 2) return null;

  const steps = state.path.length;
  const pts = state.pathDoors.reduce((s, d) => s + DC[d].pts, 0);

  return (
    <div className="sq sq-route">
      <div className="sq-title">{t.winRouteTitle}</div>
      {steps === 0 ? (
        <div className="route-empty">{t.p2Empty}</div>
      ) : (
        <>
          <div className="pathlist">
            {state.path.map((h, i) => {
              const d = state.pathDoors[i];
              const dclass = d === "redlong" ? "redlong" : d;
              return (
                <div className="pstep" key={i}>
                  <div className="psnum">{i + 1}</div>
                  <div className="pshex">{t.stepHexLabel(h)}</div>
                  <RichText className={"psdoor " + dclass} html={t.pathDoorLabel(d, DC[d].pts)} />
                </div>
              );
            })}
          </div>
          <RichText className="rsum rsum-big" html={t.possiblePellets(pts, steps)} />
        </>
      )}
    </div>
  );
}
