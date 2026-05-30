"use client";

import LanguageSwitch from "../LanguageSwitch";
import type { GameActions } from "../useGame";
import type { Locale } from "@/lib/engine/types";
import type { Dict } from "@/lib/i18n";

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
      <button className="btnbig" onClick={actions.goSetup}>
        {t.startGame}
      </button>
      <button className="btnout" onClick={actions.goInst}>
        {t.howToPlay}
      </button>
      <button className="btnout" onClick={actions.openVideoMenu}>
        {t.tutorialVideos}
      </button>
    </div>
  );
}
