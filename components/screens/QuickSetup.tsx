"use client";

import { useState } from "react";
import {
  addedDoorColor,
  DOGS,
  LEVEL_TEXT_COLOR,
  PCOLORS,
  PRESETS,
  PRESET_DEFAULT_LEVEL,
  PRESET_ORDER,
} from "@/lib/engine/constants";
import type { Level, Player, PresetId, Settings } from "@/lib/engine/types";
import type { GameActions } from "../useGame";
import type { Dict } from "@/lib/i18n";

const LEVEL_ORDER: Level[] = ["beg", "med", "adv", "champ", "hero"];

export default function QuickSetup({
  t,
  actions,
}: {
  t: Dict;
  actions: GameActions;
}) {
  const [level, setLevel] = useState<Level>(PRESET_DEFAULT_LEVEL);
  const [count, setCount] = useState(1);
  const [names, setNames] = useState<string[]>(["", "", "", ""]);

  const start = (pid: PresetId) => {
    const preset = PRESETS[pid];
    // Sanitise the preset against the chosen level — same rules as the full setup.
    const showMc = level === "beg" || level === "med";
    const showWinMode = level === "adv" || level === "champ" || level === "hero";
    const settings: Settings = {
      ...preset,
      mc: showMc ? preset.mc : false,
      winMode: showWinMode ? preset.winMode : "rounds",
    };
    const players: Player[] = Array.from({ length: count }, (_, i) => ({
      name: names[i]?.trim() || t.defaultPlayerName(DOGS[i], i),
      color: PCOLORS[i],
      tokens: 0,
      hex: 1,
      errors: 0,
      errorLog: [],
      solvedCount: 0,
    }));
    actions.startGame(players, level, settings);
  };

  return (
    <div id="sq" className="screen active">
      <div className="qlwrap">
        <div className="stitle" style={{ textAlign: "center" }}>{t.qlTitle}</div>
        <div className="qlsub">{t.qlSub}</div>

        <div className="scard qllearn">
          <h3>{t.qlLearnLabel}</h3>
          <button
            className="btnbig demo-cta qllearn-btn"
            onClick={() => actions.startDemo(level)}
          >
            {t.demoGameBtn}
          </button>
          <button
            className="btnout qllearn-btn"
            onClick={() => actions.goSimpleGuide(level)}
          >
            {t.howToPlay}
          </button>
        </div>

        <div className="scard">
          <h3>{t.qlLevelLabel}</h3>
          <div className="qllvls">
            {LEVEL_ORDER.map((lv) => {
              const color = addedDoorColor(lv);
              const selected = level === lv;
              return (
                <button
                  key={lv}
                  className={"qllvl" + (selected ? " on" : "")}
                  style={{
                    borderColor: color,
                    borderWidth: selected ? "3.5px" : "2.5px",
                    background: "#fff",
                    color: LEVEL_TEXT_COLOR[lv],
                  }}
                  onClick={() => setLevel(lv)}
                >
                  <span className="qli">{t.levels[lv].icon}</span>
                  {t.levels[lv].name}
                </button>
              );
            })}
          </div>
          <div className="qllvldesc">{t.levels[level].desc}</div>
        </div>

        <div className="scard">
          <h3>{t.qlPlayersLabel}</h3>
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
          <div style={{ fontSize: ".82rem", color: "#6b7280", margin: "10px 0 4px" }}>
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

        <div className="qllabel">{t.qlPickSetup}</div>
        <div className="lvgrid qlpresets">
          {PRESET_ORDER.map((pid) => {
            const p = t.presets[pid];
            return (
              <button key={pid} className="lvb qlpreset" onClick={() => start(pid)}>
                <span className="li">{p.icon}</span>
                <strong>{p.name}</strong>
                <small>{p.desc}</small>
              </button>
            );
          })}
        </div>

        <div className="qlnote">{t.qlReviewNote}</div>

        <div className="sacts">
          <button className="btnout" onClick={() => actions.showScreen("sw")}>
            {t.back}
          </button>
          <button className="btnout" onClick={() => actions.goSetupLevel(level)}>
            {t.qlAdvanced}
          </button>
        </div>
      </div>
    </div>
  );
}
