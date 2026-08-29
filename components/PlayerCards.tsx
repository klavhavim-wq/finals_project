"use client";

import { DC, DOGS, LVL_DOORS, PCOLORS, PELLET } from "@/lib/engine/constants";
import type { DoorKey, FoodTally, GameState } from "@/lib/engine/types";
import type { Dict } from "@/lib/i18n";

/** Add two food tallies together (for showing the in-progress turn live). */
function merge(a: FoodTally, b: FoodTally): FoodTally {
  const out: FoodTally = { ...a };
  (Object.keys(b) as DoorKey[]).forEach((k) => {
    out[k] = (out[k] ?? 0) + (b[k] ?? 0);
  });
  return out;
}

/**
 * The little collection a player has banked: one coloured chip per door they
 * walked through, with how many times. It keeps the "look what I collected"
 * feel of the old food row without a second kind of food in the game — the
 * chip is the door's own colour, and the count is a plain number beside it.
 */
function DoorChips({ t, state, foods }: { t: Dict; state: GameState; foods: FoodTally }) {
  const order = [...new Set(LVL_DOORS[state.level])];
  const have = order.filter((d) => (foods[d] ?? 0) > 0);
  if (have.length === 0) {
    return <div className="bank-foods empty">{t.bankEmpty}</div>;
  }
  return (
    <div className="bank-foods">
      {have.map((d) => (
        <span
          key={d}
          className="bank-food"
          style={{ background: DC[d].color + "1c", borderColor: DC[d].color }}
          title={t.bankChipTitle(t.doorLabel(d), foods[d] ?? 0)}
        >
          <span className="bank-food-ico" style={{ background: DC[d].color }} aria-hidden="true" />
          <span className="bank-food-cnt">{foods[d]}</span>
        </span>
      ))}
    </div>
  );
}

export default function PlayerCards({ t, state }: { t: Dict; state: GameState }) {
  const coop = state.settings.coop;
  const pct = Math.min(100, Math.round(state.sharedTokens));

  return (
    <div id="pcards" className="sq sq-bank">
      <div className="sq-title">{t.bankTitle}</div>

      {coop && (
        <div
          className="pcard"
          style={{
            borderInlineEndColor: "#10B981",
            background: "linear-gradient(135deg,#F0FDF4,#DCFCE7)",
            marginBottom: 4,
          }}
        >
          <div className="pchead">
            <div className="pcname" style={{ color: "#065F46" }}>
              {t.sharedBank}
            </div>
            <div className="pchon" style={{ color: "#10B981" }}>
              {PELLET}{state.sharedTokens + state.turnPts}
            </div>
          </div>
          <DoorChips t={t} state={state} foods={merge(state.sharedFoods, state.turnFoods)} />
          <div
            style={{
              marginTop: 6,
              background: "#d1fae5",
              borderRadius: 6,
              height: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: pct + "%",
                background: "#10B981",
                borderRadius: 6,
                transition: "width .4s",
              }}
            />
          </div>
          <div
            style={{ fontSize: ".8rem", color: "#065F46", marginTop: 3, textAlign: "center" }}
          >
            {t.sharedProgress(state.sharedTokens)}
          </div>
        </div>
      )}

      {state.players.map((p, i) => {
        const isCur = i === state.cur;
        // Show what this player has "so far" — banked plus the turn in progress.
        const liveTokens = p.tokens + (isCur && !coop ? state.turnPts : 0);
        const liveFoods = isCur && !coop ? merge(p.foods, state.turnFoods) : p.foods;
        return (
          <div
            className={"pcard" + (isCur ? " cur" : "")}
            key={i}
            style={isCur ? {
              borderInlineEndColor: PCOLORS[i],
              borderInlineEndWidth: 6,
              background: `linear-gradient(135deg, ${PCOLORS[i]}28, white)`,
              boxShadow: `0 4px 18px ${PCOLORS[i]}55`,
            } : undefined}
          >
            <div className="pchead">
              <div className="pcname" style={{ color: p.color }}>
                {isCur ? "▶ " : ""}
                <span className="pcdog">{DOGS[i]}</span> {p.name}
              </div>
              {!coop && (
                state.settings.freePlay
                  ? <div className="pchon" style={{ color: "#10B981" }}>{t.freeSolvedCount(p.solvedCount)}</div>
                  : <div className="pchon">{PELLET}{liveTokens}</div>
              )}
            </div>
            {!coop && !state.settings.freePlay && (
              <DoorChips t={t} state={state} foods={liveFoods} />
            )}
            <div className="pcpos">{t.hexLabel(p.hex)}</div>
          </div>
        );
      })}
    </div>
  );
}
