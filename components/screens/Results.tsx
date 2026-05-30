"use client";

import { useState } from "react";
import type { SessionRecord } from "@/lib/engine/types";
import type { GameActions } from "../useGame";
import { DOGS } from "@/lib/engine/constants";
import { MEDALS, type Dict } from "@/lib/i18n";

const LS_KEY = "kaskash_sessions";

function loadSessions(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function Results({ t, actions }: { t: Dict; actions: GameActions }) {
  const [sessions, setSessions] = useState<SessionRecord[]>(loadSessions);

  const clearAll = () => {
    localStorage.removeItem(LS_KEY);
    setSessions([]);
  };

  const downloadCSV = () => {
    const lines: string[] = ["תאריך,רמה,שיתופי,שחקן,ניקוד,טעויות"];
    for (const s of sessions) {
      for (const p of s.players) {
        const row = [
          formatDate(s.date),
          s.level,
          s.coop ? "כן" : "לא",
          p.name,
          p.tokens,
          p.errors ?? 0,
        ].join(",");
        lines.push(row);
      }
    }
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kaskash_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="sresults" className="screen active">
      <div className="stitle">{t.resultsTitle}</div>

      {sessions.length === 0 ? (
        <div className="scard" style={{ textAlign: "center", color: "#6b7280", padding: "24px 16px" }}>
          {t.noResults}
        </div>
      ) : (
        sessions.map((session) => (
          <div key={session.id} className="scard">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
                fontSize: ".82rem",
                color: "#6b7280",
              }}
            >
              <span>{formatDate(session.date)}</span>
              <span>
                {t.levels[session.level].icon} {t.levels[session.level].name}
                {session.coop ? " · 🤝" : ""}
              </span>
            </div>

            {!session.coop && session.winnerName && (
              <div style={{ fontWeight: 700, fontSize: ".9rem", marginBottom: 6 }}>
                🏆 {session.winnerName}
              </div>
            )}

            {session.coop ? (
              <>
                {session.sharedTokens !== undefined && (
                  <div className="wsrow" style={{ fontWeight: 700, marginBottom: 4 }}>
                    <span>{t.coopTeamwork}</span>
                    <span>{session.sharedTokens}🦴</span>
                  </div>
                )}
                {session.players.map((p, i) => (
                  <div key={i} className="wsrow">
                    <span>
                      {DOGS[i] ?? "🐕"} {p.name}
                    </span>
                    <span style={{ color: "#ef4444", fontSize: ".88rem" }}>
                      {p.errors ?? 0} ❌
                    </span>
                  </div>
                ))}
              </>
            ) : (
              [...session.players]
                .sort((a, b) => b.tokens - a.tokens)
                .map((p, i) => (
                  <div key={i} className="wsrow">
                    <span>
                      {MEDALS[i]} {p.name}
                    </span>
                    <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span>{p.tokens}🦴</span>
                      <span style={{ color: "#ef4444", fontSize: ".88rem" }}>
                        {p.errors ?? 0} ❌
                      </span>
                    </span>
                  </div>
                ))
            )}
          </div>
        ))
      )}

      <div className="sacts">
        <button className="btnout" onClick={() => actions.showScreen("sw")}>
          {t.back}
        </button>
        {sessions.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btnout" onClick={downloadCSV}>
              {t.downloadResults}
            </button>
            <button
              className="btnout"
              style={{ color: "#ef4444", borderColor: "#ef4444" }}
              onClick={clearAll}
            >
              {t.clearResults}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const dd = d.getDate().toString().padStart(2, "0");
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = d.getHours().toString().padStart(2, "0");
    const min = d.getMinutes().toString().padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  } catch {
    return iso;
  }
}
