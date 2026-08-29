"use client";

import { useState } from "react";
import RichText from "./RichText";
import { DC } from "@/lib/engine/constants";
import { routeReachesTarget } from "@/lib/engine/gameReducer";
import type { GameState, Level } from "@/lib/engine/types";
import type { GameActions } from "./useGame";
import type { Dict } from "@/lib/i18n";

// A full 1–10 times table on every level: the target-finding step draws from the
// whole table (factors 2–10) regardless of level, so the helper must cover it.
const LVL_MAX: Record<Level, number> = { beg: 10, med: 10, adv: 10, champ: 10, hero: 10 };

function MulTable({ max }: { max: number }) {
  const nums = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div style={{ overflowX: "auto", marginTop: 8 }}>
      <table style={{ borderCollapse: "collapse", fontSize: ".68rem", direction: "ltr", margin: "0 auto" }}>
        <tbody>
          {nums.map(row => (
            <tr key={row}>
              {nums.map(col => (
                <td key={col} style={{
                  padding: "3px 5px", textAlign: "center",
                  border: "1px solid #e5e7eb",
                  background: row === 1 || col === 1 ? "#FEF08A" : (row + col) % 2 === 0 ? "#f9fafb" : "white",
                  fontWeight: (row === 1 || col === 1) ? 800 : 400,
                  color: (row === 1 || col === 1) ? "#78350F" : "#1F2937",
                  minWidth: 22,
                }}>
                  {row * col}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HelpCard({ t, level }: { t: Dict; level: Level }) {
  const [open, setOpen] = useState(false);
  const max = LVL_MAX[level];
  return (
    <div style={{ marginTop: 8, borderTop: "1px solid #f3f4f6", paddingTop: 8 }}>
      <button className="abt abgr" style={{ fontSize: ".82rem", padding: "5px 14px" }}
        onClick={() => setOpen(v => !v)}>
        {open ? "✖ " : "🔢 "}{t.helpCardBtn}
      </button>
      {open && <MulTable max={max} />}
    </div>
  );
}

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
        <button className="abt abp" onClick={() => { actions.noteHint(); setHintVisible(true); }}>
          {t.hintBtn}
        </button>
      )}
      <button className="abt abgr" onClick={actions.revealTarget}>
        {t.showAnswer}
      </button>
      {state.wrongHex !== null && (
        <div className="wrongbox">{t.wrongHexInline(state.wrongHex)}</div>
      )}
      <HelpCard t={t} level={state.level} />
    </div>
  );
}

function Phase2({ t, state, actions }: { t: Dict; state: GameState; actions: GameActions }) {
  const steps = state.path.length;
  const pts = state.pathDoors.reduce((s, d) => s + DC[d].pts, 0);
  const hasTarget = routeReachesTarget(state);

  // The route reads off the board (each hex painted in its door colour); the
  // step-by-step breakdown lives in the side bar. This docked bar keeps the
  // guidance, the running pellet total, and the controls.
  return (
    <div>
      <RichText className="aphint" html={t.p2Hint(state.targetHex ?? 0)} />
      {steps > 0 && (
        <RichText className="rsum rsum-big pd-total" html={t.possiblePellets(pts, steps)} />
      )}
      {steps > 0 && !hasTarget && (
        <div className="wrongbox">{t.routeNotReach(state.targetHex ?? 0)}</div>
      )}
      {state.settings.coop && (
        <p style={{ fontSize: ".82rem", color: "#0891B2", background: "#EFF6FF", padding: "6px 10px", borderRadius: 8, margin: "6px 0" }}>
          {t.p2CoopHint}
        </p>
      )}
      <button
        className="abt abg"
        onClick={actions.confirmPath}
        disabled={!hasTarget}
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

function TurnProgress({ t, state }: { t: Dict; state: GameState }) {
  const total = state.path.length;
  const step = Math.min(state.stepIdx + 1, total);
  const remainingSteps = total - state.stepIdx;
  const remainingPellets = state.pathDoors
    .slice(state.stepIdx)
    .reduce((s, d) => s + DC[d].pts, 0);
  const hex = state.players[state.cur]?.hex ?? 0;
  return (
    <div className="turnprog">
      <span className="tp-chip">{t.progStep(step, total)}</span>
      <span className="tp-chip tp-earn">{t.progEarned(state.turnPts)}</span>
      <span className="tp-chip">{t.progLeft(remainingSteps, remainingPellets)}</span>
      <span className="tp-chip tp-dog">{t.progDogAt(hex)}</span>
    </div>
  );
}

function Phase3({ t, state, actions }: { t: Dict; state: GameState; actions: GameActions }) {
  const step = state.stepIdx;
  const col = state.pathDoors[step];
  const [hintVisible, setHintVisible] = useState(false);
  const [helperReveal, setHelperReveal] = useState(false);

  if (!col) return null;
  const dc = DC[col];
  const dieClass = col === "redlong" ? "redlong" : col;


  return (
    <div>
      <TurnProgress t={t} state={state} />
      <div className="p3-door" style={{ borderColor: dc.color, color: dc.color }}>
        <span className="p3-door-ico door-swatch" style={{ background: dc.color }} aria-hidden="true" />
        <RichText html={t.doorLabel(col)} />
        <span className="p3-door-val">{t.pelletsUnit(dc.pts)}</span>
      </div>
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

          {state.helperSolvedBy && !state.mcCorrect && (
            helperReveal ? (
              <div className="hintbox">{t.helperAnswerReveal(state.pendingRoll.correct)}</div>
            ) : (
              <div className="helper-solved">
                <div className="helper-solved-note">{t.helperSolvedNote(state.helperSolvedBy)}</div>
                <button className="abt abp" onClick={() => setHelperReveal(true)}>
                  {t.helperRevealBtn}
                </button>
              </div>
            )
          )}

          {(hintVisible || state.wrongAnswerVisible) ? (
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
      <HelpCard t={t} level={state.level} />
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
        inputMode="numeric"
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
