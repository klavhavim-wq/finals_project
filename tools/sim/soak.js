const { reducer, initState, rollDoor, pickTargetCard, makeChoices, pickSpecialId, routeReachesTarget } = require("./_engjs/gameReducer.js");
const { DC, LVL_DOORS, boardMaxFor, SPECIAL_BY_ID } = require("./_engjs/constants.js");
const { hNeighbors, findPath, hexSym } = require("./_engjs/hexgrid.js");

const problems = [];
function flag(kind, detail) {
  const key = kind + "::" + JSON.stringify(detail);
  problems.push({ kind, detail });
}

function mkPlayers(n) {
  const cols = ["#EF4444", "#3B82F6", "#10B981", "#8B5CF6"];
  return Array.from({ length: n }, (_, i) => ({
    name: "P" + (i + 1), color: cols[i], tokens: 0, hex: 1,
    errors: 0, errorLog: [], solvedCount: 0, foods: {},
  }));
}

// Host-side: begin a turn the way useGame does.
function startTurn(s) {
  const { card, resetUsed } = pickTargetCard(s.level, s.usedCards, Math.random, false);
  return reducer(s, { type: "START_P1", card, resetUsed });
}

function checkInvariants(s, ctx) {
  if (s.path.length !== s.pathDoors.length)
    flag("path/doors length mismatch", { ctx, path: s.path.length, doors: s.pathDoors.length });
  if (s.turnPts < 0) flag("negative turnPts", { ctx, turnPts: s.turnPts });
  for (const p of s.players) {
    if (p.tokens < 0) flag("negative tokens", { ctx, name: p.name, tokens: p.tokens });
    if (!Number.isFinite(p.tokens)) flag("non-finite tokens", { ctx, tokens: p.tokens });
    const max = boardMaxFor(s.level);
    if (p.hex < 1 || p.hex > max) flag("player off board", { ctx, level: s.level, hex: p.hex, max });
  }
  if (s.sharedTokens < 0) flag("negative sharedTokens", { ctx });
  // The walk panel renders nothing when there is no door for the current step and
  // no modal is open -> the turn would be unfinishable from the UI.
  // (A state waiting for a fresh turn is fine: the host starts one immediately.)
  if (s.phase === 3 && s.modal === null && !s.awaitNewTurn && s.screen === "sg" && s.pathDoors[s.stepIdx] === undefined)
    flag("walk stalled: no door for current step and no modal", { ctx, stepIdx: s.stepIdx, len: s.pathDoors.length });
}

function playGame(level, settings, nPlayers, rng) {
  let s = initState("he");
  s = reducer(s, { type: "START_GAME", players: mkPlayers(nPlayers), level, settings });
  let turns = 0;
  const seenExprPerTurn = [];

  while (s.screen === "sg" && turns < 400) {
    turns++;
    if (s.awaitNewTurn) s = startTurn(s);
    checkInvariants(s, "turn start");

    // Phase 1 — find the target by clicking the right hex.
    if (s.phase !== 1) { flag("not in find phase after new turn", { phase: s.phase }); break; }
    const target = s.card.ans;
    if (target < 1 || target > boardMaxFor(level))
      flag("target off board", { level, target, max: boardMaxFor(level), ex: s.card.ex });
    s = reducer(s, { type: "HEX_CLICK", n: target });
    if (s.targetHex !== target) { flag("target click did not register", { target }); break; }
    s = reducer(s, { type: "START_P2" });

    // Phase 2 — walk a real shortest route from the dog to the target.
    const from = s.players[s.cur].hex;
    const route = findPath(level, from, target);
    if (route.length === 0 && from !== target) {
      flag("no route from dog to target", { level, from, target });
      break;
    }
    for (const h of route) s = reducer(s, { type: "HEX_CLICK", n: h });
    checkInvariants(s, "route built");
    if (!routeReachesTarget(s)) {
      // Standing on the target already: the UI has no way to confirm a 0-step route.
      if (from === target) { flag("dog already on target, route cannot be built", { level, target }); }
      else flag("route does not reach target", { level, from, target, path: s.path });
      break;
    }
    s = reducer(s, { type: "CONFIRM_PATH" });

    // Phase 3 — answer every question correctly.
    const exprs = [];
    let guard = 0;
    while (s.phase === 3 && s.modal === null && guard++ < 200) {
      checkInvariants(s, "walk step");
      const col = s.pathDoors[s.stepIdx];
      if (col === undefined) break;
      const door = DC[col];
      const roll = rollDoor(door, {
        turnUsedExprs: s.turnUsedExprs, lastTurnExprs: s.lastTurnExprs,
        lastExpr: s.lastExpr, turnHasOne: s.turnHasOne, turnHasTen: s.turnHasTen,
      });
      exprs.push(roll.expr);
      const choices = settings.mc && (level === "beg" || level === "med")
        ? makeChoices(roll.correct, door) : null;
      if (choices) {
        if (new Set(choices).size !== choices.length) flag("duplicate answer choices", { choices, expr: roll.expr });
        if (!choices.includes(roll.correct)) flag("correct answer missing from choices", { choices, correct: roll.correct });
      }
      s = reducer(s, { type: "ROLL_DICE", step: s.stepIdx, roll, choices });
      s = reducer(s, { type: "MC_ANSWER", chosen: s.pendingRoll.correct });
      s = reducer(s, { type: "COMMIT_STEP" });
    }
    if (guard >= 200) { flag("walk did not terminate", { level }); break; }
    seenExprPerTurn.push(exprs);
    for (let i = 1; i < exprs.length; i++)
      if (exprs[i] === exprs[i - 1]) flag("same question twice in a row", { level, expr: exprs[i] });

    // Resolve whatever the arrival opened, the way the UI buttons do.
    let modalGuard = 0;
    while (s.modal && s.screen === "sg" && modalGuard++ < 30) {
      const m = s.modal;
      checkInvariants(s, "modal " + m.kind);
      if (m.kind === "primeHex") {
        s = reducer(s, { type: "OPEN_DRAW", cardType: "twi", cardId: pickSpecialId("twi", level),
          randData: { hex: Math.floor(rng() * boardMaxFor(level)) + 1, bool: rng() > 0.5, targetIdx: Math.floor(rng() * 4) } });
      } else if (m.kind === "factor") {
        s = reducer(s, { type: rng() > 0.5 ? "FACTOR_SOLVED" : "FACTOR_SKIP" });
      } else if (m.kind === "arrival") {
        if (m.sym === "💎") s = reducer(s, { type: "OPEN_DRAW", cardType: "bon", cardId: pickSpecialId("bon", level), randData: { hex: Math.floor(rng() * boardMaxFor(level)) + 1, bool: rng() > 0.5, targetIdx: Math.floor(rng() * 4) } });
        else if (m.sym === "🚧") s = reducer(s, { type: "OPEN_DRAW", cardType: "lim", cardId: pickSpecialId("lim", level), randData: { hex: Math.floor(rng() * boardMaxFor(level)) + 1, bool: rng() > 0.5, targetIdx: Math.floor(rng() * 4) } });
        else if (m.sym === "🎲") s = reducer(s, { type: "OPEN_PRIME_HEX", hex: m.hex });
        else if (m.sym === "🤹" && settings.rob && !settings.coop) s = reducer(s, { type: "OPEN_ROB" });
        else s = reducer(s, { type: "COLLECT_NEXT" });
      } else if (m.kind === "card") {
        s = reducer(s, { type: m.isExtra && rng() > 0.5 ? "COLLECT_THEN_EXTRA" : "COLLECT_NEXT" });
      } else if (m.kind === "rob") {
        if (m.targets.length) s = reducer(s, { type: "DO_ROB", index: m.targets[0].index });
        else s = reducer(s, { type: "COLLECT_NEXT" });
      } else if (m.kind === "robResult") {
        s = reducer(s, { type: "COLLECT_NEXT" });
      } else if (m.kind === "timeout" || m.kind === "forfeit") {
        s = reducer(s, { type: "FORFEIT_COLLECT" });
      } else {
        flag("unexpected modal during turn", { kind: m.kind });
        s = reducer(s, { type: "CLOSE_MODAL" });
      }
    }
    if (modalGuard >= 30) { flag("modal chain did not resolve", { level }); break; }
    checkInvariants(s, "turn end");
  }
  // Free play has no win condition by design - the facilitator ends it by hand.
  if (turns >= 400 && !settings.freePlay) flag("game did not end within 400 turns", { level, settings });
  return { s, turns };
}

let rngState = 12345;
const rng = () => { rngState = (rngState * 1103515245 + 12345) & 0x7fffffff; return rngState / 0x7fffffff; };

const levels = ["beg", "med", "adv", "champ", "hero"];
const settingSets = [
  { name: "full", v: { timer: true, mc: true, rob: true, winMode: "rounds", coop: false, freePlay: false, focus: false, review: false } },
  { name: "first100", v: { timer: true, mc: true, rob: true, winMode: "first100", coop: false, freePlay: false, focus: false, review: false } },
  { name: "both", v: { timer: true, mc: true, rob: true, winMode: "both", coop: false, freePlay: false, focus: false, review: false } },
  { name: "coop", v: { timer: false, mc: true, rob: true, winMode: "rounds", coop: true, freePlay: false, focus: false, review: false } },
  { name: "freePlay", v: { timer: false, mc: true, rob: false, winMode: "rounds", coop: false, freePlay: true, focus: true, review: false } },
  { name: "focus", v: { timer: false, mc: true, rob: false, winMode: "rounds", coop: false, freePlay: false, focus: true, review: false } },
];

let games = 0;
for (const level of levels)
  for (const set of settingSets)
    for (const n of [1, 2, 4]) {
      try {
        const { s, turns } = playGame(level, set.v, n, rng);
        games++;
        if (s.screen !== "swin" && !set.v.freePlay)
          flag("game never reached the end screen", { level, set: set.name, players: n, screen: s.screen, turns });
      } catch (e) {
        flag("EXCEPTION", { level, set: set.name, players: n, msg: String(e && e.message), stack: String(e && e.stack).split("\n")[1] });
        games++;
      }
    }

// Deduplicate for a readable report.
const seen = new Map();
for (const p of problems) {
  const k = p.kind + " | " + JSON.stringify(p.detail);
  seen.set(k, (seen.get(k) || 0) + 1);
}
console.log("games played:", games);
console.log("distinct problems:", seen.size, " total occurrences:", problems.length);
const byKind = new Map();
for (const p of problems) byKind.set(p.kind, (byKind.get(p.kind) || 0) + 1);
console.log("\n=== BY KIND ===");
for (const [k, n] of [...byKind].sort((a, b) => b[1] - a[1])) console.log(n + "x  " + k);
console.log("\n=== SAMPLES ===");
let shown = 0;
const shownKinds = new Set();
for (const p of problems) {
  if (shownKinds.has(p.kind)) continue;
  shownKinds.add(p.kind);
  console.log("* " + p.kind + ": " + JSON.stringify(p.detail));
  if (++shown > 25) break;
}
