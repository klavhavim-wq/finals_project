import type { DoorKey, EffResult } from "../engine/types";
import type { Dict } from "./index";

const DOOR_LABELS: Record<DoorKey, string> = {
  blue: "🦴 Bone",
  purple: "🐟 Fish",
  yellow: "🍗 Wing",
  red: "🌭 Sausage",
  redlong: "🥩 Steak",
};

function formatEff(r: EffResult): string {
  switch (r.eff) {
    case "dblPts":
      return `🦴×2! Total: <strong>${r.total}</strong> pellets`;
    case "add10":
      return `+10 🦴! Total: <strong>${r.total}</strong>`;
    case "add15":
      return `+15 🦴! Total: <strong>${r.total}</strong>`;
    case "speedBonus":
      return r.applied
        ? `+20 🦴 for speed! Total: <strong>${r.total}</strong>`
        : "Not fast enough this time 😅";
    case "stepsBonus":
      return `+${r.steps * 2} 🦴 (${r.steps} steps × 2)! Total: <strong>${r.total}</strong>`;
    case "evenOnly":
      return r.applied
        ? `Pellets not even! −1 🦴 — remaining: <strong>${r.total}</strong>`
        : "✅ Pellets are even! All good";
    case "oddOnly":
      return r.applied
        ? `Pellets not odd! −1 🦴 — remaining: <strong>${r.total}</strong>`
        : "✅ Pellets are odd! All good";
    case "threeColors":
      return r.applied
        ? `Only ${r.count} door types — half pellets: <strong>${r.total}</strong>`
        : `✅ ${r.count} door types! All good`;
    case "noRed":
      return r.applied
        ? `${r.count} sausage door(s)! −${r.lost} 🦴 — remaining: <strong>${r.total}</strong>`
        : "✅ No sausage! All good";
    case "shortPath":
      return r.applied
        ? `Long route (${r.steps} steps) — 75%: <strong>${r.total}</strong> 🦴`
        : "✅ Short route! All good";
    case "extraTurn":
      return "🎉 You get an extra turn!";
  }
}

export const en: Dict = {
  dir: "ltr",

  logoAlt: "Dafi & The Dogs",
  title: "Dogylishios 🐕🍖",
  welcomeSub: "Help the dog store pellets in the bank! 🦴",
  welcomeSub2a: "📚 Multiplication tables · Number facts · Strategy",
  welcomeSub2b: "👥 1–4 players \u00a0·\u00a0 ⏱ 20–45 min",
  startGame: "🎮 Start Game!",
  howToPlay: "📖 How to Play?",
  tutorialVideos: "🎬 Tutorial Videos",

  inst: [
    {
      i: "🎯",
      t: "Step 1 — Find the Target",
      x: 'Draw a challenge card!<br>For example: <strong>6 × 4 = ?</strong><br><br>Solve it in your head 🧠 and click the hex with the answer (24) on the board.<br><br>Wrong? <strong>You can try again as many times as you like!</strong> 😊<br>Need help? Click "Show Answer" — but it won\'t move your dog.',
    },
    {
      i: "🗺️",
      t: "Step 2 — Plan Your Route",
      x: 'Click hexes on the board to build your path to the target.<br><br>The edge between hexes shows the food door type:<br><br>🦴 <strong>Bone</strong> — (2–4)×(2–4) = 1 pellet 🦴<br>🐟 <strong>Fish</strong> — (3–6)×(3–6) = 2 pellets 🦴🦴<br>🍗 <strong>Wing</strong> — (5–8)×(5–8) = 5 pellets 🦴×5<br>🌭 <strong>Sausage</strong> — (7–9)×(7–9) = 10 pellets 🦴×10<br>🥩 <strong>Steak</strong> — (11–19)×(2–9) = 20 pellets 🦴×20<br><em style="font-size:.85em;color:#7C3AED">Steak — Hero level only!</em><br><br>Harder = more pellets in the bank! 🐕',
    },
    {
      i: "🐕",
      t: "Step 3 — Off You Go!",
      x: "Your dog runs onto the board and starts collecting! 🐾<br><br>Each step: roll dice × dice = math equation.<br>Answer correctly → dog advances, earn pellets 🦴<br>Wrong? <strong>Try again unlimited times!</strong><br>Choose to reveal the answer → dog stops, <strong>pellets earned so far are saved in the bank!</strong> 🦴",
    },
    {
      i: "🦴",
      t: "How Much Is Each Pellet Worth?",
      x: "Each step earns pellets based on the door type:<br><br>🦴 <strong>Bone</strong> — Easy | (2–4)×(2–4) | 1 pellet per step<br>🐟 <strong>Fish</strong> — Medium | (3–6)×(3–6) | 2 pellets per step<br>🍗 <strong>Wing</strong> — Hard | (5–8)×(5–8) | 5 pellets per step<br>🌭 <strong>Sausage</strong> — Brave! | (7–9)×(7–9) | 10 pellets per step<br>🥩 <strong>Steak</strong> — Hero! | (11–19)×(2–9) | 20 pellets per step<br><br>🧠 <em>Choose harder doors if you're confident in your math!</em><br><br>⏱ Time runs out? Stay in place — pellets earned so far are saved!",
    },
    {
      i: "✨",
      t: "Special Symbols on the Board",
      x: '<strong>💎 Round numbers (10,20,30...)</strong><br>Landed here? Draw a Bonus card!<br>You might get: double pellets / extra turn / +10 pellets<br><br><strong>🚧 Numbers ending in 5 (15,25,35...)</strong><br>Draw a Limit card — a condition for collecting pellets!<br>Example: "Your pellets must be even"<br><br><strong>🦹 Numbers ending in 6 (16,26,36...)</strong><br>Steal! ✋ You can steal pellets from a rival<br><br><strong>🎲 Prime numbers (2,3,5,7,11,13...)</strong><br>A number divisible only by 1 and itself!<br>Draw a Twist card — the rules change!',
    },
    {
      i: "🏆",
      t: "How to Win?",
      x: '<strong>First to 100 pellets wins immediately! 🎉</strong><br><br>After 4 rounds — whoever collected the most wins.<br><br><span style="color:#7C3AED;font-weight:700;font-size:1rem">🔮 Purple numbers = prime numbers</span><br>A prime number is divisible only by 1 and itself.<br>Examples: 2, 3, 5, 7, 11, 13, 17... are prime!<br><br>Reach a prime hex → draw a Twist card! 🎲',
    },
    {
      i: "🤝",
      t: "Cooperative Mode — Together!",
      x: 'Enable "Cooperative mode" in settings.<br>In this mode — <strong>everyone works together!</strong><br><br>✅ All pellets go into one big shared bank 🦴<br>✅ No stealing — we\'re all one team!<br>✅ Reach 100 pellets together — <strong>everyone wins! 🎉</strong><br><br>🐕🐩🐕‍🦺🦮 Every dog helps fill the bank!',
    },
  ],
  back: "← Back",
  next: "Next →",
  gotItDone: "Got it! ✅",

  setupTitle: "⚙️ Game Settings",
  howManyPlayers: "👥 How many players?",
  playerNamesLabel: "✏️ Player names (optional):",
  playerPlaceholder: (dog, i) => `${dog} Player ${i + 1}...`,
  difficulty: "📊 Difficulty",
  levels: {
    beg: { icon: "🐾", name: "Beginner", desc: "First multiplication | (2–4)×(2–4)" },
    med: { icon: "⭐", name: "Intermediate", desc: "Tables up to 6 | (3–6)×(3–6)" },
    adv: { icon: "🌟", name: "Advanced", desc: "Tables up to 8 | (5–8)×(5–8)" },
    champ: { icon: "🏆", name: "Champion", desc: "Hard tables 7–9 | 2 min" },
    hero: { icon: "⚡", name: "Hero", desc: "Long multiplication | (11–19)×(2–9) | 1:30 min" },
  },
  watch: "🎬 Watch",
  options: "🔧 Options",
  whatsThis: "❓ What's this?",
  optTimer: "⏱ Turn timer",
  optMc: "🔤 Choice buttons (Beginner/Intermediate)",
  optRob: "🦹 Steal mechanic",
  optCoop: "🤝 Cooperative — collect together!",
  winCondition: "🏁 Win Condition",
  winModes: {
    rounds: { icon: "🔄", name: "4 Rounds", desc: "Most pellets after 4 rounds wins" },
    first100: { icon: "🎯", name: "First to 100", desc: "Reach 100 pellets = instant win!" },
    both: { icon: "⚡", name: "Both", desc: "4 rounds, but 100 = instant win" },
  },
  startShort: "🚀 Start!",

  gameTitle: "🐕🍖 Dogylishios",
  turn: (name) => `Turn: ${name}`,
  defaultPlayerName: (dog, i) => `${dog} Player ${i + 1}`,

  p1Hint:
    "<strong>Step 1 — Find the Target 🎯</strong><br>Solve the equation and click the hex with the answer on the board!",
  targetCardLabel: (id, prime) => `🃏 Target Card #${id}${prime ? " 🎲 Prime!" : ""}`,
  targetExpr: (ex) => `${ex} = ?`,
  targetInstruction: (prime) =>
    `${prime ? "🔮 Prime number — Twist card awaits!<br>" : ""}Click the hex on the board 👆`,
  showAnswer: "💡 Show Answer",
  wrongHexInline: (n) => `Hex ${n} is wrong — try again! 😊`,

  p2Hint: (target) =>
    `<strong>Step 2 — Plan Your Route 🗺️</strong><br>Click hexes to build your path.<br>Colored edge between hexes = door difficulty.<br>Target: <strong>Hex ${target}</strong>`,
  p2Empty: "Click hexes on the board to build the route 👆",
  stepHexLabel: (h) => `→ Hex ${h}`,
  doorLabel: (key) => DOOR_LABELS[key],
  pathDoorLabel: (key, pts) => `${DOOR_LABELS[key]} (${pts}pts)`,
  possiblePellets: (pts, steps) =>
    `🦴 Possible pellets: <strong>${pts} points</strong> | ${steps} steps`,
  routeNotReach: (target) => `⚠️ Route doesn't reach Hex ${target}!`,
  confirmRoute: "✅ Confirm Route",
  clearRoute: "🗑 Clear",
  newTarget: "← New Target",

  p3Hint: (step, total, doorLabel, pts, turnPts) =>
    `<strong>Step 3 — Execute! 🐕</strong><br>Step ${step}/${total} | Door: ${doorLabel} | ${pts} 🦴<br>🦴 Earned this turn: <strong>${turnPts}</strong>`,
  rollFor: (doorLabel) => `🎲 Roll ${doorLabel}`,
  orClickHex: "or click the hex with the answer on the board 👆",
  answerPlaceholder: "Answer...",
  confirmAnswer: "✅ Confirm",
  wrongTryAgain: "❌ Wrong! Try again, or reveal and lose this turn 😊",
  revealEndsTurn: "💡 Reveal Answer (ends turn)",

  revealTitle: (ans) => `💡 The Answer: ${ans}`,
  revealBody: (ans) => `Find hex <strong>${ans}</strong> on the board and click it.`,
  gotItThumbs: "Got it 👍",
  foundTitle: (n) => `✅ Yes! Hex ${n} 🎉`,
  foundBody: (sym) =>
    `You found the target!${sym ? `<br>⚠️ There's a symbol ${sym} on that hex!` : ""}`,
  planRoute: "👉 Plan Your Route",
  arrivalTitle: (hex) => `🎉 Target reached! Hex ${hex}`,
  pelletsThisTurn: (pts) => `🦴 Pellets this turn: <strong>${pts}</strong>`,
  drawBonus: "💎 Draw Bonus",
  drawLimit: "🚧 Draw Limit",
  drawTwist: "🎲 Draw Twist",
  steal: "🦹 Steal!",
  collectPellets: "🦴 Collect Pellets!",
  cards: {
    lim_even: { t: "Even Only!", tx: "Your pellet total must be even. Otherwise — lose 1 pellet 🦴" },
    lim_odd: { t: "Odd Only!", tx: "Your pellet total must be odd. Otherwise — lose 1 pellet 🦴" },
    lim_three: {
      t: "3 Door Types",
      tx: "If you used fewer than 3 different door types —<br>you get only half your pellets!",
    },
    lim_nored: {
      t: "No Sausage Door!",
      tx: "If you used a sausage door this turn —<br>you lose those points!",
    },
    lim_short: {
      t: "Short Route",
      tx: "If you chose more than 4 steps —<br>you get only 75% of your pellets",
    },
    bon_dbl: { t: "Double Pellets! 🦴🦴", tx: "Get ×2 all the pellets you earned this turn!" },
    bon_extra: { t: "Extra Turn! 🎉", tx: "Congratulations — you get an extra turn!" },
    bon_speed: { t: "Speed Route ⚡", tx: "Finished in less than half the time? Get +20 pellets!" },
    bon_add10: { t: "+10 Bonus", tx: "Just for reaching the target — +10 extra pellets! 🦴" },
    bon_steps: { t: "Step Bonus 🐾", tx: "Get +2 pellets for every step you walked!" },
    twi_extra: { t: "Extra Turn! 🔄", tx: "Lucky you — an extra turn!" },
    twi_dbl: { t: "Double Roll", tx: "Get ×2 pellets this turn! 🦴🦴" },
    twi_prime: { t: "Prime Bonus 🎲", tx: "You reached a prime number — +15 pellets!" },
    twi_kibble: { t: "Kibble Combo 🦴", tx: "Get +2 pellets per step walked 🦴" },
    twi_dbl2: { t: "Double Pellets! 🦴🦴", tx: "Double pellets this turn!" },
  },
  formatEff,
  extraTurnBtn: "🔄 Extra Turn!",
  robTitle: "🦹 Who to steal from?",
  robTarget: (name, tokens) => `${name} (${tokens}🦴)`,
  skip: "Skip",
  robResultTitle: "🦹 Steal!",
  robResultBody: (stolen, name) => `You stole ${stolen}🦴 from ${name}!`,
  forfeitTitle: (correct) => `💡 Answer: ${correct}`,
  forfeitBody: (hex, turnPts) =>
    `The door closes. Turn is over.<br>You stay at Hex <strong>${hex}</strong>.<br>🦴 Pellets earned so far: <strong>${turnPts}</strong> — saved in the bank!`,
  saveNext: "🦴 Save & Next Turn",
  timeoutTitle: "⏱ Time's Up!",
  timeoutBody: (hex) =>
    `You stay at Hex ${hex}. Pellets earned so far are saved! 🦴`,
  confirmEndTitle: "✖ End Game?",
  confirmEndBody: "All progress will be lost.",
  cancel: "Cancel",
  endGame: "End",
  close: "Close",

  settingsHelpTitle: "❓ Settings Guide",
  settingsHelpBody: `
    <div style="display:flex;flex-direction:column;gap:11px;margin-top:10px">
      <div style="background:#f9fafb;border-radius:10px;padding:11px 13px">
        <strong>⏱ Turn Timer</strong>
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">When on — each player has 3 minutes per turn (2 min for Champion, 1:30 for Hero). Pellets earned before time runs out are <strong>saved!</strong><br>💡 Turn it off for young children, first-time players, or relaxed cooperative play.</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:11px 13px">
        <strong>🏁 Win Condition</strong>
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">
        <strong>🔄 4 Rounds</strong> — Everyone plays 4 full rounds; most pellets wins. Balanced and time-limited.<br>
        <strong>🎯 First to 100</strong> — Game continues until a player hits 100 pellets for an instant win. Great for longer sessions.<br>
        <strong>⚡ Both</strong> — 4 rounds max, but hitting 100 first wins immediately. The most flexible option!</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:11px 13px">
        <strong>🔤 Choice Buttons</strong>
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">In Beginner/Intermediate levels — answers shown as 4 choice buttons instead of free typing. Great for children just starting out.<br>💡 Turn off to practice quick mental recall without hints.</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:11px 13px">
        <strong>🦹 Steal Mechanic</strong>
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">When on, landing on a 🦹 hex lets you steal pellets from a rival! Adds tension and strategy.<br>💡 Turn off for sensitive children, therapeutic settings, or cooperative play.</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:11px 13px">
        <strong>🤝 Cooperative Mode</strong>
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">All players are one team — pellets go into a shared bank, no stealing, no competition. Win together at 100!<br>💡 Great for young children, therapy sessions, and relaxed family play.</p>
      </div>
    </div>`,

  videoLabels: {
    tutorial: "🎬 Tutorial — Board layout & rules",
    gameplay: "🎮 Sample quick game",
    beg: "🐾 Guide — Beginner level",
    med: "⭐ Guide — Intermediate level",
    adv: "🌟 Guide — Advanced level",
    champ: "🏆 Guide — Champion level",
    hero: "⚡ Guide — Hero level",
  },
  videoComingSoon: "Video coming soon!",
  videoComingSoonHint:
    "To link a video, edit the VIDEOS object in the code<br>and insert the YouTube video ID.",
  videoMenuTitle: "🎬 Tutorial Videos",
  videoMenuTutorial: "🎬 Tutorial — Board layout, doors & rules",
  videoMenuGameplay: "🎮 Sample quick full game",
  videoMenuNote: "Level-specific videos available in Settings, next to each level",

  winnerTitle: "Winner! 🏆",
  winnerSuffix: " 🎉",
  newGameBtn: "🔄 New Game",
  coopWinTitle: "Cooperative Win! 🏆",
  coopWinName: "We all win! 🎉",
  coopTeamwork: "🤝 Teamwork",
  coopTogether: (shared) => `${shared}🦴 pellets together`,

  sharedBank: "🤝 Shared Bank",
  sharedProgress: (shared) => `${shared}/100 🎯`,
  hexLabel: (h) => `📍 Hex ${h}`,
};
