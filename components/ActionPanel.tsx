"use client";

import { useState } from "react";
import RichText from "./RichText";
import { DC } from "@/lib/engine/constants";
import type { GameState, Level } from "@/lib/engine/types";
import type { GameActions } from "./useGame";
import type { Dict } from "@/lib/i18n";

const LVL_MAX: Record<Level, number> = { beg: 4, med: 6, adv: 8, champ: 9, hero: 9 };

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

function SpectatorSection({ t, state, actions }: { t: Dict; state: GameState; actions: GameActions }) {
  const [claim, setClaim] = useState<number | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);

  const otherPlayers = state.players.map((p, i) => ({ p, i })).filter(({ i }) => i !== state.cur);
  if (otherPlayers.length === 0 || !state.pendingRoll) return null;

  const handleAnswer = () => {
    if (claim === null) return;
    const v = parseInt(inputVal, 10);
    if (isNaN(v)) return;
    if (v === state.pendingRoll!.correct) {
      actions.awardSpectatorBonus(claim);
      setFeedback("ok");
      setTimeout(() => { setFeedback(null); setClaim(null); setInputVal(""); }, 1500);
    } else {
      setFeedback("no");
      setTimeout(() => { setFeedback(null); setClaim(null); setInputVal(""); }, 800);
    }
  };

  return (
    <div style={{ marginTop: 10, borderTop: "1px dashed #d1d5db", paddingTop: 8 }}>
      <div style={{ fontSize: ".76rem", color: "#9ca3af", marginBottom: 5 }}>{t.spectatorPrompt}</div>
      {feedback === "ok" ? (
        <div style={{ color: "#10B981", fontWeight: 700, fontSize: ".88rem" }}>
          {t.spectatorCorrect(state.players[claim!].name)}
        </div>
      ) : feedback === "no" ? (
        <div style={{ color: "#EF4444", fontWeight: 700, fontSize: ".88rem" }}>{t.spectatorWrong}</div>
      ) : claim === null ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {otherPlayers.map(({ p, i }) => (
            <button key={i} className="abt abgr" style={{ fontSize: ".82rem", padding: "4px 10px" }}
              onClick={() => { setClaim(i); setInputVal(""); }}>
              {p.name}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div style={{ fontSize: ".8rem", color: "#374151", marginBottom: 4 }}>
            {t.spectatorAnswerFor(state.players[claim].name)}
          </div>
          <div className="ansinp">
            <input type="number" value={inputVal} autoFocus placeholder={t.answerPlaceholder}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAnswer(); }} />
            <button className="abt abg" onClick={handleAnswer}>✓</button>
          </div>
        </div>
      )}
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
      <HelpCard t={t} level={state.level} />
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
      {state.settings.coop && (
        <p style={{ fontSize: ".82rem", color: "#0891B2", background: "#EFF6FF", padding: "6px 10px", borderRadius: 8, margin: "6px 0" }}>
          {t.p2CoopHint}
        </p>
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
          {!state.mcCorrect && state.players.length > 1 && (
            <SpectatorSection t={t} state={state} actions={actions} />
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
