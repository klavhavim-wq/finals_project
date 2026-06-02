import type { DoorKey, EffResult } from "../engine/types";
import type { Dict } from "./index";

const DOOR_LABELS: Record<DoorKey, string> = {
  blue: "🦴 Bone",
  purple: "🐟 Fish",
  yellow: "🍗 Wing",
  red: "🌭 Sausage",
  redlong: "🥩 Steak",
};

const DOOR_RANGES: Record<DoorKey, string> = {
  blue: "2–4 × 2–4",
  purple: "3–6 × 3–6",
  yellow: "5–8 × 5–8",
  red: "7–9 × 7–9",
  redlong: "11–19 × 2–9",
};

function mulHintEn(a: number, b: number): string {
  if (a === 10 || b === 10) {
    const x = a === 10 ? b : a;
    return `💜 Hint: ×10 — just add a zero to ${x}!`;
  }
  if (a === 5 || b === 5) {
    const x = a === 5 ? b : a;
    return `💜 Hint: ×5 = ×10 then halve — ${x} × 10 = <strong>${x * 10}</strong> ÷ 2 = ?`;
  }
  if (a === 2 || b === 2) {
    const x = a === 2 ? b : a;
    return `💜 Hint: ×2 = add the number to itself — ${x} + ${x} = ?`;
  }
  if (a >= 10) {
    const t = Math.floor(a / 10) * 10, o = a % 10;
    return `💜 Hint: split ${a} into ${t}+${o}: (${t}×${b}) + (${o}×${b}) = ?`;
  }
  if (b >= 10) {
    const t = Math.floor(b / 10) * 10, o = b % 10;
    return `💜 Hint: split ${b} into ${t}+${o}: (${a}×${t}) + (${a}×${o}) = ?`;
  }
  const [s, g] = a <= b ? [a, b] : [b, a];
  if (g <= 4) {
    const partial = Array.from({ length: g - 1 }, (_, i) => s * (i + 1)).join(", ");
    return `💜 Hint: count by ${s}, ${g} times: ${partial}, ?`;
  }
  return `💜 Hint: split — (${s}×5) + (${s}×${g - 5}) = ?`;
}

function calcHintEn(expr: string): string {
  const mParts = expr.split(/\s*×\s*/);
  if (mParts.length >= 2 && mParts.every(p => /^\d+$/.test(p.trim()))) {
    const nums = mParts.map(p => parseInt(p.trim()));
    if (nums.length === 2) return mulHintEn(nums[0], nums[1]);
    return `💜 Hint: ${nums[0]} × ${nums[1]} = <strong>${nums[0] * nums[1]}</strong>, then × ${nums[2]} = ?`;
  }
  const dM = expr.match(/^(\d+)\s*÷\s*(\d+)$/);
  if (dM) {
    const [a, b] = [+dM[1], +dM[2]];
    if (b === 2) return `💜 Hint: ÷2 = half — what's half of ${a}?`;
    return `💜 Hint: ${b} × ? = ${a} — what's the missing number?`;
  }
  const sM = expr.match(/^(\d+)\s*[−-]\s*(\d+)$/);
  if (sM) {
    const [a, b] = [+sM[1], +sM[2]];
    if (b <= 3) return `💜 Hint: count back ${b} from ${a}`;
    if (a % 10 === 0) return `💜 Hint: subtract 10 from ${a}, then add back ${10 - b}`;
    return `💜 Hint: ${a} − ${b} — what do you get?`;
  }
  const aM = expr.match(/^(\d+)\s*\+\s*(\d+)$/);
  if (aM) {
    const [a, b] = [+aM[1], +aM[2]];
    if (a % 10 === 0 || b % 10 === 0)
      return `💜 Hint: start at <strong>${Math.max(a, b)}</strong> and count up <strong>${Math.min(a, b)}</strong>`;
    if (b <= 5) return `💜 Hint: count ${b} forward from ${a}`;
    return `💜 Hint: ${a} + ${b} — count forward!`;
  }
  return `💜 Hint: think step by step! 🐾`;
}

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
  tutorialVideos: "🎬 Tutorial Videos",     inst: [
       {
         i: "🎮",
         t: "The Game Board",
         x: '<div style="text-align:center;margin:0 0 8px"><svg width="200" height="80" viewBox="0 0 182 80" xmlns="http://www.w3.org/2000/svg"><polygon points="46,14 68.5,27 68.5,53 46,66 23.5,53 23.5,27" fill="#FFF8E7" stroke="#C9A882" stroke-width="1.5"/><polygon points="91,14 113.5,27 113.5,53 91,66 68.5,53 68.5,27" fill="#FFF8E7" stroke="#C9A882" stroke-width="1.5"/><polygon points="136,14 158.5,27 158.5,53 136,66 113.5,53 113.5,27" fill="#FEF08A" stroke="#C9A882" stroke-width="1.5"/><line x1="68.5" y1="27" x2="68.5" y2="53" stroke="#3B82F6" stroke-width="4.5" stroke-linecap="round"/><line x1="113.5" y1="27" x2="113.5" y2="53" stroke="#8B5CF6" stroke-width="4.5" stroke-linecap="round"/><text x="46" y="44" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">12</text><text x="91" y="40" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">24</text><text x="136" y="40" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">36</text><text x="46" y="29" text-anchor="middle" font-size="16">🐕</text></svg></div>The board has 100 numbered hexes. Between the hexes you\'ll see colored edges — those are the "doors"! 🚪<br><br>Each color = a food type + difficulty level.<br><br>🎯 <strong>The goal:</strong> Collect as many pellets as you can for your dog\'s bank! 🐶🦴',
       },
       {
         i: "🎯",
         t: "Step 1 — Find the Target",
         x: '<div style="text-align:center;margin:0 0 8px"><svg width="180" height="70" viewBox="0 0 180 70" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="176" height="66" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/><text x="90" y="22" text-anchor="middle" font-size="12" fill="#64748b">🎯 Target Card</text><text x="90" y="50" text-anchor="middle" font-size="22" font-weight="bold" fill="#1e293b">6 × 4 = ?</text></svg></div>Draw a target card with a math problem, for example: <strong>6 × 4 = ?</strong><br><br>Solve it in your head 🧠 and click the hex with the answer (24) on the board!<br><br>Wrong? <strong>You can try again as many times as you want!</strong> 😊<br>Need help? You can choose a hint 💡, or click "Show Answer".<br><br>ℹ️ <strong>This step has NO time limit!</strong>',
       },
       {
         i: "🗺️",
         t: "Step 2 — Plan Your Route",
         x: '<div style="text-align:center;margin:0 0 8px"><svg width="140" height="130" viewBox="-5 0 250 245" xmlns="http://www.w3.org/2000/svg"><polygon points="120,20 207,70 207,170 120,220 33,170 33,70" fill="#FFF8E7" stroke="#C9A882" stroke-width="2"/><line x1="120" y1="20" x2="207" y2="70" stroke="#3B82F6" stroke-width="14" stroke-linecap="round"/><line x1="207" y1="70" x2="207" y2="170" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round"/><line x1="207" y1="170" x2="120" y2="220" stroke="#F59E0B" stroke-width="14" stroke-linecap="round"/><line x1="120" y1="220" x2="33" y2="170" stroke="#EF4444" stroke-width="14" stroke-linecap="round"/><line x1="33" y1="170" x2="33" y2="70" stroke="#DC2626" stroke-width="14" stroke-linecap="round"/><line x1="33" y1="70" x2="120" y2="20" stroke="#3B82F6" stroke-width="14" stroke-linecap="round"/><text x="120" y="120" text-anchor="middle" dominant-baseline="middle" font-size="36" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">42</text></svg></div>Click hexes to build your route to the target.<br>Don\'t forget to mark the target hex too!<br><br>The colors show the exercise difficulty and how many pellets you earn for solving it and moving to the next hex:<br><br><div style="font-size:.85em;line-height:2">🦴 <strong style="color:#3B82F6">Blue — Bone</strong>: Tables up to 4, e.g. <span dir="ltr">3 × 4 = 12</span> — <strong>1 pellet</strong> per step<br>🐟 <strong style="color:#8B5CF6">Purple — Fish</strong>: Tables up to 6, e.g. <span dir="ltr">4 × 5 = 20</span> — <strong>2 pellets</strong> per step<br>🍗 <strong style="color:#F59E0B">Yellow — Wing</strong>: Tables up to 8, e.g. <span dir="ltr">6 × 7 = 42</span> — <strong>5 pellets</strong> per step<br>🌭 <strong style="color:#EF4444">Red — Sausage</strong>: Tables 7–9, e.g. <span dir="ltr">8 × 9 = 72</span> — <strong>10 pellets</strong> per step<br>🥩 <strong style="color:#DC2626">Dark Red — Steak</strong>: Long multiplication, e.g. <span dir="ltr">13 × 4 = 52</span> — <strong>20 pellets</strong> per step</div><em style="font-size:.8em;color:#7C3AED">Steak — Hero level only!</em><br><br>Harder = more pellets in the bank! 🐶',
       },
       {
         i: "✅",
         t: "Review & Confirm",
         x: 'Before you start walking — check your route! 📝<br><br>On the side of the screen you\'ll see your route details: each step, the food type at each door, and the total pellets you can earn.<br><br>This helps you decide if it\'s worth going through a hard door for more pellets, or picking an easier path.<br><br>Not happy? Click "Clear" 🗑 and build a new route!<br>Ready? Click "Confirm Route" ✅ and off you go!',
       },
       {
         i: "🐕",
         t: "Step 3 — Off You Go!",
         x: 'Your dog jumps on the board and starts moving! 🐾<br><br>Each step:<br>1️⃣ Press "Roll" 🎲<br>2️⃣ Get a multiplication problem based on the door color<br>3️⃣ Answer by clicking a hex, typing, or using choice buttons<br><br>✅ Correct → the dog moves forward + pellets! 🦴<br>❌ Wrong → try again — no limit!<br>💡 Reveal answer → the dog stops, <strong>pellets earned so far are saved!</strong> 🦴',
       },
       {
         i: "⏱",
         t: "Time Limits",
         x: 'Each difficulty level has a time limit per turn:<br><br>🐾⭐🌟 <strong>Beginner / Medium / Advanced</strong> — 3 minutes<br>🏆 <strong>Champion</strong> — 2 minutes<br>⚡ <strong>Hero</strong> — 1:30 minutes<br><br>Didn\'t finish in time? You stay in place, <strong>pellets earned so far are saved!</strong> 🦴<br><br>💡 You can turn off the timer in the settings.',
       },
       {
         i: "🏆",
         t: "How to Win?",
         x: 'You can choose in the settings:<br><br>🔄 <strong>4 Rounds</strong> — Everyone plays 4 rounds, whoever collected the most pellets wins!<br><br>🎯 <strong>First to 100</strong> — Reach 100 pellets? Instant win! 🎉<br><br>⚡ <strong>Both</strong> — 4 rounds, but if someone reaches 100 first — instant win!<br><br>Choose before you start. ⚙️',
       },
       {
         i: "✨",
         t: "Special Symbols on the Board",
         x: '<strong>💎 Round numbers (10, 20, 30...)</strong><br>Landed here? Draw a Bonus card! 🎁<br>You might get: double pellets / extra turn / +10 pellets<br><br><strong>🚧 Numbers ending in 5 (15, 25, 35...)</strong><br>Draw a Limit card — a challenge for collecting!<br>Example: "Your pellets must be even"<br><br><strong>🦹 Numbers ending in 6 (16, 26, 36...)</strong><br>Steal! ✋ You can steal pellets from a rival!<br><br><strong>🔮 Prime numbers (2, 3, 5, 7, 11, 13...)</strong><br>A number that can only be divided by 1 and itself!<br>Draw a Twist card — the rules change! 🎲',
       },
       {
         i: "⚙️",
         t: "Game Settings",
         x: 'Before you start — set your game preferences:<br><br>📊 <strong>Difficulty level</strong> — Beginner to Hero<br>⏱ <strong>Timer</strong> — on or off<br>🔤 <strong>Choice buttons</strong> — for Beginner/Medium levels<br>🦹 <strong>Steal</strong> — on or off<br>🤝 <strong>Cooperative</strong> — play together instead of competing<br>🏁 <strong>Win condition</strong> — how do you win?',
       },
       {
         i: "🤝",
         t: "Together — Cooperative Mode",
         x: 'Enable "Cooperative mode" in settings.<br>In this mode — <strong>everyone works together!</strong><br><br>✅ All pellets go into one shared bank 🦴<br>✅ No stealing — we\'re all one team!<br>✅ Reach 100 together — <strong>everyone wins! 🎉</strong><br><br>🐕🐩🐕‍🦺🦮 Great for young kids, therapy, and family play.',
       }
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
  whatsThis: "What's this?",
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
  hintBtn: "💜 Hint",
  hintResult: (expr) => calcHintEn(expr),

  p2Hint: (target) =>
    `<strong>Step 2 — Plan Your Route 🗺️</strong><br>Click hexes to build your path.<br>Colored edge between hexes = door difficulty.<br>Target: <strong>Hex ${target}</strong>`,
  p2Empty: "Click hexes on the board to build the route 👆",
  stepHexLabel: (h) => `→ Hex ${h}`,
  doorLabel: (key) => DOOR_LABELS[key],
  pathDoorLabel: (key, pts) => `${DOOR_LABELS[key]} | ${DOOR_RANGES[key]} | ${pts}pts`,
  possiblePellets: (pts, steps) =>
    `🍖 <strong>Total possible: ${pts} points</strong> in ${steps} steps`,
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
  resultsSaved: "✅ Results saved automatically",
  viewResultsBtn: "📊 All Results",

  viewResults: "📊 Results",
  resultsTitle: "📊 Game Results",
  noResults: "No saved results yet",
  clearResults: "🗑 Clear All",
  downloadResults: "⬇ Export CSV",

  sharedBank: "🤝 Shared Bank",
  sharedProgress: (shared) => `${shared}/100 🎯`,
  hexLabel: (h) => `📍 Hex ${h}`,
};
