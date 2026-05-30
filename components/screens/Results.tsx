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
        lines.push(
          [formatDate(s.date), s.level, s.coop ? "כן" : "לא", p.name, p.tokens, p.errors ?? 0].join(",")
        );
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
        <div
          className="rcardwrap"
          style={{ padding: "28px 18px", textAlign: "center", color: "#9ca3af", fontSize: "1rem" }}
        >
          {t.noResults}
        </div>
      ) : (
        sessions.map((session) => {
          const sorted = [...session.players].sort((a, b) => b.tokens - a.tokens);
          return (
            <div key={session.id} className="rcardwrap">
              {/* Card header */}
              <div className="rchead">
                <span className="rclevel">
                  {t.levels[session.level].icon} {t.levels[session.level].name}
                  {session.coop && <span style={{ opacity: .7, fontWeight: 600 }}>· 🤝</span>}
                </span>
                <span className="rcdate">{formatDate(session.date)}</span>
              </div>

              {/* Player rows */}
              <div className="rcbody">
                {session.coop ? (
                  <>
                    {session.sharedTokens !== undefined && (
                      <div className="rccoopbank">
                        <span>{t.coopTeamwork}</span>
                        <span>{session.sharedTokens} 🦴</span>
                      </div>
                    )}
                    {session.players.map((p, i) => (
                      <div key={i} className="rcrow">
                        <span className="rcname">
                          {DOGS[i] ?? "🐕"} {p.name}
                        </span>
                        <span className="rcstats">
                          <span className="rcerr">{p.errors ?? 0} ❌</span>
                        </span>
                      </div>
                    ))}
                  </>
                ) : (
                  sorted.map((p, i) => (
                    <div key={i} className="rcrow">
                      <span className={`rcname${i === 0 ? " top" : ""}`}>
                        {MEDALS[i]} {p.name}
                      </span>
                      <span className="rcstats">
                        <span className="rcscore">{p.tokens} 🦴</span>
                        <span className="rcerr">{p.errors ?? 0} ❌</span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Action buttons */}
      <div className="sacts" style={{ flexWrap: "wrap" }}>
        <button className="btnout" onClick={() => actions.showScreen("sw")}>
          {t.back}
        </button>
        {sessions.length > 0 && (
          <>
            <button className="btnout" onClick={downloadCSV}>
              {t.downloadResults}
            </button>
            <button
              className="btnout"
              style={{ color: "#ef4444", borderColor: "#FECACA" }}
              onClick={clearAll}
            >
              {t.clearResults}
            </button>
          </>
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
