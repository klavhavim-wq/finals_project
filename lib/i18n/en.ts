import type { DoorKey, EffResult } from "../engine/types";
import type { Dict, TourStep } from "./index";

const DOOR_LABELS: Record<DoorKey, string> = {
  blue: "Blue door",
  purple: "Purple door",
  yellow: "Orange door",
  red: "Red door",
  redlong: "Black door",
};

const DOOR_RANGES: Record<DoorKey, string> = {
  blue: "4–20",
  purple: "10–40",
  yellow: "24–64",
  red: "42–81",
  redlong: "11–19 × 2–9",
};

/** How hard each door's exercise is, in words a child reads — the number range
 *  alone never told anyone that a darker door means a harder question. */
const DOOR_DIFFICULTY: Record<DoorKey, string> = {
  blue: "Easy exercises",
  purple: "A bit harder",
  yellow: "Hard",
  red: "Very hard",
  redlong: "Challenge!",
};

/** A worked calculation: its own line, bold and left-to-right. */
function calc(s: string): string {
  return `<span class="hint-calc">${s}</span>`;
}

function mulHintEn(a: number, b: number): string {
  if (a === 10 || b === 10) {
    const x = a === 10 ? b : a;
    return `💜 Hint: ×10 — just add a zero to ${x}!`;
  }
  if (a === 5 || b === 5) {
    const x = a === 5 ? b : a;
    return `💜 Hint: ×5 = ×10, then halve` + calc(`${x} × 10 = <strong>${x * 10}</strong> ÷ 2 = ?`);
  }
  if (a === 2 || b === 2) {
    const x = a === 2 ? b : a;
    return `💜 Hint: ×2 = add the number to itself` + calc(`${x} + ${x} = ?`);
  }
  if (a === 9 || b === 9) {
    const x = a === 9 ? b : a;
    return `💜 Hint: ×9 = ×10, then take one away` + calc(`${x} × 10 = <strong>${x * 10}</strong> → ${x * 10} − ${x} = ?`);
  }
  if (a >= 10) {
    const t = Math.floor(a / 10) * 10, o = a % 10;
    return `💜 Hint: split ${a} into ${t} + ${o}` + calc(`(${t} × ${b}) + (${o} × ${b}) = ?`);
  }
  if (b >= 10) {
    const t = Math.floor(b / 10) * 10, o = b % 10;
    return `💜 Hint: split ${b} into ${t} + ${o}` + calc(`(${a} × ${t}) + (${a} × ${o}) = ?`);
  }
  const [s, g] = a <= b ? [a, b] : [b, a];
  if (g <= 4) {
    const partial = Array.from({ length: g - 1 }, (_, i) => s * (i + 1)).join(", ");
    return `💜 Hint: start at ${s} and add ${s} each time` + calc(`${partial}, ?`);
  }
  return `💜 Hint: break it into easy parts` + calc(`(${s} × 5) + (${s} × ${g - 5}) = ?`);
}

function calcHintEn(expr: string): string {
  const mParts = expr.split(/\s*×\s*/);
  if (mParts.length >= 2 && mParts.every(p => /^\d+$/.test(p.trim()))) {
    const nums = mParts.map(p => parseInt(p.trim()));
    if (nums.length === 2) return mulHintEn(nums[0], nums[1]);
    return `💜 Hint: multiply the first two, then the third` + calc(`${nums[0]} × ${nums[1]} = <strong>${nums[0] * nums[1]}</strong> → ${nums[0] * nums[1]} × ${nums[2]} = ?`);
  }
  const dM = expr.match(/^(\d+)\s*÷\s*(\d+)$/);
  if (dM) {
    const [a, b] = [+dM[1], +dM[2]];
    if (b === 2) return `💜 Hint: ÷2 = half — what's half of ${a}?`;
    return `💜 Hint: what's the missing number?` + calc(`${b} × ? = ${a}`);
  }
  const sM = expr.match(/^(\d+)\s*[−-]\s*(\d+)$/);
  if (sM) {
    const [a, b] = [+sM[1], +sM[2]];
    if (b <= 3) return `💜 Hint: count back ${b} from ${a}`;
    if (a % 10 === 0) return `💜 Hint: subtract 10 from ${a}, then add back ${10 - b}`;
    return `💜 Hint: what do you get?` + calc(`${a} − ${b} = ?`);
  }
  const aM = expr.match(/^(\d+)\s*\+\s*(\d+)$/);
  if (aM) {
    const [a, b] = [+aM[1], +aM[2]];
    const [small, big] = a <= b ? [a, b] : [b, a];
    if (a % 10 === 0 || b % 10 === 0)
      return `💜 Hint: start at <strong>${big}</strong> and count up <strong>${small}</strong>`;
    if (small <= 3) {
      if (small === 1) return `💜 Hint: count 1 forward from ${big}`;
      const steps = Array.from({ length: small - 1 }, (_, i) => big + i + 1).join(", ");
      return `💜 Hint: count ${small} forward from ${big}` + calc(`${steps}, ?`);
    }
    const nextRound = Math.ceil(big / 10) * 10;
    const toNext = nextRound - big;
    const leftover = small - toNext;
    if (toNext > 0 && leftover > 0)
      return `💜 Hint: make the next ten, then add the rest` + calc(`${big} + ${toNext} = <strong>${nextRound}</strong> → ${nextRound} + ${leftover} = ?`);
    const steps = Array.from({ length: small - 1 }, (_, i) => big + i + 1).join(", ");
    return `💜 Hint: start at ${big} and count up` + calc(`${steps}, ?`);
  }
  return `💜 Hint: think step by step! 🐾`;
}

function formatEff(r: EffResult): string {
  switch (r.eff) {
    case "dblPts":
      return `🦴×2! Total: <strong>${r.total}</strong> pellets`;
    case "add10":
      return `+10 🦴! Total: <strong>${r.total}</strong> pellets`;
    case "speedBonus":
      return r.applied
        ? `+20 🦴 for speed! Total: <strong>${r.total}</strong> pellets`
        : "Not fast enough this time 😅";
    case "stepsBonus":
      return `+${r.steps * 2} 🦴 (${r.steps} steps × 2)! Total: <strong>${r.total}</strong> pellets`;
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
        ? `Only ${r.count} door colors — half your pellets: <strong>${r.total}</strong>`
        : `✅ ${r.count} door colors! All good`;
    case "noRed":
      return r.applied
        ? `${r.count} red or black door(s)! −${r.lost} 🦴 — remaining: <strong>${r.total}</strong>`
        : "✅ No red or black door! All good";
    case "shortPath":
      return r.applied
        ? `Long route (${r.steps} steps) — 75%: <strong>${r.total}</strong> 🦴`
        : "✅ Short route! All good";
    case "extraTurn":
      return "🎉 You get an extra turn!";
    case "teleport":
      return `🎲 Jumped to hex <strong>${r.hex}</strong>! Next turn starts from there`;
    case "swapHex":
      return `🔀 Swapped positions with <strong>${r.withName}</strong>! You are now on hex <strong>${r.myNewHex}</strong>`;
    case "dblOrHalf":
      return r.doubled
        ? `🎉 Double! Total: <strong>${r.total}</strong> pellets`
        : `😅 Half... Total: <strong>${r.total}</strong> pellets`;
    case "giveTokens":
      return r.given > 0
        ? `🤝 You gave <strong>${r.given}</strong> pellets to ${r.toName}!`
        : `🤷 No other players to give to`;
  }
}

export const en: Dict = {
  dir: "ltr",

  logoAlt: "Dafi & The Dogs",
  title: "Dogylishios 🐕🍖",
  welcomeSub: "Help the dog collect pellets and fill its bank! 🦴",
  welcomeSub2a: "📚 Times tables · Number facts · Strategy",
  welcomeSub2b: "👥 1–4 players \u00a0·\u00a0 ⏱ 20–45 min",
  startGame: "🎮 Start Game!",
  chooseLevel: "✨ Pick a level to begin",
  demoVideo: "🎬 Demo video",
  howToPlay: "📖 How to Play?",
  tutorialVideos: "🎬 Tutorial Videos",
  inst: (device) => [
       {
         i: "🎮",
         t: "The Game Board",
         x: '<div style="display:flex;flex-direction:column;align-items:center;margin:0 0 8px"><svg width="300" height="126" viewBox="0 0 228 96" xmlns="http://www.w3.org/2000/svg"><polygon points="48,10 80.9,29 80.9,67 48,86 15.1,67 15.1,29" fill="#FFF8E7" stroke="#C9A882" stroke-width="1.5"/><polygon points="113.8,10 146.7,29 146.7,67 113.8,86 80.9,67 80.9,29" fill="#F5F3FF" stroke="#C9A882" stroke-width="1.5"/><polygon points="179.6,10 212.5,29 212.5,67 179.6,86 146.7,67 146.7,29" fill="#FFF8E7" stroke="#C9A882" stroke-width="1.5"/><line x1="80.9" y1="29" x2="80.9" y2="67" stroke="#3B82F6" stroke-width="5" stroke-linecap="round"/><line x1="146.7" y1="29" x2="146.7" y2="67" stroke="#8B5CF6" stroke-width="5" stroke-linecap="round"/><text x="48" y="58" text-anchor="middle" dominant-baseline="middle" font-size="17" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">12</text><text x="113.8" y="52" text-anchor="middle" dominant-baseline="middle" font-size="17" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">13</text><text x="179.6" y="52" text-anchor="middle" dominant-baseline="middle" font-size="17" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">14</text><text x="48" y="34" text-anchor="middle" font-size="22">🐕</text><text x="113.8" y="34" text-anchor="middle" font-size="16">🎲</text></svg></div>The board is filled with numbered hexes — the higher the level, the bigger the board (up to 100). Between the hexes you\'ll see colored edges — those are the "doors"! 🚪<br><br>Each color is a different door: a different difficulty, and a different number of pellets per step.<br><br>🎯 <strong>The goal:</strong> Collect as many pellets as you can for your dog\'s bank! 🐶🦴',
       },
       {
         i: device === "mobile" ? "📱" : "🖥️",
         t: "Where Everything Is",
         x:
           device === "mobile"
             ? '📋 <strong>Top bar</strong> — whose turn it is, the clock, and the music, help and exit buttons.<br><br>🗺️ <strong>The whole screen</strong> — the board. Use ➕ ➖ to make it bigger or smaller, and drag it with your finger to move around.<br><br>🏦 <strong>The bank tab</strong> — on the edge of the screen. Tap it to open a drawer with each player\'s bank, what every door is worth, the route details, and the helping-friend window. You can drag the tab anywhere that suits you.<br><br>⬆️ <strong>Windows</strong> — the confirm-route window and other messages slide up from the bottom, within thumb reach.'
             : '📋 <strong>Top bar</strong> — whose turn it is, the clock, and the music, help and exit buttons.<br><br>🗺️ <strong>Center</strong> — the board, nice and big.<br><br>📚 <strong>Side column</strong> — always open, with the turn controls, each player\'s bank, what every door is worth, the route details, and the helping-friend window.<br><br>✅ <strong>Bottom center</strong> — once your route reaches the target, a small confirm window pops up there.',
       },
       {
         i: "🎯",
         t: "Step 1 — Find the Target",
         x: 'Draw a target card with a math problem, for example: <strong><span dir="ltr" style="white-space:nowrap">6 × 4 = ?</span></strong><br><br>Solve it in your head 🧠 and click the hex with the answer (24) on the board!<br><br>Wrong? <strong>You can try again as many times as you want!</strong> 😊<br>Need help? You can choose a hint 💜, or click "💡 Show Answer".<br><br>ℹ️ <strong>This step has NO time limit!</strong>',
       },
       {
         i: "🗺️",
         t: "Step 2 — Plan Your Route",
         x: '<div style="display:flex;flex-direction:column;align-items:center;margin:0 0 8px"><svg width="140" height="130" viewBox="-5 0 250 245" xmlns="http://www.w3.org/2000/svg"><polygon points="120,20 207,70 207,170 120,220 33,170 33,70" fill="#FFF8E7" stroke="#C9A882" stroke-width="2"/><line x1="120" y1="20" x2="207" y2="70" stroke="#3B82F6" stroke-width="14" stroke-linecap="round"/><line x1="207" y1="70" x2="207" y2="170" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round"/><line x1="207" y1="170" x2="120" y2="220" stroke="#F59E0B" stroke-width="14" stroke-linecap="round"/><line x1="120" y1="220" x2="33" y2="170" stroke="#EF4444" stroke-width="14" stroke-linecap="round"/><line x1="33" y1="170" x2="33" y2="70" stroke="#111827" stroke-width="14" stroke-linecap="round"/><line x1="33" y1="70" x2="120" y2="20" stroke="#3B82F6" stroke-width="14" stroke-linecap="round"/><text x="120" y="120" text-anchor="middle" dominant-baseline="middle" font-size="36" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">42</text></svg></div>Click hexes to build your route to the target.<br>Don\'t forget to mark the target hex too!<br><br>The door colors show the exercise difficulty and how many pellets each step earns.<br><br>💡 <strong>Direction guide:</strong> While building, the next valid hexes are highlighted with a green border on the board.<br><br><em style="font-size:.85em;color:#64748b">The colors in this picture are just an example — which doors you actually get depends on the level.</em>',
       },
       {
         i: "🚪",
         t: "Doors & Pellets",
         x: '<div style="display:flex;flex-direction:column;gap:7px;margin:0 0 10px;font-size:.85em"><div style="padding:7px 11px;background:#EFF6FF;border-radius:8px;border-left:4px solid #3B82F6"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong style="color:#1D4ED8"><span style="display:inline-block;width:13px;height:13px;border-radius:4px;background:#3B82F6;vertical-align:-2px;margin-right:6px"></span>Blue door</strong><span style="flex-shrink:0;background:#1D4ED8;color:#fff;border-radius:999px;padding:2px 9px;font-weight:700;white-space:nowrap">1 pellet per step</span></div><div style="margin-top:4px;color:#475569">Products <span dir="ltr">4–20</span> · e.g. <span dir="ltr" style="white-space:nowrap;font-weight:600;color:#1e293b">3 × 4 = 12</span></div></div><div style="padding:7px 11px;background:#F5F3FF;border-radius:8px;border-left:4px solid #7C3AED"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong style="color:#6D28D9"><span style="display:inline-block;width:13px;height:13px;border-radius:4px;background:#7C3AED;vertical-align:-2px;margin-right:6px"></span>Purple door</strong><span style="flex-shrink:0;background:#6D28D9;color:#fff;border-radius:999px;padding:2px 9px;font-weight:700;white-space:nowrap">2 pellets per step</span></div><div style="margin-top:4px;color:#475569">Products <span dir="ltr">10–40</span> · e.g. <span dir="ltr" style="white-space:nowrap;font-weight:600;color:#1e293b">4 × 5 = 20</span></div></div><div style="padding:7px 11px;background:#FFFBEB;border-radius:8px;border-left:4px solid #F59E0B"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong style="color:#B45309"><span style="display:inline-block;width:13px;height:13px;border-radius:4px;background:#F59E0B;vertical-align:-2px;margin-right:6px"></span>Orange door</strong><span style="flex-shrink:0;background:#B45309;color:#fff;border-radius:999px;padding:2px 9px;font-weight:700;white-space:nowrap">5 pellets per step</span></div><div style="margin-top:4px;color:#475569">Products <span dir="ltr">24–64</span> · e.g. <span dir="ltr" style="white-space:nowrap;font-weight:600;color:#1e293b">6 × 7 = 42</span></div></div><div style="padding:7px 11px;background:#FEF2F2;border-radius:8px;border-left:4px solid #EF4444"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong style="color:#DC2626"><span style="display:inline-block;width:13px;height:13px;border-radius:4px;background:#EF4444;vertical-align:-2px;margin-right:6px"></span>Red door</strong><span style="flex-shrink:0;background:#DC2626;color:#fff;border-radius:999px;padding:2px 9px;font-weight:700;white-space:nowrap">10 pellets per step</span></div><div style="margin-top:4px;color:#475569">Products <span dir="ltr">42–81</span> · e.g. <span dir="ltr" style="white-space:nowrap;font-weight:600;color:#1e293b">8 × 9 = 72</span></div></div><div style="padding:7px 11px;background:#F3F4F6;border-radius:8px;border-left:4px solid #111827"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong style="color:#111827"><span style="display:inline-block;width:13px;height:13px;border-radius:4px;background:#111827;vertical-align:-2px;margin-right:6px"></span>Black door</strong><span style="flex-shrink:0;background:#111827;color:#fff;border-radius:999px;padding:2px 9px;font-weight:700;white-space:nowrap">12 pellets per step</span></div><div style="margin-top:4px;color:#475569">Long multiplication · e.g. <span dir="ltr" style="white-space:nowrap;font-weight:600;color:#1e293b">13 × 4 = 52</span></div></div></div><em style="font-size:.8em;color:#7C3AED">The black door — Hero level only!</em><br><br>The color shows how hard the exercise is, and the number beside it is how many pellets you earn for a step through that door. Harder = more pellets for the bank! 🐶',
       },
       {
         i: "✅",
         t: "Review & Confirm",
         x: '<div style="display:flex;flex-direction:column;align-items:center;margin:0 0 10px"><svg width="300" height="80" viewBox="0 0 245 66" xmlns="http://www.w3.org/2000/svg"><polygon points="102.0,5 115.9,13 115.9,29 102.0,37 88.1,29 88.1,13" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="129.7,5 143.6,13 143.6,29 129.7,37 115.8,29 115.8,13" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="157.4,5 171.3,13 171.3,29 157.4,37 143.5,29 143.5,13" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="185.1,5 199.0,13 199.0,29 185.1,37 171.2,29 171.2,13" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="212.8,5 226.7,13 226.7,29 212.8,37 198.9,29 198.9,13" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="32.7,29 46.6,37 46.6,53 32.7,61 18.8,53 18.8,37" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="60.4,29 74.3,37 74.3,53 60.4,61 46.5,53 46.5,37" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="18.9,5 32.8,13 32.8,29 18.9,37 5.0,29 5.0,13" fill="#FFF8E7" stroke="#C9A882" stroke-width="1.5"/><polygon points="46.6,5 60.5,13 60.5,29 46.6,37 32.7,29 32.7,13" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="74.3,5 88.2,13 88.2,29 74.3,37 60.4,29 60.4,13" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="88.1,29 102.0,37 102.0,53 88.1,61 74.2,53 74.2,37" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="115.9,29 129.8,37 129.8,53 115.9,61 102.0,53 102.0,37" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="143.6,29 157.5,37 157.5,53 143.6,61 129.7,53 129.7,37" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="171.3,29 185.2,37 185.2,53 171.3,61 157.4,53 157.4,37" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="199.0,29 212.9,37 212.9,53 199.0,61 185.1,53 185.1,37" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="226.7,29 240.6,37 240.6,53 226.7,61 212.8,53 212.8,37" fill="#FDE68A" stroke="#0891B2" stroke-width="1.5"/><line x1="32.8" y1="13" x2="32.8" y2="29" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="60.5" y1="13" x2="60.5" y2="29" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="88.2" y1="29" x2="74.3" y2="37" stroke="#8B5CF6" stroke-width="3" stroke-linecap="round"/><line x1="102.0" y1="37" x2="102.0" y2="53" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/><line x1="129.8" y1="37" x2="129.8" y2="53" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/><line x1="157.5" y1="37" x2="157.5" y2="53" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/><line x1="185.2" y1="37" x2="185.2" y2="53" stroke="#8B5CF6" stroke-width="3" stroke-linecap="round"/><line x1="212.9" y1="37" x2="212.9" y2="53" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><text x="18.9" y="14" text-anchor="middle" font-size="9">🐕</text><text x="18.9" y="27" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">1</text><text x="46.6" y="21" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif">2</text><text x="74.3" y="21" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif">3</text><text x="102.0" y="21" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#78350F" font-family="Arial,sans-serif" opacity="0.4">4</text><text x="129.7" y="21" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif" opacity="0.4">5</text><text x="157.4" y="21" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#78350F" font-family="Arial,sans-serif" opacity="0.4">6</text><text x="185.1" y="21" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif" opacity="0.4">7</text><text x="212.8" y="21" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#78350F" font-family="Arial,sans-serif" opacity="0.4">8</text><text x="32.7" y="45" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif" opacity="0.4">11</text><text x="60.4" y="45" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#78350F" font-family="Arial,sans-serif" opacity="0.4">12</text><text x="88.1" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif">13</text><text x="115.9" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">14</text><text x="143.6" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">15</text><text x="171.3" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">16</text><text x="199.0" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif">17</text><text x="226.7" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">18</text></svg><div style="font-size:.75em;color:#64748b;margin-top:2px">Example: route from Hex 1 to Hex 18 🗺️</div></div>' +
           (device === "mobile"
             ? 'Before you start walking — check your route! 📝<br><br>The bank tab 🏦 opens a drawer with your route details: each step, which door you cross, and how many pellets it is worth.<br><br>This helps you decide if it\'s worth going through a hard door for more pellets, or picking an easier route.<br><br>As soon as your route reaches the target, a strip slides up from the bottom: <strong>"Route ready!"</strong> ✅ with the number of steps and pellets. Tap the green button and off you go, or 🗑 to build a new one.<br><br>The board stays open — keep changing the route and the window updates by itself.'
             : 'Before you start walking — check your route! 📝<br><br>The side column shows your route details: each step, which door you cross, and how many pellets it is worth.<br><br>This helps you decide if it\'s worth going through a hard door for more pellets, or picking an easier route.<br><br>As soon as your route reaches the target, a window pops up at the bottom center: <strong>"Route ready!"</strong> ✅ with the number of steps and pellets. Click the green button and off you go, or 🗑 to build a new one.<br><br>The board stays open — keep changing the route and the window updates by itself.'),
       },
       {
         i: "🐕",
         t: "Step 3 — Off You Go!",
         x: 'Your dog jumps on the board and starts moving! 🐾<br><br>Each step:<br>1️⃣ Press the "🎲 Roll" button for that door<br>2️⃣ Get a multiplication problem based on the door color<br>3️⃣ Answer by typing or using choice buttons<br><br>✅ Correct → the dog moves forward + pellets! 🦴<br>❌ Wrong → try again — no limit!<br>💡 Reveal answer → the dog stops, <strong>pellets earned so far are saved!</strong> 🦴<br><br>🔢 <strong>Need help?</strong> Press the "Times Table" button at the bottom of the panel at any time.<br><br>🙋 <strong>Other players can help!</strong> The player in turn gets a few seconds to try alone; after that (or right away after a wrong answer) anyone else can answer and earn +1 pellet. 🦴<br>In a game played together, where everyone has their own device, that window pops up front and center for whoever is not playing — with the exercise the active player is solving.',
       },
       {
         i: "⏱",
         t: "Time Limits",
         x: 'The clock starts ticking when the dog sets off (step 3) and times the walk. Finding the target and planning the route are not timed at all.<br><br>How long each level gives you:<br><br>🐾⭐🌟 <strong>Beginner / Intermediate / Advanced</strong> — 3 minutes<br>🏆 <strong>Champion</strong> — 2 minutes<br>⚡ <strong>Hero</strong> — <span dir="ltr">1:30</span> min<br><br>Did not finish in time? You stay in place, <strong>pellets earned so far are saved!</strong> 🦴<br><br>💡 You can turn off the clock in the settings.',
       },
       {
         i: "🏆",
         t: "How to Win?",
         x: 'You can choose in the settings:<br><br>🔄 <strong>4 Rounds</strong> — Everyone plays 4 rounds, whoever collected the most pellets wins!<br><br>🎯 <strong>First to 100</strong> — Reach 100 pellets? Instant win! 🎉<br><br>⚡ <strong>Both</strong> — 4 rounds, but if someone reaches 100 first — instant win!<br><br><em style="font-size:.85em;color:#64748b">On Beginner and Intermediate the game is always 4 rounds; «First to 100» and «Both» are available from Advanced up.</em><br><br>Choose before you start. ⚙️',
       },
       {
         i: "✨",
         t: "Special Symbols on the Board",
         x: '<strong>💎 Round numbers (10, 20, 30...)</strong><br>Landed here? Draw a Bonus card! 🎁<br>You might get: double pellets / extra turn / +10 pellets<br><br><strong>🚧 Numbers ending in 5 (15, 25, 35...)</strong><br>Draw a Limit card — a challenge for collecting!<br>Example: "Your pellets must be even"<br><br><strong>🦹 Numbers ending in 6 (16, 26, 36...)</strong><br>Steal! ✋ You can steal pellets from a rival (about 10% of theirs)!<br><br><strong>🎲 Prime numbers (2, 3, 5, 7, 11, 13...)</strong><br>A number that can only be divided by 1 and itself!<br>Draw a Twist card — the rules change! 🎲<br><br><em style="font-size:.85em;color:#64748b">💡 In «Focus mode» (settings) these special hexes are hidden — a calmer board with fewer distractions.</em>',
       },
       {
         i: "🧩",
         t: "Factor Hunt",
         x: '<strong>🧩 Factor Hunt — Advanced level and up</strong><br><br>With the bigger numbers, when you reach the target you get a fun challenge: break it into two numbers that multiply to it — for example <span dir="ltr" style="white-space:nowrap">4 × 6 = 24</span> or <span dir="ltr" style="white-space:nowrap">3 × 8 = 24</span>.<br>Solved it? +5 pellet bonus! 🦴 <em>(You can also skip.)</em><br><br>And while planning your route — hexes with a <strong>gold ring</strong> are factors of the target. Every factor hex you step through earns +2 extra pellets! 🐾',
       },
       {
         i: "⚙️",
         t: "Game Settings",
         x: 'Before you start — set your game preferences:<br><br>📊 <strong>Difficulty level</strong> — Beginner to Hero<br>⏱ <strong>Timer</strong> — on or off<br>🔤 <strong>Choice buttons</strong> — for Beginner/Intermediate levels<br>🦹 <strong>Steal</strong> — on or off<br>🤝 <strong>Cooperative</strong> — play together instead of competing<br>🎯 <strong>Focus mode</strong> — no special hexes, fewer distractions<br>🎓 <strong>Free Play</strong> — practice with no score or winner<br>🏁 <strong>Win condition</strong> — how do you win?',
       },
       {
         i: "🤝",
         t: "Together — Cooperative Mode",
         x: 'Enable "Cooperative mode" in settings.<br>In this mode — <strong>everyone works together!</strong><br><br>✅ All pellets go into one shared bank 🦴<br>✅ No stealing — we\'re all one team!<br>✅ Collect together — <strong>everyone wins at the end! 🎉</strong> (reach 100 for an instant win!)<br><br>🐕🐩🐶🦮 Great for young kids, therapy, and family play.',
       }
  ],
  fullGuideBtn: "📚 Full game guide",
  simpleGuide: (level, device) => {
    const goal = {
      i: "🎯",
      t: "The Goal",
      x: 'Help the dog collect as many pellets as you can! 🦴<br><br>Each turn you solve an exercise, move across the board, and collect pellets.<br><br>Whoever collects the most pellets wins! 🏆🐶',
    };
    const steps = {
      i: "🎮",
      t: "How to play — 3 steps",
      x: '<strong>1.</strong> Get an exercise and tap the right number on the board. 🔢<br><br><strong>2.</strong> Build a route from the dog to that number. 🗺️<br><br><strong>3.</strong> At every step solve a little exercise and move — each step earns pellets! 🦴<br><br>Made a mistake? Try again, and there\'s a hint too 💜',
    };
    const LV: Record<string, string> = {
      beg: '🐾 <strong>Beginner</strong> — find numbers up to 40 on the board. Along the way you cross the blue door and solve easy exercises — products up to 20. Perfect to start! 😊',
      med: '⭐ <strong>Intermediate</strong> — find numbers up to 60. The door exercises along the way go up to 40.',
      adv: '🌟 <strong>Advanced</strong> — find numbers up to 90. The door exercises along the way go up to 64.',
      champ: '🏆 <strong>Champion</strong> — find numbers up to 100. The door exercises along the way go up to 81.',
      hero: '⚡ <strong>Hero</strong> — long multiplication (two-digit × one-digit), on the full board up to 100.',
    };
    const levelPage = level
      ? {
          i: "📊",
          t: "Your Level",
          x: `${LV[level]}<br><br>Every step on the board earns pellets — the harder the door, the more pellets you get! 🦴`,
        }
      : {
          i: "📊",
          t: "Five Levels",
          x: 'The game has 5 levels, from easy to hard:<br><br>🐾 Beginner · ⭐ Intermediate · 🌟 Advanced · 🏆 Champion · ⚡ Hero<br><br>Pick the level that fits you — each level has its own exercises and board. You can always switch! 😊',
        };
    const screenPage = {
      i: device === "mobile" ? "📱" : "🖥️",
      t: "Where things are",
      x:
        device === "mobile"
          ? 'The board fills the screen. ➕ ➖ make it bigger or smaller, and you can drag it with your finger. 🗺️<br><br>The bank tab 🏦 on the edge opens a drawer: how many pellets everyone has, what each door is worth, and your route details.<br><br>When the route is ready, a green strip slides up from the bottom to confirm it. ✅'
          : 'The board sits in the middle, and a column on the side stays open the whole time: the turn buttons, how many pellets everyone has, what each door is worth, and your route details. 📚<br><br>When the route is ready, a green window pops up at the bottom center to confirm it. ✅',
    };
    const pages = [goal, steps, levelPage, screenPage];
    if (level === "adv" || level === "champ" || level === "hero") {
      pages.push({
        i: "🧩",
        t: "Factor Hunt",
        x: 'Higher levels have a special bonus! 🧩<br><br>When you reach the target number, you can break it into two numbers that multiply to it (e.g. <span dir="ltr" style="white-space:nowrap">4 × 6 = 24</span>) — and earn extra pellets! 🦴<br><br>Stepping on hexes with a gold ring (factors of the target) also earns a bonus.',
      });
    }
    return pages;
  },
  back: "← Back",
  next: "Next →",
  gotItDone: "Got it! ✅",

  tour: (level, device) => {
    // Where the panels live on this device — an always-open column on a computer,
    // a drawer behind the bank tab on a phone.
    const here = device === "mobile" ? "in the bank-tab drawer 🏦" : "here on the side";
    const mathByLevel: Record<string, string> = {
      beg: "times table — answers up to 40",
      med: "times table — answers up to 60",
      adv: "times table — answers up to 90",
      champ: "times table — answers up to 100",
      hero: "long multiplication — two-digit × one-digit",
    };
    const topNum: Record<string, number> = { beg: 40, med: 60, adv: 90, champ: 100, hero: 100 };
    const timeByLevel: Record<string, string> = {
      beg: "3 minutes",
      med: "3 minutes",
      adv: "3 minutes",
      champ: "2 minutes",
      hero: "1:30 min",
    };
    const answerStyle =
      level === "beg" || level === "med"
        ? "tap the button with the correct answer."
        : 'type your answer and press "✅ Confirm".';
    const oneDoor = level === "beg"; // Beginner has a single door (Bone)
    const factorActive = level === "adv" || level === "champ" || level === "hero";
    const pages: TourStep[] = [
      {
        i: "🐕",
        t: "Hi! Let's learn to play",
        target: "center",
        x: 'This is a <strong>guided tour</strong> — we\'ll go through every part of the board, the options, and how to play, step by step. 😊<br><br>Tap <strong>"Next"</strong> to continue, or ✕ to leave any time.',
      },
      {
        i: "📋",
        t: "The top bar",
        target: "header",
        x: `At the top you can always see:<br><br>👦 <strong>Whose turn it is</strong> — the name of the current player.<br>⏱ <strong>The clock</strong> — appears here once you start moving, showing the time left in the turn (this level: ${timeByLevel[level]}).<br>🔊 <strong>Music</strong> — turns the background music on or off. The little arrow beside it opens a volume slider.<br>📖 <strong>Help</strong> — opens the guide any time.<br>✖ <strong>Exit</strong> — ends the game.`,
      },
      {
        i: "🗺️",
        t: "This is the game board",
        target: "board",
        x: `Every hex is a number. On the first turn the dog 🐕 starts at the first hex, and on each turn after that it continues from the hex it reached. The goal is to travel across the board and collect as many pellets as you can 🦴.<br><br>On this level the numbers go up to <strong>${topNum[level]}</strong>. You can drag or scroll to move the board and see all of it.`,
      },
      {
        i: "🎯",
        t: "Step 1 — Find the target",
        target: "panel",
        x: `Here you get an exercise (${mathByLevel[level]}).<br><br>Solve it and tap the hex with the answer on the board. 🔢<br><br>Need help? There's a <strong>💜 Hint</strong> button, there's <strong>💡 Show Answer</strong>, and there's a <strong>times-table</strong> helper too.`,
      },
      {
        i: "🖐️",
        t: "Your turn — find it!",
        target: "board",
        stage: "find",
        interact: "find",
        x: "Let's try for real! Solve the exercise below and tap the hex with the answer on the board. 👆<br><br>Not sure? Ask for a hint 💜 or reveal the answer — you can't skip an exercise.",
      },
      {
        i: "🚪",
        t: oneDoor ? "The door you cross" : "The colored doors",
        target: "doors",
        x: oneDoor
          ? `The colored lines between the hexes on the board are <strong>doors</strong> 🚪.<br><br>On Beginner there is one door — the <strong>blue door</strong>. <strong>${here}</strong> you can see it: which exercise you cross and how many pellets it is worth. Each time you cross it you solve a small exercise and earn a pellet. Higher levels add more door colors — harder, but worth more pellets!`
          : `The colored lines between the hexes on the board are <strong>doors</strong> 🚪, and each color is a different level of difficulty.<br><br><strong>${here}</strong> you can see all the doors for this level — which exercise hides in each and how many pellets it is worth. <strong>The harder the door, the more pellets you earn!</strong> 🦴`,
      },
      {
        i: "🐾",
        t: "Step 2 — Build the route",
        target: "board",
        x: 'Once you found the target, build a route from the dog to it — tap hex after hex. Each hex must touch the previous one.<br><br>The color of the line you cross decides which exercise will be there. 🗺️',
      },
      {
        i: "🧾",
        t: "Route details",
        target: "routedetail",
        stage: "route",
        x: `${here.charAt(0).toUpperCase() + here.slice(1)} you get the <strong>full route breakdown</strong>: each step, which door you cross, and how many pellets it is worth. 🦴<br><br>That way you can compare routes and choose wisely.`,
      },
      {
        i: "🧠",
        t: "Strategy & confirming",
        target: "panel",
        stage: "route",
        x: `You can see the <strong>total pellets</strong> you can collect on this route. 🦴<br><br>A short route = fewer exercises but fewer pellets; hard doors = more pellets. Pick the route that suits you!<br><br>Once the route reaches the target, ${device === "mobile" ? "a green strip slides up from the bottom" : "a green window pops up at the bottom center"}: <strong>"Route ready!"</strong> — tap it and off you go, or <strong>🗑 Clear</strong> and build again.`,
      },
      {
        i: "🧩",
        t: "Factoring",
        target: "board",
        x: 'This level has a special bonus! 🧩<br><br>The hexes with a <strong>gold frame</strong> are <strong>factors</strong> of the target (numbers that divide it). Walk over them on the way and you earn <strong>+2 pellets</strong> for each! 🦴<br><br>And when you reach the target, you can break it into two numbers that multiply to it — for an extra bonus! 🎉',
      },
      {
        i: "🦴",
        t: "Step 3 — Set off!",
        target: "panel",
        x: `Now you walk, and the clock starts ticking ⏱.<br><br>At each step you solve the door's exercise — ${answerStyle} Correct? You move forward and collect pellets! 🦴<br><br>Mistake? Try again or ask for a hint 💜. You can also give up — you lose the turn but keep what you already collected.`,
      },
      {
        i: "🖐️",
        t: "Your turn — open a door!",
        target: "panel",
        stage: "walk",
        interact: "answer",
        x: "Now solve the door's exercise and choose the answer. 🦴<br><br>Not sure? Ask for a hint 💜, or reveal the answer if you must (the dog stops, but the pellets you already collected are kept). You can't skip an exercise.",
      },
      {
        i: "🙋",
        t: "Help and earn",
        target: "helper",
        x: `Even when it's not your turn — you can help! 🙋<br><br>First the player in turn gets a few seconds to try alone. After that (or right away after a wrong answer) you can tap your own name ${here}, type the answer — and if you are right, <strong>+1 pellet for helping</strong>! 🦴<br><br>In a game played together, where everyone has their own device, this window pops up front and center for whoever is not playing, with the exercise the active player is solving. 🧠`,
      },
      {
        i: "✨",
        t: "Surprise hexes",
        target: "board",
        x: `Some hexes have special symbols:<br><br>💎 <strong>Bonus</strong> — a gift! (double pellets / extra turn and more)<br>🚧 <strong>Challenge</strong> — a small rule to collect<br>🎲 <strong>Surprise</strong> — the rules change!<br>🦹 <strong>Robber</strong> — steal pellets from a rival${level === "beg" ? " (on Beginner you can turn it off in settings)" : ""}`,
      },
      {
        i: "🏆",
        t: "Score & who wins",
        target: "sidebar",
        x: `${here.charAt(0).toUpperCase() + here.slice(1)} you can always see how many pellets each player has 🦴, and the doors-and-points table.<br><br>Whoever collects the most pellets — wins! 🎉`,
      },
      {
        i: "🎉",
        t: "That's it, you're ready!",
        target: "center",
        x: 'Now it\'s your turn — let\'s really play! 🐕🦴',
      },
    ];
    // The factoring step only applies from Advanced up.
    return factorActive ? pages : pages.filter((p) => p.i !== "🧩");
  },
  demoGameBtn: "🧭 Guided tour",
  demoPlayerName: "Demo",
  demoHelperName: "🐩 Friend",
  tourFinish: "🎮 Let's play!",
  tourExit: "Skip the tour",
  tourSolved: "✅ Nice! You got it 🎉",
  tourYourTurn: "👉 Your turn — solve it:",

  setupTitle: "⚙️ Game Settings",
  howManyPlayers: "👥 How many players?",
  playerNamesLabel: "✏️ Player names (optional):",
  playerPlaceholder: (dog, i) => `${dog} Player ${i + 1}...`,
  difficulty: "📊 Difficulty",
  levels: {
    beg: { icon: "🐾", name: "Beginner", desc: "Board to 40 · products to 20", board: "Board to 40" },
    med: { icon: "⭐", name: "Intermediate", desc: "Board to 60 · products to 40", board: "Board to 60" },
    adv: { icon: "🌟", name: "Advanced", desc: "Board to 90 · products to 64", board: "Board to 90" },
    champ: { icon: "🏆", name: "Champion", desc: "Board to 100 · products to 81 | 2 min", board: "Board to 100" },
    hero: { icon: "⚡", name: "Hero", desc: "Long multiplication | (11–19)×(2–9) | 1:30 min", board: "Long multiplication" },
  },
  options: "🔧 Options",
  whatsThis: "What's this?",
  optTimer: "⏱ Turn timer",
  optMc: "🔤 Choice buttons (Beginner/Intermediate)",
  optRob: "🦹 Steal mechanic",
  optCoop: "🤝 Cooperative — collect together!",
  optFocus: "🎯 Focus mode — no special hexes (fewer distractions)",
  winCondition: "🏁 Win Condition",
  winModes: {
    rounds: { icon: "🔄", name: "4 Rounds", desc: "Most pellets after 4 rounds wins" },
    first100: { icon: "🎯", name: "First to 100", desc: "Reach 100 pellets = instant win!" },
    both: { icon: "⚡", name: "Both", desc: "4 rounds, but 100 = instant win" },
  },
  startShort: "🚀 Start!",

  gameTitle: "🐕🍖 Dogylishios",
  turn: (name) => `Turn: ${name}`,
  roundLabel: (round, total) => `Round ${round} of ${total}`,
  instAria: "Help & how to play",
  musicOn: "Turn the music off",
  musicOff: "Turn the music on",
  musicVolume: "Music volume",
  defaultPlayerName: (_dog, i) => `Player ${i + 1}`,

  p1Hint:
    "<strong>Step 1 — Find the Target 🎯</strong><br>Solve the equation and click the hex with the answer on the board!",
  targetCardLabel: (_id, prime) => `🃏 Target Card${prime ? " 🎲 Prime!" : ""}`,
  targetExpr: (ex) => `${ex} = ?`,
  targetInstruction: (prime) =>
    `${prime ? "🔮 Prime number — Twist card awaits!<br>" : ""}Click the hex on the board 👆`,
  showAnswer: "💡 Show Answer",
  wrongHexInline: (n) => `Hex ${n} is wrong — try again! 😊`,
  hintBtn: "💜 Hint",
  hintResult: (expr) => calcHintEn(expr),

  p2Hint: (target) =>
    `🎯 Target: <strong>hex ${target}</strong> · tap neighbouring hexes to build the route 🗺️`,
  p2Empty: "Click hexes on the board to build the route 👆",
  stepHexLabel: (h) => `→ Hex ${h}`,
  doorLabel: (key) => DOOR_LABELS[key],
  pathDoorLabel: (key, pts) => `${DOOR_LABELS[key]} | ${DOOR_RANGES[key]} | ${pts}🦴`,
  possiblePellets: (pts, steps) =>
    `🦴 <strong>Total possible: ${pts} pellets</strong> in ${steps} steps`,
  routeTradeoff:
    "💡 Every coloured line is a <strong>door</strong> — a harder door is worth more pellets. <strong>The route you choose decides how much you earn!</strong>",
  routeMadeOf: "Doors on the way:",
  routeNotReach: (target) => `⚠️ Route doesn't reach Hex ${target}!`,
  confirmRoute: "✅ Confirm Route",
  clearRoute: "🗑 Clear",
  newTarget: "← New Target",
  routeReadyTitle: "🗺️ Route ready!",
  routeReadyLine: (pts, steps) =>
    `${steps} ${steps === 1 ? "step" : "steps"} · worth up to <strong>${pts}</strong> 🦴`,

  p3Hint: (step, total, doorLabel, pts, turnPts) =>
    `<strong>Step 3 — Off you go! 🐕</strong><br>Step ${step}/${total} | ${doorLabel} | ${pts} 🦴<br>🦴 Earned this turn: <strong>${turnPts}</strong>`,
  rollFor: (doorLabel) => `🎲 Roll ${doorLabel}`,
  orClickHex: "or click the hex with the answer on the board 👆",
  answerPlaceholder: "Answer...",
  confirmAnswer: "✅ Confirm",
  wrongTryAgain: "❌ Wrong! Try again, or reveal the answer — the pellets you collected are kept 😊",
  revealEndsTurn: "💡 Reveal Answer (turn ends, pellets kept 🦴)",

  revealTitle: (ans) => `💡 The Answer: ${ans}`,
  revealBody: (ans) => `Find Hex <strong>${ans}</strong> on the board and click it.`,
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
  coopNoRob: "🦹 No stealing in cooperative mode — keep going together!",
  collectPellets: "🦴 Collect Pellets!",
  cards: {
    lim_even: { t: "Even Only!", tx: "Your pellet total must be even. Not even? 1 pellet comes off 🦴" },
    lim_odd: { t: "Odd Only!", tx: "Your pellet total must be odd. Not odd? 1 pellet comes off 🦴" },
    lim_three: {
      t: "3 Door Colors",
      tx: "Did you cross fewer than 3 doors of different colors?<br>Then only half your pellets stay!",
    },
    lim_nored: {
      t: "No Red or Black Door!",
      tx: "Did you cross a red door or a black door this turn?<br>Then the pellets it gave you come off!",
    },
    lim_short: {
      t: "Short Route",
      tx: "Was your route longer than 4 steps?<br>Then only 75% of your pellets stay",
    },
    bon_dbl: { t: "Double Pellets! 🦴🦴", tx: "Get ×2 all the pellets you earned this turn!" },
    bon_extra: { t: "Extra Turn! 🎉", tx: "Congratulations — you get an extra turn!" },
    bon_speed: { t: "Speed Route ⚡", tx: "Finished in less than half the time? Get +20 pellets!" },
    bon_add10: { t: "+10 Pellets 🦴", tx: "Just for reaching the target — +10 extra pellets! 🦴" },
    bon_steps: { t: "Step Bonus 🐾", tx: "Get +2 pellets for every step you walked!" },
    twi_extra: { t: "Extra Turn! 🔄", tx: "Lucky you — an extra turn!" },
    twi_teleport: { t: "Jump! 🎲", tx: "The prime hex's power flings you to a new spot on the board!" },
    twi_swap: { t: "Swap Positions! 🔀", tx: "Trade places! You and another player swap positions on the board." },
    twi_dblOrHalf: { t: "Double or Half? 🎲", tx: "Fate decides: <strong>double your pellets</strong> — or <strong>halve them</strong>. 50/50!" },
    twi_give5: { t: "Generous! 🤝", tx: "Up to 5 pellets from your bank go to the player with the fewest pellets." },
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
  confirmEndBody: "We'll show what you managed, and the results are saved. 📊",
  cancel: "Cancel",
  endGame: "End",
  close: "Close",

  settingsHelpTitle: "❓ Settings Guide",
  settingsHelpBody: `
    <div style="display:flex;flex-direction:column;gap:11px;margin-top:10px">
      <div style="background:#f9fafb;border-radius:10px;padding:11px 13px">
        <strong>⏱ Turn Timer</strong>
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">When on — the clock starts when the dog sets off, and you have 3 minutes to finish the walk (2 min for Champion, 1:30 for Hero). Pellets earned before time runs out are <strong>saved!</strong><br>💡 Turn it off for young children, first-time players, or relaxed cooperative play.</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:11px 13px">
        <strong>🏁 Win Condition</strong>
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">
        <strong>🔄 4 Rounds</strong> — Everyone plays 4 full rounds; most pellets wins. Balanced and time-limited.<br>
        <strong>🎯 First to 100</strong> — Game continues until a player hits 100 pellets for an instant win (if no one reaches 100 within 10 rounds, the leader wins). Great for longer sessions.<br>
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
      <div style="background:#f9fafb;border-radius:10px;padding:11px 13px">
        <strong>🎯 Focus Mode</strong>
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">Hides every special hex from the board — no bonus cards, no limits, no stealing, and no Twist cards. The dog simply travels and solves exercises, with no surprises or pop-up cards in the middle of a turn.<br><strong>Who's it for?</strong> Children who struggle with attention and are easily distracted, and any time you want all the focus on the math itself.<br>💡 The factoring challenge (at higher levels) still stays — it's part of the math, not a distraction.</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:11px 13px">
        <strong>🎓 Free Play</strong>
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">A no-score, no-winner mode — instead of pellets, it simply counts how many exercises each player solved. No pressure to win, no stealing, and the game doesn't end after 4 rounds — play as long as you like.<br><strong>Who's it for?</strong> Children who feel stressed by competition, relaxed practice, and a lesson or therapy session focused purely on learning.<br>💡 Best when the goal is lots of enjoyable math practice — without the distraction of scores and winning.</p>
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

  winnerTitle: "Winner! 🏆",
  winnerSuffix: " 🎉",
  stoppedTitle: "That's a wrap! 🐕",
  soloTitle: "Nicely done! 🌟",
  soloSummary: (pellets) => `You collected ${pellets} pellets 🦴`,
  freePlayTitle: "Great practice! 🎓",
  freePlaySummary: (solved) => `${solved} exercises solved`,
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
  sharedProgress: (shared) => `🦴 ${shared}/100 to win!`,
  hexLabel: (h) => `📍 Hex ${h}`,

  doorLegendTitle: "🚪 Doors & Pellets",
  doorLegendPts: (pts) => `${pts}🦴`,
  doorDifficulty: (key) => DOOR_DIFFICULTY[key],
  doorMenuLead: "Each door has its own line on the board — colour and pattern show how hard it is and what it pays",

  bankTitle: "🏦 The Bank — what we collected",
  stepPrizeTitle: "🎁 This step's prize",
  doorMenuTitle: "🚪 What each door is worth",
  pelletsUnit: (n) => `${n} ${n === 1 ? "pellet" : "pellets"}`,
  bankEmpty: "No pellets collected yet",
  bankChipTitle: (door, count) => `${door} × ${count}`,
  tabPlay: "🎯 Exercise",
  tabBoard: "🗺️ Board",
  boardBannerFind: "🎯 Solve the exercise and tap the hex with the answer",
  boardBannerRoute: (target) => `🗺️ Build a route to hex ${target} — then go back to «Exercise» to confirm`,
  boardBannerWalk: "🐕 Tap the hex with the answer, or solve in «Exercise»",

  winFindTitle: "🎯 Find the target",
  winRouteTitle: "🗺️ Your route",
  winWalkTitle: "🐕 On the way!",
  progStep: (step, total) => `Step ${step}/${total}`,
  progEarned: (n) => `Earned ${n}🦴`,
  progLeft: (steps, pellets) => `${steps} steps left · about ${pellets}🦴`,
  progDogAt: (hex) => `🐕 hex ${hex}`,
  helperTitle: "🙋 Friends help",
  helperWaiting: "When the active player gets an exercise — you can help and earn a pellet!",
  helperSolvedNote: (name) => `🙋 ${name} got it right! You can reveal the answer.`,
  helperRevealBtn: "👁 Reveal the friend's answer",
  helperAnswerReveal: (ans) => `💡 Friend's answer: ${ans}`,
  bankBtnLabel: "🏦 The Bank",
  bankTab: "Bank",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  zoomReset: "Fit the board",
  rotateHint: "📱 Tip: turn your phone sideways — the board gets much bigger!",
  rotateHintClose: "Got it",

  helpCardBtn: "Times Table",

  spectatorPrompt: "Does anyone else know? Click your name:",
  spectatorAnswerFor: (name) => `${name} answers:`,
  spectatorCorrect: (name) => `+1 for ${name}! 🎉`,
  spectatorWrong: "❌ Wrong",
  helperOnlineTitle: (name) => `🙋 ${name} is solving right now — do you know the answer?`,
  helperOnlineHold: (name) => `🤫 Hang on, let ${name} try first…`,
  helperOnlineSend: "✅ Send answer",

  primeHexTitle: (n) => `🎲 Prime Hex — ${n}!`,
  primeHexMsg: (n) => `<strong>${n}</strong> is a prime number — only divisible by 1 and itself, and it can't be broken into factors!<br>That means a Twist card is waiting for you! 🎲`,
  drawTwistAfterPrime: "🎲 Draw Twist Card!",

  factorTitle: (n) => `🧩 Break ${n} into factors!`,
  factorPrompt: (n) =>
    `Find two numbers (each 2 or more) that multiply to <strong>${n}</strong>.<br>Get it right for a bonus! 🦴`,
  factorCheck: "✅ Check",
  factorSkipBtn: "Skip",
  factorCorrect: (a, b, n, bonus) =>
    `🎉 Nice! <span dir="ltr">${a} × ${b} = ${n}</span> — bonus +${bonus} 🦴`,
  factorWrong: (n) => `Almost! Two numbers that multiply to ${n}. Try again 😊`,
  factorTilesBonus: (count, pts) =>
    `🧩 You stepped on ${count} factor hex(es) of the target — bonus +${pts} 🦴`,
  factorHuntHint: (target) =>
    `🧩 The gold-outlined hexes are factors of ${target} — walk on them for a bonus!`,

  optFreePlay: "🎓 Free Play — count exercises (no scoring)",
  freeSolvedCount: (n) => `✅ ${n}`,

  p2CoopHint: "💡 Cooperative: all pellets go into the shared bank!",

  statTitle: "🧠 Retrieval",
  statAccuracy: (correct, total) => `Accuracy: ${correct}/${total}`,
  statSpeed: (sec) => `Avg time: ${sec}s`,
  statNoData: "—",

  quickStartBtn: "🚀 Quick Start!",
  quickStartTitle: "⚡ 3 Simple Steps",
  quickStartSteps: [
    "🎯 Step 1: Solve a math problem and click the hex with the answer",
    "🗺️ Step 2: Plan a route to the target hex by clicking hexes on the board",
    "🐕 Step 3: Cross each door by solving a multiplication problem — and earn pellets!",
  ],
  quickStartGo: "🎮 Let's Play!",

  quickLaunchBtn: "⚡ Quick Launch",
  qlTitle: "⚡ Quick Launch",
  qlSub: "Pick a level and how many players, then tap a setup to start playing right away.",
  qlLevelLabel: "📊 Level",
  qlPlayersLabel: "👥 Players",
  qlReviewNote: "🧠 In Quick Launch the game remembers each player's mistakes and brings them back for extra practice.",
  qlAdvanced: "⚙️ Advanced settings",
  qlPickSetup: "👇 Pick a setup to start playing",
  qlLearnLabel: "🙂 First time? Learn in a minute",
  qlTourHint: "To get to know the board — pick a level, then tap “Guided tour”.",
  qlStart: (presetName) => `▶ Start: ${presetName}`,
  presets: {
    focus: {
      icon: "🎯",
      name: "Focused Practice",
      desc: "Calm board, no timer, still scored — full attention on the math.",
    },
    free: {
      icon: "🎓",
      name: "Free Practice",
      desc: "No score, no winner, no pressure — just count the exercises solved.",
    },
    calm: {
      icon: "🤝",
      name: "Calm & Together",
      desc: "Cooperative, gentle, low-distraction — everyone on one team.",
    },
    full: {
      icon: "🎮",
      name: "Full Game",
      desc: "The complete experience — timer, steal, surprises and all.",
    },
  },

  phaseLabels: ["Find Target", "Plan", "Go!"],

  playTogether: "👫 Play together",
  lobbyTitle: "👫 Play together",
  lobbyIntro:
    "Play one board together, each on your own screen. One person starts the game and reads out the code; everyone else types it in.",
  lobbyCreateBtn: "🎲 Start a game",
  lobbyJoinBtn: "🔑 Join a game",
  lobbyBackBtn: "← Back",
  lobbyYourNameLabel: "Your name",
  lobbyCodeEnterLabel: "Type the code you were given",
  lobbyJoinGoBtn: "Join",
  lobbyCreateGoBtn: "Create the game",
  lobbyWaitTitle: "Waiting to start",
  lobbyCodeLabel: "Your game code",
  lobbyCodeHint: "Read this out — everyone types it to join.",
  lobbyPlayersHere: (here, max) => `Players (${here} of ${max})`,
  lobbyHostTag: "host",
  lobbyYouTag: "you",
  lobbyAwayTag: "away",
  lobbyWaitingForPlayer: "Waiting for someone to join…",
  lobbyWaitingForHost: "Waiting for the host to start the game…",
  lobbyStartBtn: "🚀 Start the game!",
  lobbyLeaveBtn: "Leave",
  lobbyClosedTitle: "The game was closed",
  lobbyClosedBody: "The host ended this game for everyone.",
  lobbyErrors: {
    badCode: "That code doesn't look right — check it and try again.",
    notFound: "No game with that code. Check it, or ask for it again.",
    full: "That game is full — it already has four players.",
    alreadyStarted: "That game has already started.",
    nameTaken: "Somebody in that game is already using that name — pick another.",
    notYourTurn: "It isn't your turn yet.",
    notHost: "Only the person who started the game can do that.",
    notPlaying: "The game hasn't started yet.",
    needPlayers: "You need at least one player to start.",
    gameEnded: "That game has finished.",
    busy: "Everyone tapped at once — try that again.",
    server: "Something went wrong. Try again in a moment.",
  },
  onlineYourTurn: "🎲 Your turn!",
  onlineWaitingFor: (name) => `⏳ ${name} is playing…`,
  onlineEndForAll: "End for everyone",
};
