"use client";

import { useState } from "react";
import { DOGS, PCOLORS } from "@/lib/engine/constants";
import type { Level, Player, Settings, WinMode } from "@/lib/engine/types";
import type { GameActions } from "../useGame";
import type { Dict } from "@/lib/i18n";

const WINMODE_ORDER: WinMode[] = ["rounds", "first100", "both"];

export default function Setup({
  t,
  actions,
  level,
}: {
  t: Dict;
  actions: GameActions;
  level: Level;
}) {
  const [count, setCount] = useState(1);
  const [names, setNames] = useState<string[]>(["", "", "", ""]);
  // The clock and stealing both start off, at every level. Whoever sets a game up
  // usually presses Start without opening Options, so the defaults are what most
  // children actually meet — and a countdown that cannot be paused, plus taking
  // pellets off a named classmate, are the two things a first session least needs.
  // Both are one tap away for anyone who wants them, and the Full Game preset
  // still switches them on together.
  const [timer, setTimer] = useState(false);
  const [mc, setMc] = useState(true);
  const [rob, setRob] = useState(false);
  const [coop, setCoop] = useState(false);
  const [freePlay, setFreePlay] = useState(false);
  const [focus, setFocus] = useState(false);
  // On by default: bringing missed facts back is what adapts the game to the
  // child, and it is what fills the practice list a teacher reads afterwards.
  const [review, setReview] = useState(true);
  const [winMode, setWinMode] = useState<WinMode>("rounds");

  // Which options are relevant for this level.
  const showMc = level === "beg" || level === "med"; // multiple-choice only applies to these levels
  const showRob = true; // every level can toggle steal; Beginner defaults it off
  const showCoop = true; // cooperative play is available on every level, including Beginner
  // "First to 100" is only reachable from Advanced up; below that it would drag on
  // and fall back to the leader, so only Rounds is offered on Beginner/Intermediate.
  const showWinMode = level === "adv" || level === "champ" || level === "hero";

  const meta = t.levels[level];

  const start = () => {
    const players: Player[] = Array.from({ length: count }, (_, i) => ({
      name: names[i]?.trim() || t.defaultPlayerName(DOGS[i], i),
      color: PCOLORS[i],
      tokens: 0,
      hex: 1,
      errors: 0,
      errorLog: [],
      solvedCount: 0,
      foods: {},
    }));
    const settings: Settings = {
      timer,
      mc: showMc ? mc : false,
      rob: showRob ? rob : false,
      winMode: showWinMode ? winMode : "rounds",
      coop: showCoop ? coop : false,
      freePlay,
      focus,
      review,
    };
    actions.startGame(players, level, settings);
  };

  return (
    <div id="ss" className="screen active">
      <div className="stitle">{t.setupTitle}</div>

      <div className="scard lvlhead">
        <span className="lvlhead-icon">{meta.icon}</span>
        <div className="lvlhead-text">
          <strong>{meta.name}</strong>
          <small>{meta.desc}</small>
        </div>
      </div>

      <div className="lvlactions">
        <button className="btnbig demo-cta" onClick={() => actions.startDemo(level)}>
          {t.demoGameBtn}
        </button>
      </div>
      <div className="lvlactions">
        <button className="btnout" onClick={() => actions.goSimpleGuide(level)}>
          {t.howToPlay}
        </button>
        <button className="btnout" onClick={actions.goInst}>
          {t.fullGuideBtn}
        </button>
      </div>

      <div className="scard">
        <h3>{t.howManyPlayers}</h3>
        <div className="cntrow">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              className={"cntb" + (count === n ? " on" : "")}
              onClick={() => setCount(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <div style={{ fontSize: ".82rem", color: "#6b7280", margin: "8px 0 4px" }}>
          {t.playerNamesLabel}
        </div>
        <div className="pnrows">
          {Array.from({ length: count }, (_, i) => (
            <div className="pnrow" key={i}>
              <div className="pndot" style={{ background: PCOLORS[i] }} />
              <input
                type="text"
                value={names[i]}
                placeholder={t.playerPlaceholder(DOGS[i], i)}
                maxLength={18}
                style={{ fontSize: "1rem", fontWeight: 600 }}
                onChange={(e) =>
                  setNames((prev) => {
                    const copy = [...prev];
                    copy[i] = e.target.value;
                    return copy;
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="scard">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 11,
          }}
        >
          <h3 style={{ margin: 0 }}>{t.options}</h3>
          <button className="shlp" onClick={actions.openSettingsHelp}>
            {t.whatsThis}
          </button>
        </div>
        <Toggle label={t.optTimer} checked={timer} onChange={setTimer} />
        {showMc && <Toggle label={t.optMc} checked={mc} onChange={setMc} />}
        {showRob && <Toggle label={t.optRob} checked={rob} onChange={setRob} />}
        {showCoop && <Toggle label={t.optCoop} checked={coop} onChange={setCoop} />}
        <Toggle label={t.optFocus} checked={focus} onChange={setFocus} />
        <Toggle label={t.optReview} checked={review} onChange={setReview} />
        <Toggle label={t.optFreePlay} checked={freePlay} onChange={setFreePlay} />
      </div>

      {showWinMode && (
        <div className="scard">
          <h3>{t.winCondition}</h3>
          <div className="wmoderow">
            {WINMODE_ORDER.map((wm) => {
              const wmeta = t.winModes[wm];
              return (
                <label className="wmodelbl" key={wm}>
                  <input
                    type="radio"
                    name="winmode"
                    value={wm}
                    checked={winMode === wm}
                    onChange={() => setWinMode(wm)}
                  />
                  <span className="wmodecard">
                    <span className="wmi">{wmeta.icon}</span>
                    <strong>{wmeta.name}</strong>
                    <small>{wmeta.desc}</small>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="sacts">
        <button className="btnout" onClick={() => actions.showScreen("sw")}>
          {t.back}
        </button>
        <button className="btnbig" onClick={start}>
          {t.startShort}
        </button>
      </div>
    </div>
  );
}

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
