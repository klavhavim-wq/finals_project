"use client";

import { useState } from "react";
import { DOGS, PCOLORS } from "@/lib/engine/constants";
import type { Level, Settings } from "@/lib/engine/types";
import { CODE_LENGTH } from "@/lib/online/codes";
import { MAX_PLAYERS } from "@/lib/online/protocol";
import type { OnlineGame } from "../useOnlineGame";
import type { Dict } from "@/lib/i18n";

const LEVELS: Level[] = ["beg", "med", "adv", "champ", "hero"];

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="togrow">
      <span>{label}</span>
      <label className="tog">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="togsl" />
      </label>
    </div>
  );
}

/**
 * Getting a group game going: pick a side (start one, or join one), then the
 * waiting room where everyone gathers before the host sets things off.
 */
export default function OnlineLobby({
  t,
  online,
  onBack,
}: {
  t: Dict;
  online: OnlineGame;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<"pick" | "create" | "join">("pick");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [level, setLevel] = useState<Level>("med");
  // Same defaults as a game set up on one device — the clock and stealing off —
  // so the same level does not behave differently depending on how you started it.
  const [timer, setTimer] = useState(false);
  const [mc, setMc] = useState(true);
  const [rob, setRob] = useState(false);
  const [coop, setCoop] = useState(false);

  const { view, seat, busy, error, clearError } = online;
  const inRoom = !!view && !!seat;
  const iAmHost = view?.members.some((m) => m.seat === seat?.seat && m.isHost) ?? false;

  const errorText = error ? t.lobbyErrors[error] : null;

  const showMc = level === "beg" || level === "med";
  const showRob = level !== "beg";

  const create = () => {
    const settings: Settings = {
      timer,
      mc: showMc ? mc : false,
      rob: showRob ? rob : false,
      winMode: "rounds",
      coop,
      freePlay: false,
      focus: false,
      review: false,
    };
    void online.createLobby(name.trim() || t.defaultPlayerName(DOGS[0], 0), level, settings);
  };

  const join = () => {
    void online.joinLobby(code, name.trim() || t.defaultPlayerName(DOGS[0], 0));
  };

  // ── The waiting room ──────────────────────────────────────────────────────
  if (inRoom && view.phase === "waiting") {
    const meta = t.levels[view.level];
    return (
      <div id="ss" className="screen active">
        <div className="stitle">{t.lobbyWaitTitle}</div>

        <div className="scard lobby-code-card">
          <div className="lobby-code-label">{t.lobbyCodeLabel}</div>
          <div className="lobby-code" dir="ltr">
            {view.code}
          </div>
          <div className="lobby-code-hint">{t.lobbyCodeHint}</div>
        </div>

        <div className="scard lvlhead">
          <span className="lvlhead-icon">{meta.icon}</span>
          <div className="lvlhead-text">
            <strong>{meta.name}</strong>
            <small>{meta.desc}</small>
          </div>
        </div>

        <div className="scard">
          <h3>{t.lobbyPlayersHere(view.members.length, MAX_PLAYERS)}</h3>
          <div className="pnrows">
            {view.members.map((m) => (
              <div className="pnrow lobby-member" key={m.seat}>
                <div className="pndot" style={{ background: PCOLORS[m.seat] }} />
                <span className="lobby-dog">{DOGS[m.seat]}</span>
                <span className="lobby-name">{m.name}</span>
                {m.isHost && <span className="lobby-tag">{t.lobbyHostTag}</span>}
                {m.seat === seat.seat && <span className="lobby-tag lobby-you">{t.lobbyYouTag}</span>}
                {!m.connected && <span className="lobby-tag lobby-away">{t.lobbyAwayTag}</span>}
              </div>
            ))}
            {Array.from({ length: MAX_PLAYERS - view.members.length }, (_, i) => (
              <div className="pnrow lobby-member lobby-empty" key={`empty-${i}`}>
                <div className="pndot" style={{ background: "#e5e7eb" }} />
                <span className="lobby-name">{t.lobbyWaitingForPlayer}</span>
              </div>
            ))}
          </div>
        </div>

        {errorText && (
          <div className="scard lobby-error" role="alert">
            {errorText}
          </div>
        )}

        <div className="lvlactions">
          {iAmHost ? (
            <button className="btnbig" onClick={() => void online.startGame()} disabled={busy}>
              {t.lobbyStartBtn}
            </button>
          ) : (
            <div className="lobby-waiting-note">{t.lobbyWaitingForHost}</div>
          )}
        </div>
        <div className="lvlactions">
          <button className="btnout" onClick={() => void online.leave()}>
            {t.lobbyLeaveBtn}
          </button>
        </div>
      </div>
    );
  }

  // ── The game is over, or the host closed the room ─────────────────────────
  if (inRoom && view.phase === "ended" && view.endedReason === "host") {
    return (
      <div id="ss" className="screen active">
        <div className="stitle">{t.lobbyClosedTitle}</div>
        <div className="scard lobby-error">{t.lobbyClosedBody}</div>
        <div className="lvlactions">
          <button className="btnbig" onClick={() => void online.leave()}>
            {t.lobbyBackBtn}
          </button>
        </div>
      </div>
    );
  }

  // ── Choosing what to do ───────────────────────────────────────────────────
  return (
    <div id="ss" className="screen active">
      <div className="stitle">{t.lobbyTitle}</div>

      {mode === "pick" && (
        <>
          <div className="scard lobby-intro">{t.lobbyIntro}</div>
          <div className="lvlactions">
            <button className="btnbig" onClick={() => setMode("create")}>
              {t.lobbyCreateBtn}
            </button>
          </div>
          <div className="lvlactions">
            <button className="btnout" onClick={() => setMode("join")}>
              {t.lobbyJoinBtn}
            </button>
          </div>
          <div className="lvlactions">
            <button className="btnout" onClick={onBack}>
              {t.lobbyBackBtn}
            </button>
          </div>
        </>
      )}

      {mode === "join" && (
        <>
          <div className="scard">
            <h3>{t.lobbyCodeEnterLabel}</h3>
            <input
              type="text"
              className="lobby-code-input"
              dir="ltr"
              value={code}
              maxLength={CODE_LENGTH + 2}
              autoComplete="off"
              autoCapitalize="characters"
              placeholder={"".padEnd(CODE_LENGTH, "•")}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                clearError();
              }}
            />
            <div style={{ fontSize: ".82rem", color: "#6b7280", margin: "10px 0 4px" }}>
              {t.lobbyYourNameLabel}
            </div>
            <div className="pnrow">
              <div className="pndot" style={{ background: PCOLORS[0] }} />
              <input
                type="text"
                value={name}
                maxLength={18}
                placeholder={t.playerPlaceholder(DOGS[0], 0)}
                style={{ fontSize: "1rem", fontWeight: 600 }}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {errorText && (
            <div className="scard lobby-error" role="alert">
              {errorText}
            </div>
          )}

          <div className="lvlactions">
            <button className="btnbig" onClick={join} disabled={busy || code.trim().length === 0}>
              {t.lobbyJoinGoBtn}
            </button>
          </div>
          <div className="lvlactions">
            <button
              className="btnout"
              onClick={() => {
                setMode("pick");
                clearError();
              }}
            >
              {t.lobbyBackBtn}
            </button>
          </div>
        </>
      )}

      {mode === "create" && (
        <>
          <div className="scard">
            <h3>{t.lobbyYourNameLabel}</h3>
            <div className="pnrow">
              <div className="pndot" style={{ background: PCOLORS[0] }} />
              <input
                type="text"
                value={name}
                maxLength={18}
                placeholder={t.playerPlaceholder(DOGS[0], 0)}
                style={{ fontSize: "1rem", fontWeight: 600 }}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="scard">
            <h3>{t.chooseLevel}</h3>
            <div className="lobby-levels">
              {LEVELS.map((lv) => (
                <button
                  key={lv}
                  className={"cntb" + (level === lv ? " on" : "")}
                  onClick={() => setLevel(lv)}
                >
                  <span style={{ fontSize: "1.1rem" }}>{t.levels[lv].icon}</span>
                  <span style={{ fontSize: ".72rem", display: "block", fontWeight: 700 }}>
                    {t.levels[lv].name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="scard">
            <h3>{t.options}</h3>
            <Toggle label={t.optTimer} checked={timer} onChange={setTimer} />
            {showMc && <Toggle label={t.optMc} checked={mc} onChange={setMc} />}
            {showRob && <Toggle label={t.optRob} checked={rob} onChange={setRob} />}
            <Toggle label={t.optCoop} checked={coop} onChange={setCoop} />
          </div>

          {errorText && (
            <div className="scard lobby-error" role="alert">
              {errorText}
            </div>
          )}

          <div className="lvlactions">
            <button className="btnbig" onClick={create} disabled={busy}>
              {t.lobbyCreateGoBtn}
            </button>
          </div>
          <div className="lvlactions">
            <button
              className="btnout"
              onClick={() => {
                setMode("pick");
                clearError();
              }}
            >
              {t.lobbyBackBtn}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
