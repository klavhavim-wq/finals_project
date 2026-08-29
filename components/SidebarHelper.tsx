"use client";

import { useEffect, useState } from "react";
import { DOGS } from "@/lib/engine/constants";
import type { GameState } from "@/lib/engine/types";
import type { GameActions } from "./useGame";
import type { Dict } from "@/lib/i18n";

/** How long the player in turn gets to try alone before anyone may help. */
const HOLD_MS = 12000;

/**
 * The "a friend helps" feature, in the side bar. While the active player works
 * on a walk-stage question, any other player can tap their name and try to
 * answer for a +1 pellet bonus. Lives off to the side so it never crowds the
 * exercise window.
 *
 * It stays shut for the first {@link HOLD_MS} of each question — or until the
 * player in turn answers wrong — so helping stays helping instead of becoming a
 * race the quickest child always wins.
 */
export default function SidebarHelper({
  t,
  state,
  actions,
}: {
  t: Dict;
  state: GameState;
  actions: GameActions;
}) {
  const [claim, setClaim] = useState<number | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);
  // Mounting is keyed on the current question, so each one starts with a fresh
  // wait and an empty box.
  const [waited, setWaited] = useState(false);
  const expr = state.pendingRoll?.expr ?? null;

  useEffect(() => {
    if (!expr) return;
    const id = setTimeout(() => setWaited(true), HOLD_MS);
    return () => clearTimeout(id);
  }, [expr]);

  // Open once the wait is over — or the moment the player in turn answers wrong.
  const open = waited || state.wrongAnswerVisible;

  const others = state.players.map((p, i) => ({ p, i })).filter(({ i }) => i !== state.cur);
  if (state.phase !== 3 || others.length === 0) return null;
  const activeName = state.players[state.cur]?.name ?? "";

  const handleAnswer = () => {
    if (claim === null) return;
    const v = parseInt(inputVal, 10);
    if (isNaN(v)) return;
    if (state.pendingRoll && v === state.pendingRoll.correct) {
      actions.awardSpectatorBonus(claim);
      setFeedback("ok");
      setTimeout(() => { setFeedback(null); setClaim(null); setInputVal(""); }, 1800);
    } else {
      setFeedback("no");
      setTimeout(() => { setFeedback(null); setClaim(null); setInputVal(""); }, 900);
    }
  };

  return (
    <div className="sq sq-helper">
      <div className="sq-title">{t.helperTitle}</div>
      {!state.pendingRoll ? (
        <div className="helper-wait">{t.helperWaiting}</div>
      ) : !open && !feedback ? (
        <div className="helper-wait">{t.helperOnlineHold(activeName)}</div>
      ) : feedback === "ok" && claim !== null ? (
        <div className="helper-ok">{t.spectatorCorrect(state.players[claim].name)}</div>
      ) : feedback === "no" ? (
        <div className="helper-no">{t.spectatorWrong}</div>
      ) : claim === null ? (
        <>
          <div className="helper-prompt">{t.spectatorPrompt}</div>
          <div className="helper-names">
            {others.map(({ p, i }) => (
              <button
                key={i}
                className="abt abgr helper-name"
                onClick={() => { setClaim(i); setInputVal(""); }}
              >
                {DOGS[i]} {p.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="helper-prompt">{t.spectatorAnswerFor(state.players[claim].name)}</div>
          <div className="ansinp">
            <input
              type="number"
              inputMode="numeric"
              value={inputVal}
              autoFocus
              placeholder={t.answerPlaceholder}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAnswer(); }}
            />
            <button className="abt abg" onClick={handleAnswer}>✓</button>
          </div>
          <button className="abt abgr helper-cancel" onClick={() => { setClaim(null); setInputVal(""); }}>
            {t.cancel}
          </button>
        </>
      )}
    </div>
  );
}
