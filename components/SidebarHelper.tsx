"use client";

import { useState } from "react";
import type { GameState } from "@/lib/engine/types";
import type { GameActions } from "./useGame";
import type { Dict } from "@/lib/i18n";

/**
 * The "a friend helps" feature, in the side bar. While the active player works
 * on a walk-stage question, any other player can tap their name and try to
 * answer for a +1 pellet bonus. Lives off to the side so it never crowds the
 * exercise window.
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

  const others = state.players.map((p, i) => ({ p, i })).filter(({ i }) => i !== state.cur);
  if (state.phase !== 3 || others.length === 0) return null;

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
                {p.name}
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
