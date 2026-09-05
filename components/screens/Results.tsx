"use client";

import { useState } from "react";
import type { SessionRecord } from "@/lib/engine/types";
import type { GameActions } from "../useGame";
import { DOGS } from "@/lib/engine/constants";
import { MEDALS, type Dict } from "@/lib/i18n";
import { statsForPlayer } from "@/lib/stats";

const LS_KEY = "kaskash_sessions";
const LS_REVIEW = "kaskash_review";

function loadSessions(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * The facts each player still has open, keyed by player name. This is the list
 * the game itself uses to decide what to practise next, and it is the single
 * most useful thing for a teacher: not "how did they do today" but "which facts
 * are still not there". Weight is how far a fact is from being retired — higher
 * means it has been missed more and practised less.
 */
function loadOpenFacts(): Record<string, { expr: string; ans: number; weight: number }[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS_REVIEW) || "{}");
  } catch {
    return {};
  }
}

export default function Results({ t, actions }: { t: Dict; actions: GameActions }) {
  const [sessions, setSessions] = useState<SessionRecord[]>(loadSessions);
  const [openFacts, setOpenFacts] = useState(loadOpenFacts);
  const openNames = Object.keys(openFacts).filter((n) => (openFacts[n] ?? []).length);

  const clearAll = () => {
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_REVIEW);
    setSessions([]);
    setOpenFacts({});
  };

  const downloadCSV = () => {
    const lines: string[] = [];
    const he = t.dir === "rtl";
    const yn = (v: boolean | undefined) => (v ? (he ? "כן" : "Yes") : he ? "לא" : "No");
    // Quote values that could contain a comma so columns never shift.
    const csv = (v: string | number | undefined | null) => {
      const s = v === undefined || v === null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    lines.push(he ? "--- סיכום משחקים ---" : "--- Game Summary ---");
    lines.push(
      he
        ? "תאריך,מזהה,רמה,שיתופי,טיימר,בחירה,שוד,מיקוד,משחק_חופשי,תנאי_ניצחון,מנצח,גרגירים_משותפים"
        : "Date,ID,Level,Cooperative,Timer,Choice,Steal,Focus,FreePlay,WinCondition,Winner,SharedPellets"
    );
    for (const s of sessions) {
      const st = s.settings;
      lines.push([
        formatDate(s.date), s.id, t.levels[s.level].name, yn(s.coop),
        yn(st?.timer), yn(st?.mc), yn(st?.rob), yn(st?.focus), yn(st?.freePlay), st?.winMode ?? "",
        s.winnerName ?? (s.coop ? (he ? "כולם" : "Everyone") : ""), s.sharedTokens ?? "",
      ].join(","));
    }

    lines.push("");
    lines.push(he ? "--- תוצאות שחקנים ---" : "--- Player Results ---");
    lines.push(
      he
        ? "תאריך,מזהה_משחק,שחקן,ניקוד,שגיאות,דיוק_אחוז,נכונים,סהכ_פריטים,זמן_חציוני_שנ"
        : "Date,GameID,Player,Score,Errors,Accuracy_pct,Correct,Items,MedianRT_sec"
    );
    for (const s of sessions) {
      for (const p of s.players) {
        const stat = statsForPlayer(s.trials, p.name);
        lines.push([
          formatDate(s.date), s.id, csv(p.name), p.tokens, p.errors ?? 0,
          stat.accuracyPct, stat.correct, stat.total, stat.medianRtSec ?? "",
        ].join(","));
      }
    }

    // What a teacher actually needs: which facts are still open, per child,
    // ordered by how far each is from being learned.
    const open = loadOpenFacts();
    const names = Object.keys(open).filter((n) => (open[n] ?? []).length);
    if (names.length) {
      lines.push("");
      lines.push(he ? "--- עובדות שעדיין בתרגול ---" : "--- Facts Still In Practice ---");
      lines.push(he ? "שחקן,תרגיל,תשובה,משקל" : "Player,Exercise,Answer,Weight");
      for (const name of names) {
        const facts = [...(open[name] ?? [])].sort((a, b) => b.weight - a.weight);
        for (const f of facts) {
          lines.push([csv(name), csv(f.expr), f.ans, f.weight].join(","));
        }
      }
    }

    lines.push("");
    lines.push(he ? "--- יומן שגיאות ---" : "--- Error Log ---");
    lines.push(
      he
        ? "תאריך,מזהה_משחק,שחקן,שלב,תרגיל,תשובה_נכונה,תשובה_שגויה"
        : "Date,GameID,Player,Phase,Exercise,Correct,Wrong"
    );
    for (const s of sessions) {
      for (const p of s.players) {
        for (const e of p.errorLog ?? []) {
          lines.push([
            formatDate(s.date), s.id, csv(p.name),
            e.phase === 1 ? (he ? "שלב1-יעד" : "Phase1-Target") : he ? "שלב3-דרך" : "Phase3-Route",
            csv(e.expr), e.correct, e.wrong,
          ].join(","));
        }
      }
    }

    // Trial-level chronometric log — one row per answer attempt (with response time).
    lines.push("");
    lines.push(he ? "--- מענים (זמני תגובה) ---" : "--- Trials (response times) ---");
    lines.push(
      he
        ? "מזהה_משחק,שחקן,רמה,שלב,סוג,תרגיל,תשובה,מענה,נכון,ניסיון,זמן_מילישניות,אופן,רמז,חשיפה,טיימר,זמן_שנותר_מילישניות,חותמת_זמן"
        : "GameID,Player,Level,Phase,Type,Expr,Answer,Response,Correct,Attempt,RT_ms,Mode,Hint,Reveal,Timer,TimeLeft_ms,Timestamp"
    );
    for (const s of sessions) {
      for (const tr of s.trials ?? []) {
        lines.push([
          s.id, csv(tr.player), tr.level,
          tr.phase, tr.qType, csv(tr.expr), tr.answer, tr.response,
          tr.correct ? 1 : 0, tr.attempt, tr.rtMs, tr.mode,
          tr.hintUsed ? 1 : 0, tr.revealed ? 1 : 0, tr.timerOn ? 1 : 0, tr.timeLeftMs, tr.ts,
        ].join(","));
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

      {/* Which facts are still open, per child. A teacher opening this screen
          wants to know what to work on next, not only how today went. */}
      {openNames.length > 0 && (
        <div className="scard" style={{ padding: "14px 16px" }}>
          <div style={{ fontWeight: 800, fontSize: ".95rem", color: "#78350F", marginBottom: 4 }}>
            {t.openFactsTitle}
          </div>
          <div style={{ fontSize: ".8rem", color: "#6b7280", marginBottom: 10 }}>
            {t.openFactsHint}
          </div>
          {openNames.map((name) => {
            const facts = [...(openFacts[name] ?? [])].sort((a, b) => b.weight - a.weight);
            return (
              <div key={name} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: ".88rem", color: "#1F2937", marginBottom: 5 }}>
                  {name} <span style={{ color: "#6b7280", fontWeight: 400 }}>· {t.openFactsCount(facts.length)}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {facts.map((f) => (
                    // The weight is printed, not only coloured. Colour alone
                    // would make the ranking unreadable for the same people the
                    // board's door patterns were added for.
                    <span
                      key={f.expr}
                      title={t.openFactsWeight(f.weight)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: ".84rem",
                        fontWeight: 700,
                        padding: "3px 8px 3px 10px",
                        borderRadius: 999,
                        border: "2px solid",
                        borderColor: f.weight >= 4 ? "#B91C1C" : f.weight >= 3 ? "#B45309" : "#6B7280",
                        color: f.weight >= 4 ? "#B91C1C" : f.weight >= 3 ? "#B45309" : "#374151",
                        background: "white",
                      }}
                    >
                      <span dir="ltr" style={{ fontFamily: "Arial, sans-serif" }}>{f.expr}</span>
                      <span
                        aria-hidden="true"
                        style={{
                          fontSize: ".72rem",
                          fontWeight: 800,
                          background: "currentColor",
                          color: "white",
                          borderRadius: 999,
                          minWidth: 17,
                          textAlign: "center",
                          padding: "0 4px",
                        }}
                      >
                        {f.weight}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

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

                {sorted.map((p, i) => {
                  const stat = statsForPlayer(session.trials, p.name);
                  const hasStats = stat.total > 0;
                  return (
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
                      {hasStats && (
                        <span style={{ fontSize: ".78rem", color: "#0891B2", fontWeight: 600 }}>
                          {t.statAccuracy(stat.correct, stat.total)}
                          {stat.medianRtSec !== null ? ` · ${t.statSpeed(stat.medianRtSec.toFixed(1))}` : ""}
                        </span>
                      )}
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
                  );
                })}
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
