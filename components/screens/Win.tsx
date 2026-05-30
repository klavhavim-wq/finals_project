"use client";

import { DOGS } from "@/lib/engine/constants";
import type { GameState } from "@/lib/engine/types";
import type { GameActions } from "../useGame";
import { MEDALS, type Dict } from "@/lib/i18n";

const COINS = ["🦴", "🌭", "🍗", "🐟", "🥩", "🎾", "🦴", "🍖", "🦴", "🌭", "🍗", "🐾", "🦴", "🍗", "🥩", "🐾"];

export default function Win({
  t,
  state,
  actions,
}: {
  t: Dict;
  state: GameState;
  actions: GameActions;
}) {
  const coop = state.coopWin;
  const winnerDog = coop || state.winnerIdx === null ? "🐕" : DOGS[state.winnerIdx];
  const winnerName = coop
    ? t.coopWinName
    : state.winnerIdx !== null
      ? state.players[state.winnerIdx].name + t.winnerSuffix
      : "";
  const sorted = [...state.players].sort((a, b) => b.tokens - a.tokens);

  return (
    <div id="swin" className="screen active">
      <div className="wcreature">
        <span className="wfood l">🍖</span>
        <span className="wdoghappy">{winnerDog}</span>
        <span className="wfood r">🎾</span>
      </div>
      <div className="wcoins">
        {COINS.map((c, i) => (
          <span className="wcoin" key={i}>
            {c}
          </span>
        ))}
      </div>
      <div className="wtitle">{coop ? t.coopWinTitle : t.winnerTitle}</div>
      <div className="wname">{winnerName}</div>
      <div className="wscores">
        {coop ? (
          <>
            <div className="wsrow">
              <span>{t.coopTeamwork}</span>
              <span>{t.coopTogether(state.sharedTokens)}</span>
            </div>
            {state.players.map((p, i) => (
              <div className="wsrow" key={i}>
                <span>
                  {DOGS[i]} {p.name}
                </span>
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span>📍{p.hex}</span>
                  <span style={{ color: "#ef4444", fontSize: ".88rem" }}>{p.errors} ❌</span>
                </span>
              </div>
            ))}
          </>
        ) : (
          sorted.map((p, i) => (
            <div className="wsrow" key={i}>
              <span>
                {MEDALS[i]} {p.name}
              </span>
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span>{p.tokens}🦴</span>
                <span style={{ color: "#ef4444", fontSize: ".88rem" }}>{p.errors} ❌</span>
              </span>
            </div>
          ))
        )}
      </div>
      <div style={{ fontSize: ".8rem", color: "#6b7280", textAlign: "center", marginTop: 10 }}>
        {t.resultsSaved}
      </div>
      <button className="btnout" style={{ marginTop: 8 }} onClick={() => actions.showScreen("sresults")}>
        {t.viewResultsBtn}
      </button>
      <button className="btnbig" style={{ marginTop: 8 }} onClick={() => actions.showScreen("sw")}>
        {t.newGameBtn}
      </button>
    </div>
  );
}
