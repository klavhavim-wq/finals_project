"use client";

import RichText from "./RichText";
import { DC } from "@/lib/engine/constants";
import { routeReachesTarget } from "@/lib/engine/gameReducer";
import type { GameState } from "@/lib/engine/types";
import type { GameActions } from "./useGame";
import type { Dict } from "@/lib/i18n";

/**
 * "Your route is ready" — the confirm step, brought to the front of the screen.
 *
 * Route planning happens on the board, but the confirm button used to sit in the
 * side column, far from where the eyes are; children built a route and then had
 * no idea how to set off. So the moment a route actually reaches the target, this
 * window appears in front: how many steps, how many pellets, and one big green
 * button.
 *
 * It deliberately has no dark backdrop and does not block the board: tapping more
 * hexes keeps editing the route and the window follows along, and it disappears
 * again if the route stops reaching the target.
 *
 * Placement (see globals.css): bottom-center over the board on a computer, a
 * full-width strip rising from the bottom edge — thumb height — on a phone.
 */
export default function RouteConfirm({
  t,
  state,
  actions,
}: {
  t: Dict;
  state: GameState;
  actions: GameActions;
}) {
  if (state.phase !== 2 || !routeReachesTarget(state)) return null;

  const steps = state.path.length;
  const pts = state.pathDoors.reduce((s, d) => s + DC[d].pts, 0);

  return (
    <div className="routeconfirm" role="dialog" aria-live="polite">
      <div className="rc-title">{t.routeReadyTitle}</div>
      <RichText className="rc-line" html={t.routeReadyLine(pts, steps)} />
      <div className="rc-btns">
        <button className="abt abg rc-go" onClick={actions.confirmPath}>
          {t.confirmRoute}
        </button>
        <button className="abt abgr rc-clear" onClick={actions.clearPath}>
          {t.clearRoute}
        </button>
      </div>
    </div>
  );
}
