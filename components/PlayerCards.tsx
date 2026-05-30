"use client";

import { DOGS } from "@/lib/engine/constants";
import type { GameState } from "@/lib/engine/types";
import type { Dict } from "@/lib/i18n";

export default function PlayerCards({ t, state }: { t: Dict; state: GameState }) {
  const coop = state.settings.coop;
  const pct = Math.min(100, Math.round(state.sharedTokens));

  return (
    <div id="pcards">
      {coop && (
        <div
          className="pcard"
          style={{
            borderInlineEndColor: "#10B981",
            background: "linear-gradient(135deg,#F0FDF4,#DCFCE7)",
            marginBottom: 4,
          }}
        >
          <div className="pchead">
            <div className="pcname" style={{ color: "#065F46" }}>
              {t.sharedBank}
            </div>
            <div className="pchon" style={{ color: "#10B981" }}>
              🦴{state.sharedTokens}
            </div>
          </div>
          <div
            style={{
              marginTop: 6,
              background: "#d1fae5",
              borderRadius: 6,
              height: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: pct + "%",
                background: "#10B981",
                borderRadius: 6,
                transition: "width .4s",
              }}
            />
          </div>
          <div
            style={{ fontSize: ".7rem", color: "#065F46", marginTop: 3, textAlign: "center" }}
          >
            {t.sharedProgress(state.sharedTokens)}
          </div>
        </div>
      )}
      {state.players.map((p, i) => (
        <div className={"pcard" + (i === state.cur ? " cur" : "")} key={i}>
          <div className="pchead">
            <div className="pcname" style={{ color: p.color }}>
              {i === state.cur ? "▶ " : ""}
              {DOGS[i]} {p.name}
            </div>
            {!coop && <div className="pchon">🦴{p.tokens}</div>}
          </div>
          <div className="pcpos">{t.hexLabel(p.hex)}</div>
        </div>
      ))}
    </div>
  );
}
