"use client";

import { useEffect, useRef, useState } from "react";
import RichText from "./RichText";
import { FACTOR_SOLVE_BONUS, FACTOR_TILE_BONUS, SPECIAL_BY_ID } from "@/lib/engine/constants";
import type { GameState, ModalState } from "@/lib/engine/types";
import type { GameActions } from "./useGame";
import type { Dict } from "@/lib/i18n";

const DISMISSABLE = new Set<ModalState["kind"]>([
  "reveal",
  "settingsHelp",
  "video",
  "confirmEnd",
]);

/** Real video files available per locale, keyed by videoKey. */
const VIDEO_SRC: Record<string, { en: string; he: string }> = {
  tutorial: { en: "/howto-en.mp4", he: "/howto-he.mp4" },
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
  const dismissable = modal ? DISMISSABLE.has(modal.kind) : false;
  const modalRef = useRef<HTMLDivElement>(null);
  const { closeModal } = actions;

  // Move focus into the dialog on open, and close dismissable dialogs on Escape.
  useEffect(() => {
    if (!modal) return;
    modalRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissable) closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal?.kind, dismissable, closeModal]);

  if (!modal) return null;

  return (
    <div
      className="mbg open"
      onClick={(e) => {
        if (dismissable && e.target === e.currentTarget) actions.closeModal();
      }}
    >
      <div className="modal" ref={modalRef} role="dialog" aria-modal="true" tabIndex={-1}>
        {dismissable && (
          <button className="mclose" onClick={actions.closeModal} aria-label={t.close}>
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
          {modal.factorTiles > 0 && (
            <RichText
              as="p"
              style={{ textAlign: "center", color: "#92400E", fontSize: ".88rem", margin: "2px 0 6px" }}
              html={t.factorTilesBonus(modal.factorTiles, modal.factorTiles * FACTOR_TILE_BONUS)}
            />
          )}
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

    case "factor":
      return <FactorChallenge t={t} n={modal.hex} actions={actions} />;
  }
}

function FactorChallenge({
  t,
  n,
  actions,
}: {
  t: Dict;
  n: number;
  actions: GameActions;
}) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);
  const [pair, setPair] = useState<{ a: number; b: number } | null>(null);

  const check = () => {
    const av = parseInt(a, 10);
    const bv = parseInt(b, 10);
    if (Number.isNaN(av) || Number.isNaN(bv)) return;
    if (av >= 2 && bv >= 2 && av * bv === n) {
      setPair({ a: av, b: bv });
      setFeedback("ok");
      setTimeout(() => actions.factorSolved(), 1100);
    } else {
      setFeedback("no");
      setTimeout(() => setFeedback(null), 1200);
    }
  };

  return (
    <>
      <h2>{t.factorTitle(n)}</h2>
      {feedback === "ok" && pair ? (
        <RichText
          as="p"
          style={{ textAlign: "center", color: "#10B981", fontWeight: 700, fontSize: "1.05rem", margin: "10px 0" }}
          html={t.factorCorrect(pair.a, pair.b, n, FACTOR_SOLVE_BONUS)}
        />
      ) : (
        <>
          <RichText as="p" html={t.factorPrompt(n)} />
          <div
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "12px 0", direction: "ltr" }}
          >
            <input
              type="number"
              inputMode="numeric"
              value={a}
              autoFocus
              placeholder="?"
              onChange={(e) => setA(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") check(); }}
              style={{ width: 64, textAlign: "center", fontSize: "1.15rem", padding: "8px 6px", borderRadius: 10, border: "2px solid #d1d5db" }}
            />
            <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#6b7280" }}>×</span>
            <input
              type="number"
              inputMode="numeric"
              value={b}
              placeholder="?"
              onChange={(e) => setB(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") check(); }}
              style={{ width: 64, textAlign: "center", fontSize: "1.15rem", padding: "8px 6px", borderRadius: 10, border: "2px solid #d1d5db" }}
            />
            <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#6b7280" }}>= {n}</span>
          </div>
          {feedback === "no" && (
            <div className="wrongbox">{t.factorWrong(n)}</div>
          )}
          <div className="macts" style={{ flexWrap: "wrap", gap: 7 }}>
            <button className="abt abg" style={{ padding: "9px 18px" }} onClick={check}>
              {t.factorCheck}
            </button>
            <button className="abt abgr" style={{ padding: "9px 18px" }} onClick={actions.factorSkip}>
              {t.factorSkipBtn}
            </button>
          </div>
        </>
      )}
    </>
  );
}
