const { reducer, initState, pickTargetCard, routeReachesTarget } = require("./_engjs/gameReducer.js");
const { boardMaxFor } = require("./_engjs/constants.js");

function mkPlayers(n) {
  return Array.from({ length: n }, (_, i) => ({
    name: "P" + (i + 1), color: "#EF4444", tokens: 0, hex: 1,
    errors: 0, errorLog: [], solvedCount: 0, foods: {},
  }));
}

// Reproduce: the dog is standing on hex 11 and the new target card's answer is 11.
let s = initState("he");
s = reducer(s, {
  type: "START_GAME", players: mkPlayers(1), level: "beg",
  settings: { timer: false, mc: true, rob: false, winMode: "rounds", coop: false, freePlay: false, focus: false, review: false },
});
// Put the dog on hex 11 (as it would be after a turn that targeted 11, or a teleport).
s = { ...s, players: [{ ...s.players[0], hex: 11 }] };
// The new turn hands out a card whose answer is the hex the dog is already on.
s = reducer(s, { type: "START_P1", card: { id: 1, ex: "2 x 5 + 1", ans: 11 }, resetUsed: false });

console.log("dog hex:", s.players[0].hex, " target answer:", s.card.ans);

// Phase 1: the player clicks the hex - it is accepted as the target.
s = reducer(s, { type: "HEX_CLICK", n: 11 });
console.log("after clicking the target hex -> targetHex =", s.targetHex, " modal =", s.modal && s.modal.kind);

s = reducer(s, { type: "START_P2" });
console.log("phase now:", s.phase);

// The player tries to build a route. Clicking the hex they are standing on is a no-op,
// and it is also the target, so no route can ever reach it.
const before = JSON.stringify(s.path);
s = reducer(s, { type: "HEX_CLICK", n: 11 });
console.log("clicking the target (= own hex) changes path?", before !== JSON.stringify(s.path), " path =", JSON.stringify(s.path));
console.log("routeReachesTarget:", routeReachesTarget(s), " -> confirm button disabled:", !routeReachesTarget(s));

// Try every neighbouring hex then come back - can the route ever reach the target?
s = reducer(s, { type: "HEX_CLICK", n: 12 });
s = reducer(s, { type: "HEX_CLICK", n: 11 });
console.log("after going 11->12 then clicking 11: path =", JSON.stringify(s.path), " reaches target:", routeReachesTarget(s));

// The documented escape: the phase-2 panel's third button (startP1 / "pick a new target").
s = reducer(s, { type: "START_P1", card: { id: 2, ex: "2 x 3", ans: 6 }, resetUsed: false });
console.log("escape via 'pick a new target' -> phase:", s.phase, " new target:", s.card.ans, " path:", JSON.stringify(s.path));

// How often can the target coincide with the dog's hex? Count over the pools.
for (const lvl of ["beg", "med", "adv", "champ", "hero"]) {
  const answers = new Set();
  for (let i = 0; i < 4000; i++) answers.add(pickTargetCard(lvl, [], Math.random).card.ans);
  console.log(lvl, "- distinct target answers:", answers.size, " board max:", boardMaxFor(lvl));
}
