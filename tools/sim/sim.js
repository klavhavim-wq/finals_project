const { reducer, initState, rollDoor, pickTargetCard } = require("./_engjs/gameReducer.js");
const { DC } = require("./_engjs/constants.js");
const { edgeColor, initEdgeColors } = require("./_engjs/hexgrid.js");

function mkPlayer(name) {
  return { name, color: "#EF4444", tokens: 0, hex: 1, errors: 0, errorLog: [], solvedCount: 0, foods: {} };
}

// Drive one full turn exactly as the UI does, on Beginner, route 1->2..9->19.
function runTurn(pathHexes, targetHex, level = "beg") {
  let s = initState("he");
  s = reducer(s, {
    type: "START_GAME",
    players: [mkPlayer("P1")],
    level,
    settings: { timer: true, mc: true, rob: false, winMode: "rounds", coop: false, freePlay: false, focus: false, review: false },
  });
  // Host begins the turn (awaitNewTurn -> startP1)
  const picked = pickTargetCard(s.level, s.usedCards, Math.random, false);
  s = reducer(s, { type: "START_P1", card: { id: 999, ex: "x", ans: targetHex }, resetUsed: false });

  // Phase 1: click the target hex
  s = reducer(s, { type: "HEX_CLICK", n: targetHex });
  // "plan route"
  s = reducer(s, { type: "START_P2" });
  // Phase 2: click each hex of the route in order
  for (const h of pathHexes) s = reducer(s, { type: "HEX_CLICK", n: h });

  const plannedSteps = s.path.length;
  const plannedPts = s.pathDoors.reduce((a, d) => a + DC[d].pts, 0);

  s = reducer(s, { type: "CONFIRM_PATH" });
  const confirmedSteps = s.path.length;

  // Phase 3: walk every step, always answering correctly
  let answered = 0;
  let guard = 0;
  while (s.phase === 3 && s.modal === null && guard++ < 100) {
    const step = s.stepIdx;
    const col = s.pathDoors[step];
    if (!col) break;
    const door = DC[col];
    const roll = rollDoor(door, {
      turnUsedExprs: s.turnUsedExprs, lastTurnExprs: s.lastTurnExprs,
      lastExpr: s.lastExpr, turnHasOne: s.turnHasOne, turnHasTen: s.turnHasTen,
    });
    s = reducer(s, { type: "ROLL_DICE", step, roll, choices: null });
    s = reducer(s, { type: "MC_ANSWER", chosen: s.pendingRoll.correct });
    answered++;
    s = reducer(s, { type: "COMMIT_STEP" });
  }

  return {
    plannedSteps, plannedPts, confirmedSteps, answered,
    turnPts: s.turnPts,
    dogHex: s.players[0].hex,
    targetHex: s.targetHex,
    modal: s.modal && s.modal.kind,
    modalHex: s.modal && s.modal.hex,
  };
}

console.log("--- Route 1->2,3,4,5,6,7,8,9 ->19 (target 19, 9 steps) ---");
console.log(JSON.stringify(runTurn([2, 3, 4, 5, 6, 7, 8, 9, 19], 19), null, 1));

console.log("\n--- Route 1->11..19 (target 19, 9 steps, other way round) ---");
console.log(JSON.stringify(runTurn([11, 12, 13, 14, 15, 16, 17, 18, 19], 19), null, 1));

console.log("\n--- Short route: 1->2->12 (target 12, 2 steps) ---");
console.log(JSON.stringify(runTurn([2, 12], 12), null, 1));

console.log("\n--- Route that overshoots the target: 1->2->3->4 with target 3 ---");
console.log(JSON.stringify(runTurn([2, 3, 4], 3), null, 1));
