"use client";

import { useState } from "react";
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
  const [showQuickStart, setShowQuickStart] = useState(false);

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
      {showQuickStart && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}
          onClick={() => setShowQuickStart(false)}
        >
          <div
            style={{ background: "white", borderRadius: 18, padding: "28px 24px", maxWidth: 380, width: "100%", boxShadow: "0 18px 55px rgba(0,0,0,.3)" }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ textAlign: "center", marginBottom: 16, color: "#78350F" }}>{t.quickStartTitle}</h2>
            <ol style={{ paddingInlineStart: 22, lineHeight: 2.1, color: "#374151" }}>
              {t.quickStartSteps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
            <button
              className="btnbig"
              style={{ width: "100%", marginTop: 20 }}
              onClick={() => { setShowQuickStart(false); actions.goSetup(); }}
            >
              {t.quickStartGo}
            </button>
          </div>
        </div>
      )}
      <button className="btnbig" onClick={actions.goSetup}>
        {t.startGame}
      </button>
      <button className="btnout" onClick={() => setShowQuickStart(true)}>
        {t.quickStartBtn}
      </button>
      <button className="btnout" onClick={actions.goInst}>
        {t.howToPlay}
      </button>
      <button className="btnout" onClick={actions.openVideoMenu}>
        {t.tutorialVideos}
      </button>
      <button className="btnout" onClick={actions.goResults}>
        {t.viewResults}
      </button>
    </div>
  );
}
