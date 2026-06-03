"use client";

import RichText from "./RichText";
import { SPECIAL_BY_ID } from "@/lib/engine/constants";
import type { GameState, ModalState } from "@/lib/engine/types";
import type { GameActions } from "./useGame";
import type { Dict } from "@/lib/i18n";

const DISMISSABLE = new Set<ModalState["kind"]>([
  "reveal",
  "settingsHelp",
  "video",
  "videoMenu",
  "confirmEnd",
]);

/** Real video files available per locale. Keys map to videoMenu entries. */
const VIDEO_SRC: Record<string, { en: string; he: string }> = {
  tutorial: { en: "/howto-en.mp4", he: "/howto-he.mp4" },
  gameplay: { en: "/howto-en.mp4", he: "/howto-he.mp4" },
};

export default function Modal({
  t,
  state,
  actions,
}: {
  t: Dict;
  state: GameState;
  actions: GameActions;
}) {
  const modal = state.modal;
  if (!modal) return null;
  const dismissable = DISMISSABLE.has(modal.kind);

  return (
    <div
      className="mbg open"
      onClick={(e) => {
        if (dismissable && e.target === e.currentTarget) actions.closeModal();
      }}
    >
      <div className="modal">
        {dismissable && (
          <button className="mclose" onClick={actions.closeModal}>
            ✕
          </button>
        )}
        <Body t={t} state={state} modal={modal} actions={actions} />
      </div>
    </div>
  );
}

function Body({
  t,
  state,
  modal,
  actions,
}: {
  t: Dict;
  state: GameState;
  modal: ModalState;
  actions: GameActions;
}) {
  switch (modal.kind) {
    case "reveal":
      return (
        <>
          <h2>{t.revealTitle(modal.ans)}</h2>
          <RichText as="p" html={t.revealBody(modal.ans)} />
          <div className="macts">
            <button className="abt abl" style={{ padding: "9px 18px" }} onClick={actions.closeModal}>
              {t.gotItThumbs}
            </button>
          </div>
        </>
      );

    case "found":
      return (
        <>
          <h2>{t.foundTitle(modal.hex)}</h2>
          <RichText as="p" html={t.foundBody(modal.sym)} />
          <div className="macts">
            <button className="abt abg" style={{ padding: "9px 18px" }} onClick={actions.startP2}>
              {t.planRoute}
            </button>
          </div>
        </>
      );

    case "arrival": {
      let symBtn = null;
      if (modal.sym === "💎")
        symBtn = (
          <button className="abt aby" style={{ padding: "9px 18px" }} onClick={() => actions.drawCard("bon")}>
            {t.drawBonus}
          </button>
        );
      else if (modal.sym === "🚧")
        symBtn = (
          <button className="abt abr" style={{ padding: "9px 18px" }} onClick={() => actions.drawCard("lim")}>
            {t.drawLimit}
          </button>
        );
      else if (modal.sym === "🎲")
        symBtn = (
          <button className="abt abp" style={{ padding: "9px 18px" }} onClick={() => actions.openPrimeHex(modal.hex)}>
            {t.drawTwist}
          </button>
        );
      else if (modal.sym === "🦹" && state.settings.rob && !state.settings.coop)
        symBtn = (
          <button className="abt abr" style={{ padding: "9px 18px" }} onClick={actions.openRob}>
            {t.steal}
          </button>
        );
      return (
        <>
          <h2>{t.arrivalTitle(modal.hex)}</h2>
          <RichText as="p" html={t.pelletsThisTurn(modal.turnPts)} />
          {modal.sym === "🦹" && state.settings.coop && (
            <p style={{ textAlign: "center", color: "#6b7280", fontSize: ".9rem", margin: "4px 0 8px" }}>
              {t.coopNoRob}
            </p>
          )}
          <div className="macts" style={{ flexWrap: "wrap", gap: 7 }}>
            {symBtn ?? (
              <button className="abt abg" style={{ padding: "9px 18px" }} onClick={actions.collectNext}>
                {t.collectPellets}
              </button>
            )}
          </div>
        </>
      );
    }

    case "card": {
      const def = SPECIAL_BY_ID[modal.cardId];
      const copy = t.cards[modal.cardId];
      return (
        <>
          <div className={`cdisp ${modal.cardType}`}>
            <div className="cdico">{def.icon}</div>
            <div className="cdtit">{copy.t}</div>
            <RichText className="cdtxt" html={copy.tx} />
            {modal.effResult && (
              <RichText
                style={{
                  marginTop: 10,
                  padding: "8px 10px",
                  background: "rgba(0,0,0,.07)",
                  borderRadius: 9,
                  fontSize: ".9rem",
                }}
                html={t.formatEff(modal.effResult)}
              />
            )}
          </div>
          <RichText
            as="p"
            style={{ textAlign: "center", marginTop: 8 }}
            html={t.pelletsThisTurn(modal.turnPts)}
          />
          <div className="macts" style={{ flexWrap: "wrap", gap: 7 }}>
            {modal.isExtra && (
              <button
                className="abt abp"
                style={{ padding: "9px 18px" }}
                onClick={actions.collectThenExtra}
              >
                {t.extraTurnBtn}
              </button>
            )}
            <button className="abt abg" style={{ padding: "9px 18px" }} onClick={actions.collectNext}>
              {t.collectPellets}
            </button>
          </div>
        </>
      );
    }

    case "rob":
      return (
        <>
          <h2>{t.robTitle}</h2>
          {modal.targets.map((tg) => (
            <button
              key={tg.index}
              className="abt abgr"
              onClick={() => actions.doRob(tg.index)}
            >
              {t.robTarget(tg.name, tg.tokens)}
            </button>
          ))}
          <button className="abt abg" onClick={actions.collectNext}>
            {t.skip}
          </button>
        </>
      );

    case "robResult":
      return (
        <>
          <h2>{t.robResultTitle}</h2>
          <p>{t.robResultBody(modal.stolen, modal.name)}</p>
          <div className="macts">
            <button className="abt abg" style={{ padding: "9px 18px" }} onClick={actions.collectNext}>
              {t.collectPellets}
            </button>
          </div>
        </>
      );

    case "forfeit":
      return (
        <>
          <h2>{t.forfeitTitle(modal.correct)}</h2>
          <RichText as="p" html={t.forfeitBody(modal.hex, modal.turnPts)} />
          <div className="macts">
            <button className="abt abg" style={{ padding: "9px 18px" }} onClick={actions.forfeitCollect}>
              {t.saveNext}
            </button>
          </div>
        </>
      );

    case "timeout":
      return (
        <>
          <h2>{t.timeoutTitle}</h2>
          <p>{t.timeoutBody(modal.hex)}</p>
          <div className="macts">
            <button className="abt abg" style={{ padding: "9px 18px" }} onClick={actions.forfeitCollect}>
              {t.saveNext}
            </button>
          </div>
        </>
      );

    case "confirmEnd":
      return (
        <>
          <h2>{t.confirmEndTitle}</h2>
          <p>{t.confirmEndBody}</p>
          <div className="macts">
            <button className="abt abgr" style={{ padding: "9px 18px" }} onClick={actions.closeModal}>
              {t.cancel}
            </button>
            <button
              className="abt abr"
              style={{ padding: "9px 18px" }}
              onClick={() => actions.showScreen("sw")}
            >
              {t.endGame}
            </button>
          </div>
        </>
      );

    case "settingsHelp":
      return (
        <>
          <h2>{t.settingsHelpTitle}</h2>
          <RichText html={t.settingsHelpBody} />
          <div className="macts" style={{ marginTop: 14 }}>
            <button className="abt abg" style={{ padding: "9px 22px" }} onClick={actions.closeModal}>
              {t.gotItDone}
            </button>
          </div>
        </>
      );

    case "video": {
      const src = VIDEO_SRC[modal.videoKey]?.[state.locale];
      return (
        <>
          <h2>{t.videoLabels[modal.videoKey] ?? "🎬"}</h2>
          {src ? (
            <video
              src={src}
              controls
              autoPlay
              playsInline
              style={{ width: "100%", borderRadius: 12, marginTop: 8, background: "#000" }}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: "3.5rem" }}>🎬</div>
              <p style={{ color: "#6b7280", marginTop: 10, fontSize: "1rem" }}>{t.videoComingSoon}</p>
              <RichText
                as="p"
                style={{ color: "#9ca3af", fontSize: ".82rem", marginTop: 6 }}
                html={t.videoComingSoonHint}
              />
            </div>
          )}
          <div className="macts">
            <button className="abt abgr" style={{ padding: "9px 18px" }} onClick={actions.closeModal}>
              {t.close}
            </button>
          </div>
        </>
      );
    }

    case "primeHex":
      return (
        <>
          <h2>{t.primeHexTitle(modal.hex)}</h2>
          <RichText as="p" html={t.primeHexMsg(modal.hex)} />
          <div className="macts">
            <button className="abt abp" style={{ padding: "9px 18px" }} onClick={() => actions.drawCard("twi")}>
              {t.drawTwistAfterPrime}
            </button>
          </div>
        </>
      );

    case "videoMenu":
      return (
        <>
          <h2>{t.videoMenuTitle}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            <button className="abt abl" onClick={() => actions.openVideo("tutorial")}>
              {t.videoMenuTutorial}
            </button>
            <button className="abt abp" onClick={() => actions.openVideo("gameplay")}>
              {t.videoMenuGameplay}
            </button>
          </div>
          <div
            style={{
              borderTop: "1px solid #f3f4f6",
              margin: "12px 0 8px",
              paddingTop: 8,
              fontSize: ".82rem",
              color: "#9ca3af",
              textAlign: "center",
            }}
          >
            {t.videoMenuNote}
          </div>
          <div className="macts">
            <button className="abt abgr" style={{ padding: "9px 18px" }} onClick={actions.closeModal}>
              {t.close}
            </button>
          </div>
        </>
      );
  }
}
