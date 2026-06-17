"use client";

import LanguageSwitch from "../LanguageSwitch";
import { DC, LVL_DOORS } from "@/lib/engine/constants";
import type { GameActions } from "../useGame";
import type { Level, Locale } from "@/lib/engine/types";
import type { Dict } from "@/lib/i18n";

const LEVEL_ORDER: Level[] = ["beg", "med", "adv", "champ", "hero"];

// Readable (darkened) text shade for each level's name, matching the colour of
// the door that level adds. Borders use the door's own colour straight from the
// engine; the name uses a darker shade so it stays legible on white.
const TILE_LABEL: Record<Level, string> = {
  beg: "#185FA5", // blue
  med: "#534AB7", // purple
  adv: "#854F0B", // amber/yellow
  champ: "#A32D2D", // red
  hero: "#111827", // black
};

/** Colour of the door added at this level — used to tint its welcome-screen tile. */
function addedDoorColor(level: Level): string {
  const doors = LVL_DOORS[level];
  return DC[doors[doors.length - 1]].color;
}

export default function Welcome({
  t,
  actions,
  locale,
}: {
  t: Dict;
  actions: GameActions;
  locale: Locale;
}) {
  return (
    <div id="sw" className="screen active">
      <div
        className="logorow"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          width: "100%",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt={t.logoAlt} className="brand-logo" style={{ gridColumn: 2 }} />
        <div style={{ gridColumn: 3, justifySelf: "start", paddingInlineStart: 18 }}>
          <LanguageSwitch locale={locale} className="btnout" />
        </div>
      </div>
      <div className="wdog">🐕</div>
      <div className="wtitle">{t.title}</div>
      <div className="wsub">{t.welcomeSub}</div>
      <div className="wsub2">{t.welcomeSub2a}</div>
      <div className="wsub2">{t.welcomeSub2b}</div>

      <button
        className="btnbig"
        style={{ margin: "14px auto 4px", maxWidth: 360 }}
        onClick={actions.goQuick}
      >
        {t.quickLaunchBtn}
      </button>

      <div className="wchoose">{t.chooseLevel}</div>
      <div className="lvgrid wlvgrid">
        {LEVEL_ORDER.map((lv) => {
          const meta = t.levels[lv];
          return (
            <button
              key={lv}
              className="lvb"
              style={{
                borderColor: addedDoorColor(lv),
                ...(lv === "hero" ? { gridColumn: "1/-1" } : {}),
              }}
              onClick={() => actions.goSetupLevel(lv)}
            >
              <span className="li">{meta.icon}</span>
              <strong style={{ color: TILE_LABEL[lv] }}>{meta.name}</strong>
              <small>{meta.board ?? meta.desc}</small>
            </button>
          );
        })}
      </div>

      <button className="btnout" onClick={() => actions.goSimpleGuide(null)}>
        {t.howToPlay}
      </button>
      <button className="btnout" onClick={actions.goInst}>
        {t.fullGuideBtn}
      </button>
      <button className="btnout" onClick={actions.goResults}>
        {t.viewResults}
      </button>
    </div>
  );
}
