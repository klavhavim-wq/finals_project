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
    const lines: string[] = [];

    lines.push("--- סיכום משחקים ---");
    lines.push("תאריך,מזהה,רמה,שיתופי,טיימר,בחירה,שוד,תנאי_ניצחון,מנצח,גרגירים_משותפים");
    for (const s of sessions) {
      const st = s.settings;
      lines.push([
        formatDate(s.date), s.id, s.level, s.coop ? "כן" : "לא",
        st?.timer ? "כן" : "לא", st?.mc ? "כן" : "לא", st?.rob ? "כן" : "לא", st?.winMode ?? "",
        s.winnerName ?? (s.coop ? "כולם" : ""), s.sharedTokens ?? "",
      ].join(","));
    }

    lines.push("");
    lines.push("--- תוצאות שחקנים ---");
    lines.push("תאריך,מזהה_משחק,שחקן,ניקוד,שגיאות");
    for (const s of sessions) {
      for (const p of s.players) {
        lines.push([formatDate(s.date), s.id, p.name, p.tokens, p.errors ?? 0].join(","));
      }
    }

    lines.push("");
    lines.push("--- יומן שגיאות ---");
    lines.push("תאריך,מזהה_משחק,שחקן,שלב,תרגיל,תשובה_נכונה,תשובה_שגויה");
    for (const s of sessions) {
      for (const p of s.players) {
        for (const e of p.errorLog ?? []) {
          lines.push([
            formatDate(s.date), s.id, p.name,
            e.phase === 1 ? "שלב1-יעד" : "שלב3-דרך",
            e.expr, e.correct, e.wrong,
          ].join(","));
        }
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
    <div
      id="sresults"
      className="screen active"
      style={{
        alignItems: "center",
        padding: "22px 14px 32px",
        gap: 14,
        overflowY: "auto",
        background: "var(--honey)",
      }}
    >
      <div className="stitle">{t.resultsTitle}</div>

      {sessions.length === 0 ? (
        <div
          className="scard"
          style={{ textAlign: "center", color: "#9ca3af", fontSize: "1rem", padding: "28px 18px" }}
        >
          {t.noResults}
        </div>
      ) : (
        sessions.map((session) => {
          const sorted = session.coop
            ? session.players
            : [...session.players].sort((a, b) => b.tokens - a.tokens);
          return (
            <div
              key={session.id}
              className="scard"
              style={{ padding: 0, overflow: "hidden" }}
            >
              {/* Card header */}
              <div
                style={{
                  background: "linear-gradient(135deg,#FFFBEB,#FEF3C7)",
                  padding: "11px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "2px solid #FDE68A",
                }}
              >
                <span style={{ fontWeight: 800, fontSize: ".92rem", color: "#78350F" }}>
                  {t.levels[session.level].icon} {t.levels[session.level].name}
                  {session.coop ? "  ·  🤝" : ""}
                </span>
                <span style={{ fontSize: ".76rem", color: "#92400E", opacity: 0.85 }}>
                  {formatDate(session.date)}
                </span>
              </div>

              {/* Player rows */}
              <div style={{ padding: "6px 16px 12px" }}>
                {session.coop && session.sharedTokens !== undefined && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#F0FDF4",
                      borderRadius: 9,
                      padding: "8px 12px",
                      margin: "8px 0",
                      fontWeight: 700,
                      color: "#065F46",
                    }}
                  >
                    <span>{t.coopTeamwork}</span>
                    <span>{session.sharedTokens} 🦴</span>
                  </div>
                )}

                {sorted.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "9px 0",
                      borderBottom: i < sorted.length - 1 ? "1px solid #F3F4F6" : "none",
                    }}
                  >
                    {/* Player name */}
                    <span
                      style={{
                        fontWeight: !session.coop && i === 0 ? 800 : 600,
                        color: !session.coop && i === 0 ? "#78350F" : "#1F2937",
                        fontSize: ".93rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {session.coop ? (DOGS[i] ?? "🐕") : MEDALS[i]}
                      {" "}
                      {p.name}
                    </span>

                    {/* Stats */}
                    <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {!session.coop && (
                        <span
                          style={{
                            background: "#FFFBEB",
                            border: "1.5px solid #FDE68A",
                            borderRadius: 20,
                            padding: "3px 11px",
                            fontSize: ".85rem",
                            fontWeight: 700,
                            color: "#92400E",
                          }}
                        >
                          {p.tokens} 🦴
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Buttons */}
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
