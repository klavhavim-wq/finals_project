"use client";

import { useState } from "react";
import RichText from "./RichText";
import { DC } from "@/lib/engine/constants";
import type { GameState } from "@/lib/engine/types";
import type { GameActions } from "./useGame";
import type { Dict } from "@/lib/i18n";

export default function ActionPanel({
  t,
  state,
  actions,
}: {
  t: Dict;
  state: GameState;
  actions: GameActions;
}) {
  if (state.phase === 1) return <Phase1 key={state.card?.id ?? 0} t={t} state={state} actions={actions} />;
  if (state.phase === 2) return <Phase2 t={t} state={state} actions={actions} />;
  if (state.phase === 3) return <Phase3 key={state.pendingRoll?.expr ?? ""} t={t} state={state} actions={actions} />;
  return null;
}

function Phase1({ t, state, actions }: { t: Dict; state: GameState; actions: GameActions }) {
  const card = state.card;
  const [hintVisible, setHintVisible] = useState(false);
  if (!card) return null;

  return (
    <div>
      <RichText className="aphint" html={t.p1Hint} />
      <div className="tcard">
        <div className="tclbl">{t.targetCardLabel(card.id, !!card.prime)}</div>
        <div className="tcex">{t.targetExpr(card.ex)}</div>
        <RichText className="tcinst" html={t.targetInstruction(!!card.prime)} />
      </div>
      {hintVisible ? (
        <RichText className="hintbox" html={t.hintResult(card.ex)} />
      ) : (
        <button className="abt abp" onClick={() => setHintVisible(true)}>
          {t.hintBtn}
        </button>
      )}
      <button className="abt abgr" onClick={actions.revealTarget}>
        {t.showAnswer}
      </button>
      {state.wrongHex !== null && (
        <div className="wrongbox">{t.wrongHexInline(state.wrongHex)}</div>
      )}
    </div>
  );
}

function Phase2({ t, state, actions }: { t: Dict; state: GameState; actions: GameActions }) {
  const steps = state.path.length;
  const pts = state.pathDoors.reduce((s, d) => s + DC[d].pts, 0);
  const hasTarget = state.targetHex !== null && state.path.includes(state.targetHex);

  return (
    <div>
      <RichText className="aphint" html={t.p2Hint(state.targetHex ?? 0)} />
      {steps === 0 ? (
        <div style={{ fontSize: ".85rem", color: "#9ca3af", padding: 10, textAlign: "center" }}>
          {t.p2Empty}
        </div>
      ) : (
        <div className="pathlist">
          {state.path.map((h, i) => {
            const d = state.pathDoors[i];
            const dclass = d === "redlong" ? "redlong" : d;
            return (
              <div className="pstep" key={i}>
                <div className="psnum">{i + 1}</div>
                <div className="pshex">{t.stepHexLabel(h)}</div>
                <RichText className={"psdoor " + dclass} html={t.pathDoorLabel(d, DC[d].pts)} />
              </div>
            );
          })}
        </div>
      )}
      {steps > 0 && (
        <RichText className="rsum rsum-big" html={t.possiblePellets(pts, steps)} />
      )}
      {steps > 0 && !hasTarget && (
        <div className="wrongbox">{t.routeNotReach(state.targetHex ?? 0)}</div>
      )}
      <button
        className="abt abg"
        onClick={actions.confirmPath}
        disabled={!steps || !hasTarget}
      >
        {t.confirmRoute}
      </button>
      <button className="abt abgr" onClick={actions.clearPath}>
        {t.clearRoute}
      </button>
      <button className="abt abgr" onClick={actions.startP1}>
        {t.newTarget}
      </button>
    </div>
  );
}

function Phase3({ t, state, actions }: { t: Dict; state: GameState; actions: GameActions }) {
  const step = state.stepIdx;
  const col = state.pathDoors[step];
  const [hintVisible, setHintVisible] = useState(false);

  if (!col) return null;
  const dc = DC[col];
  const dieClass = col === "redlong" ? "redlong" : col;


  return (
    <div>
      <RichText
        className="aphint"
        html={t.p3Hint(step + 1, state.path.length, t.doorLabel(col), dc.pts, state.turnPts)}
      />
      <button
        className="abt abl p3-roll-btn"
        onClick={() => actions.rollDice(step)}
        disabled={!!state.pendingRoll}
      >
        {t.rollFor(t.doorLabel(col))}
      </button>

      {state.pendingRoll && (
        <div>
          <div className="mathbox">
            <div className="dicerow">
              {state.pendingRoll.rolls.map((r, i) => (
                <div key={i} className={`die ${dieClass}${state.diceSpin ? " spin" : ""}`}>
                  {r}
                </div>
              ))}
            </div>
            <div className="mathex">{state.pendingRoll.expr} = ?</div>
          </div>
          <div className="orchex-hint">
            {t.orClickHex}
          </div>

          {state.choices ? (
            <div className="mcgrid">
              {state.choices.map((c) => {
                const cls =
                  "mcb" +
                  (state.mcCorrect === c ? " ok" : "") +
                  (state.mcWrong === c ? " no" : "");
                return (
                  <button key={c} className={cls} onClick={() => actions.mcAnswer(c)}>
                    {c}
                  </button>
                );
              })}
            </div>
          ) : (
            <AnswerInput t={t} wrong={state.inputWrong} onSubmit={actions.inputAnswer} />
          )}

          {hintVisible ? (
            <RichText className="hintbox" html={t.hintResult(state.pendingRoll.expr)} />
          ) : (
            <button className="abt abp" onClick={() => setHintVisible(true)}>
              {t.hintBtn}
            </button>
          )}

          {state.wrongAnswerVisible && (
            <div>
              <div className="wrongbox">{t.wrongTryAgain}</div>
              <button className="abt aby" onClick={actions.openForfeit}>
                {t.revealEndsTurn}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnswerInput({
  t,
  wrong,
  onSubmit,
}: {
  t: Dict;
  wrong: boolean;
  onSubmit: (value: number) => void;
}) {
  const [value, setValue] = useState("");
  const submit = () => {
    const v = parseInt(value, 10);
    if (Number.isNaN(v)) return;
    onSubmit(v);
    setValue("");
  };
  return (
    <div className="ansinp">
      <input
        type="number"
        value={value}
        placeholder={t.answerPlaceholder}
        autoComplete="off"
        style={wrong ? { borderColor: "var(--rd)", background: "#FEE2E2" } : undefined}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      <button className="abt abg" onClick={submit}>
        {t.confirmAnswer}
      </button>
    </div>
  );
}
