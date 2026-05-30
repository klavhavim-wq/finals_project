"use client";

import { useState } from "react";
import { DOGS, PCOLORS } from "@/lib/engine/constants";
import type { Level, Player, Settings, WinMode } from "@/lib/engine/types";
import type { GameActions } from "../useGame";
import type { Dict } from "@/lib/i18n";

const LEVEL_ORDER: Level[] = ["beg", "med", "adv", "champ", "hero"];
const WINMODE_ORDER: WinMode[] = ["rounds", "first100", "both"];

export default function Setup({ t, actions }: { t: Dict; actions: GameActions }) {
  const [count, setCount] = useState(1);
  const [names, setNames] = useState<string[]>(["", "", "", ""]);
  const [level, setLevel] = useState<Level>("med");
  const [timer, setTimer] = useState(true);
  const [mc, setMc] = useState(true);
  const [rob, setRob] = useState(true);
  const [coop, setCoop] = useState(false);
  const [winMode, setWinMode] = useState<WinMode>("rounds");

  const start = () => {
    const players: Player[] = Array.from({ length: count }, (_, i) => ({
      name: names[i]?.trim() || t.defaultPlayerName(DOGS[i], i),
      color: PCOLORS[i],
      tokens: 0,
      hex: 1,
      errors: 0,
    }));
    const settings: Settings = { timer, mc, rob, winMode, coop };
    actions.startGame(players, level, settings);
  };

  return (
    <div id="ss" className="screen active">
      <div className="stitle">{t.setupTitle}</div>

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
        <h3>{t.difficulty}</h3>
        <div className="lvgrid">
          {LEVEL_ORDER.map((lv) => {
            const meta = t.levels[lv];
            return (
              <button
                key={lv}
                className={"lvb" + (level === lv ? " on" : "")}
                style={lv === "hero" ? { gridColumn: "1/-1" } : undefined}
                onClick={() => setLevel(lv)}
              >
                <span className="li">{meta.icon}</span>
                <strong>{meta.name}</strong>
                <small>{meta.desc}</small>
                <span
                  className="lvvid"
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.openVideo(lv);
                  }}
                >
                  {t.watch}
                </span>
              </button>
            );
          })}
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
        <Toggle label={t.optMc} checked={mc} onChange={setMc} />
        <Toggle label={t.optRob} checked={rob} onChange={setRob} />
        <Toggle label={t.optCoop} checked={coop} onChange={setCoop} />
      </div>

      <div className="scard">
        <h3>{t.winCondition}</h3>
        <div className="wmoderow">
          {WINMODE_ORDER.map((wm) => {
            const meta = t.winModes[wm];
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
                  <span className="wmi">{meta.icon}</span>
                  <strong>{meta.name}</strong>
                  <small>{meta.desc}</small>
                </span>
              </label>
            );
          })}
        </div>
      </div>

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
