"use client";

import { useEffect, useState } from "react";
import { DOGS } from "@/lib/engine/constants";
import type { GameState } from "@/lib/engine/types";
import type { GameActions } from "./useGame";
import type { Dict } from "@/lib/i18n";

/** How long the player in turn gets to try alone before anyone may help. */
const HOLD_MS = 12000;

/**
 * Helping a friend, in a game played together — on the screen of whoever is not
 * playing.
 *
 * On separate devices the old side-panel helper was useless: it never showed the
 * exercise the other player was actually solving, and it sat in a drawer nobody
 * opened. Here it comes to the front of the screen instead, with the exercise in
 * full size — and there is no "tap your name" step, because the device already
 * knows who you are.
 *
 * The wait matters as much as the window: it opens only after the player in turn
 * has had {@link HOLD_MS} to think, or the moment they answer wrong. Without that
 * pause the quickest child in the room answers every question within seconds, and
 * the one whose turn it is never gets to try.
 */
export default function OnlineHelper({
  t,
  state,
  actions,
  mySeat,
}: {
  t: Dict;
  state: GameState;
  actions: GameActions;
  mySeat: number;
}) {
  // The exercise the wait has already run out for. Mounting is keyed on the
  // exercise, so a new question always starts with an empty box and a fresh wait.
  const [waited, setWaited] = useState(false);
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);
  const [done, setDone] = useState(false);

  const expr = state.pendingRoll?.expr ?? null;

  useEffect(() => {
    if (!expr) return;
    const id = setTimeout(() => setWaited(true), HOLD_MS);
    return () => clearTimeout(id);
  }, [expr]);

  // Open once the wait is over — or the moment the player in turn answers wrong.
  const open = waited || state.wrongAnswerVisible;

  const active = state.players[state.cur];
  if (state.phase !== 3 || !state.pendingRoll || !active) return null;
  if (state.cur === mySeat) return null;
  if (done && !feedback) return null;

  const activeName = `${DOGS[state.cur]} ${active.name}`;

  if (!open && !feedback) {
    return <div className="onhelp-hold">{t.helperOnlineHold(active.name)}</div>;
  }

  const submit = () => {
    const v = parseInt(value, 10);
    if (Number.isNaN(v)) return;
    if (v === state.pendingRoll?.correct) {
      actions.awardSpectatorBonus(mySeat);
      setFeedback("ok");
      setTimeout(() => { setFeedback(null); setDone(true); }, 1800);
    } else {
      setFeedback("no");
      setTimeout(() => { setFeedback(null); setValue(""); }, 900);
    }
  };

  return (
    <div className="onhelp" role="dialog" aria-live="polite">
      {feedback === "ok" ? (
        <div className="helper-ok">{t.spectatorCorrect(state.players[mySeat]?.name ?? "")}</div>
      ) : (
        <>
          <div className="onhelp-title">{t.helperOnlineTitle(activeName)}</div>
          <div className="onhelp-expr" dir="ltr">{state.pendingRoll.expr} = ?</div>
          {state.helperSolvedBy ? (
            <div className="helper-ok">{t.spectatorCorrect(state.helperSolvedBy)}</div>
          ) : (
            <>
              <div className="ansinp">
                <input
                  type="number"
                  inputMode="numeric"
                  value={value}
                  placeholder={t.answerPlaceholder}
                  autoComplete="off"
                  style={feedback === "no" ? { borderColor: "var(--rd)", background: "#FEE2E2" } : undefined}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                />
                <button className="abt abg" onClick={submit}>{t.helperOnlineSend}</button>
              </div>
              {feedback === "no" && <div className="helper-no">{t.spectatorWrong}</div>}
            </>
          )}
        </>
      )}
    </div>
  );
}
