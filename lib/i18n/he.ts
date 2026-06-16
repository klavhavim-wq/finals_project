import type { DoorKey, EffResult } from "../engine/types";
import type { Dict, TourStep } from "./index";

const DOOR_LABELS: Record<DoorKey, string> = {
  blue: "🦴 עצם",
  purple: "🐟 דג",
  yellow: "🍗 כנף",
  red: "🌭 נקניקיה",
  redlong: "🥩 סטייק",
};

const DOOR_RANGES: Record<DoorKey, string> = {
  blue: "4–20",
  purple: "10–40",
  yellow: "24–64",
  red: "42–81",
  redlong: "11–19 × 2–9",
};

function ltr(s: string): string {
  return `<span dir="ltr">${s}</span>`;
}

function mulHintHe(a: number, b: number): string {
  if (a === 10 || b === 10) {
    const x = a === 10 ? b : a;
    return `💜 רמז: לכפול ב-10 — הוסיפו אפס בסוף המספר ${x}!`;
  }
  if (a === 5 || b === 5) {
    const x = a === 5 ? b : a;
    return `💜 רמז: לכפול ב-5 = לכפול ב-10 ואז לחלק ב-2<br>${ltr(`${x} × 10 = <strong>${x * 10}</strong> ÷ 2 = ?`)}`;
  }
  if (a === 2 || b === 2) {
    const x = a === 2 ? b : a;
    return `💜 רמז: לכפול ב-2 = לחבר את המספר לעצמו — ${ltr(`${x} + ${x} = ?`)}`;
  }
  if (a === 9 || b === 9) {
    const x = a === 9 ? b : a;
    return `💜 רמז: כפל ב-9 = כפל ב-10 פחות פעם אחת — ${ltr(`${x} × 10 = <strong>${x * 10}</strong>`)}, ואז ${ltr(`− ${x} = ?`)}`;
  }
  if (a >= 10) {
    const t = Math.floor(a / 10) * 10, o = a % 10;
    return `💜 רמז: פרקו את ${a} ל-${ltr(`${t}+${o}`)}:<br>${ltr(`(${t} × ${b}) + (${o} × ${b}) = ?`)}`;
  }
  if (b >= 10) {
    const t = Math.floor(b / 10) * 10, o = b % 10;
    return `💜 רמז: פרקו את ${b} ל-${ltr(`${t}+${o}`)}:<br>${ltr(`(${a} × ${t}) + (${a} × ${o}) = ?`)}`;
  }
  const [s, g] = a <= b ? [a, b] : [b, a];
  if (g <= 4) {
    const partial = Array.from({ length: g - 1 }, (_, i) => s * (i + 1)).join(", ");
    return `💜 רמז: התחילו מ-${s} והוסיפו עוד ${s} כל פעם — ${ltr(`${partial}, ?`)}`;
  }
  return `💜 רמז: פרקו: ${ltr(`(${s} × 5) + (${s} × ${g - 5}) = ?`)}`;
}

function calcHintHe(expr: string): string {
  const mParts = expr.split(/\s*×\s*/);
  if (mParts.length >= 2 && mParts.every(p => /^\d+$/.test(p.trim()))) {
    const nums = mParts.map(p => parseInt(p.trim()));
    if (nums.length === 2) return mulHintHe(nums[0], nums[1]);
    return `💜 רמז: ${ltr(`${nums[0]} × ${nums[1]} = <strong>${nums[0] * nums[1]}</strong>`)}, ואז ${ltr(`× ${nums[2]} = ?`)}`;
  }
  const dM = expr.match(/^(\d+)\s*÷\s*(\d+)$/);
  if (dM) {
    const [a, b] = [+dM[1], +dM[2]];
    if (b === 2) return `💜 רמז: לחלק ב-2 זה חצי — מה חצי מ-${a}?`;
    return `💜 רמז: ${ltr(`${b} × ? = ${a}`)} — מה המספר החסר?`;
  }
  const sM = expr.match(/^(\d+)\s*[−-]\s*(\d+)$/);
  if (sM) {
    const [a, b] = [+sM[1], +sM[2]];
    if (b <= 3) return `💜 רמז: ספרו ${b} אחורה מ-${a}`;
    if (a % 10 === 0) return `💜 רמז: הפחיתו 10 מ-${a}, ואז הוסיפו ${10 - b} חזרה`;
    return `💜 רמז: ${ltr(`${a} − ${b}`)} — מה מקבלים?`;
  }
  const aM = expr.match(/^(\d+)\s*\+\s*(\d+)$/);
  if (aM) {
    const [a, b] = [+aM[1], +aM[2]];
    const [small, big] = a <= b ? [a, b] : [b, a];
    if (a % 10 === 0 || b % 10 === 0)
      return `💜 רמז: התחילו מ-<strong>${big}</strong> וספרו עוד <strong>${small}</strong>`;
    if (small <= 3) {
      if (small === 1) return `💜 רמז: ספרו 1 קדימה מ-${big}`;
      const steps = Array.from({ length: small - 1 }, (_, i) => big + i + 1).join(", ");
      return `💜 רמז: ספרו ${small} קדימה מ-${big}: ${ltr(`${steps}, ?`)}`;
    }
    const nextRound = Math.ceil(big / 10) * 10;
    const toNext = nextRound - big;
    const leftover = small - toNext;
    if (toNext > 0 && leftover > 0)
      return `💜 רמז: ${ltr(`${big} + ${toNext} = <strong>${nextRound}</strong>`)}, ואז עוד ${ltr(`${leftover} = ?`)}`;
    const steps = Array.from({ length: small - 1 }, (_, i) => big + i + 1).join(", ");
    return `💜 רמז: התחילו מ-${big}: ${ltr(`${steps}, ?`)}`;
  }
  return `💜 רמז: חשבו צעד-צעד! 🐾`;
}

function formatEff(r: EffResult): string {
  switch (r.eff) {
    case "dblPts":
      return `🦴×2! סה"כ: <strong>${r.total}</strong> גרגירים`;
    case "add10":
      return `+10 🦴! סה"כ: <strong>${r.total}</strong> גרגירים`;
    case "speedBonus":
      return r.applied
        ? `+20 🦴 על מהירות! סה"כ: <strong>${r.total}</strong> גרגירים`
        : "לא מהיר מספיק הפעם 😅";
    case "stepsBonus":
      return `+${r.steps * 2} 🦴 (${r.steps} צעדים × 2)! סה"כ: <strong>${r.total}</strong> גרגירים`;
    case "evenOnly":
      return r.applied
        ? `הגרגירים אי-זוגיים — צריך זוגי! −1 🦴 — נשאר: <strong>${r.total}</strong>`
        : "✅ הגרגירים זוגיים! אפשר להמשיך";
    case "oddOnly":
      return r.applied
        ? `הגרגירים זוגיים — צריך אי-זוגי! −1 🦴 — נשאר: <strong>${r.total}</strong>`
        : "✅ הגרגירים אי-זוגיים! אפשר להמשיך";
    case "threeColors":
      return r.applied
        ? `רק ${r.count} סוגי אוכל — חצי מהגרגירים: <strong>${r.total}</strong>`
        : `✅ ${r.count} סוגי אוכל! אפשר להמשיך`;
    case "noRed":
      return r.applied
        ? `${r.count} דלתות אדומות! −${r.lost} 🦴 — נשאר: <strong>${r.total}</strong>`
        : "✅ ללא דלת אדומה! אפשר להמשיך";
    case "shortPath":
      return r.applied
        ? `מסלול ארוך (${r.steps} צעדים) — 75%: <strong>${r.total}</strong> 🦴`
        : "✅ מסלול קצר! אפשר להמשיך";
    case "extraTurn":
      return "🎉 תור נוסף מגיע לך!";
    case "teleport":
      return `🎲 קפצת למשושה <strong>${r.hex}</strong>! מתחילים תור חדש משם`;
    case "swapHex":
      return `🔀 החלפת מיקום עם <strong>${r.withName}</strong>! עכשיו נמצאים על משושה <strong>${r.myNewHex}</strong>`;
    case "dblOrHalf":
      return r.doubled
        ? `🎉 כפול! סה"כ: <strong>${r.total}</strong> גרגירים`
        : `😅 חצי... סה"כ: <strong>${r.total}</strong> גרגירים`;
    case "giveTokens":
      return r.given > 0
        ? `🤝 העברת <strong>${r.given}</strong> גרגירים ל-${r.toName}!`
        : `🤷 אין שחקנים אחרים לתרום להם`;
  }
}

export const he: Dict = {
  dir: "rtl",

  logoAlt: "דפי והכלבים",
  title: "כשכש-נשנש 🐕🍖",
  welcomeSub: "עזרו לכלב לצבור גרגירים בבנק שלו! 🦴",
  welcomeSub2a: "📚 לוח הכפל · עובדות יסוד · אסטרטגיה",
  welcomeSub2b: "👥 1–4 שחקנים \u00a0·\u00a0 ⏱ 20–45 דק׳",
  startGame: "🎮 התחל משחק!",
  chooseLevel: "✨ בחרו רמה כדי להתחיל",
  demoVideo: "🎬 סרטון הדגמה",
  howToPlay: "📖 איך משחקים?",
  tutorialVideos: "🎬 סרטוני הסבר",     inst: [
       {
         i: "🎮",
         t: "לוח המשחק",
         x: '<div style="display:flex;flex-direction:column;align-items:center;margin:0 0 8px"><svg width="300" height="126" viewBox="0 0 228 96" xmlns="http://www.w3.org/2000/svg"><polygon points="48,10 80.9,29 80.9,67 48,86 15.1,67 15.1,29" fill="#FFF8E7" stroke="#C9A882" stroke-width="1.5"/><polygon points="113.8,10 146.7,29 146.7,67 113.8,86 80.9,67 80.9,29" fill="#F5F3FF" stroke="#C9A882" stroke-width="1.5"/><polygon points="179.6,10 212.5,29 212.5,67 179.6,86 146.7,67 146.7,29" fill="#FFF8E7" stroke="#C9A882" stroke-width="1.5"/><line x1="80.9" y1="29" x2="80.9" y2="67" stroke="#3B82F6" stroke-width="5" stroke-linecap="round"/><line x1="146.7" y1="29" x2="146.7" y2="67" stroke="#8B5CF6" stroke-width="5" stroke-linecap="round"/><text x="48" y="58" text-anchor="middle" dominant-baseline="middle" font-size="17" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">12</text><text x="113.8" y="52" text-anchor="middle" dominant-baseline="middle" font-size="17" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">13</text><text x="179.6" y="52" text-anchor="middle" dominant-baseline="middle" font-size="17" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">14</text><text x="48" y="34" text-anchor="middle" font-size="22">🐕</text><text x="113.8" y="34" text-anchor="middle" font-size="16">🎲</text></svg></div>הלוח מכיל משושים ממוספרים — ככל שהרמה גבוהה יותר, הלוח גדול יותר (עד 100). בין המשושים יש צלעות צבעוניות — אלה ה"דלתות" שלנו! 🚪<br><br>כל צבע = סוג אוכל + רמת קושי.<br><br>🎯 <strong>המטרה:</strong> לצבור כמה שיותר גרגירים לבנק של הכלב! 🐶🦴',
       },
       {
         i: "🎯",
         t: "שלב 1 — מוצאים את היעד",
         x: 'שולפים כרטיס יעד עם תרגיל חשבון, למשל: <strong><span dir="ltr" style="white-space:nowrap">6 × 4 = ?</span></strong><br><br>פותרים בראש 🧠 ולוחצים על המשושה עם התשובה (24) בלוח!<br><br>טעות? <strong>אפשר לנסות שוב כמה פעמים שרוצים!</strong> 😊<br>רוצים עזרה? אפשר לבחור רמז 💡, או ללחוץ "הראה תשובה".<br><br>ℹ️ <strong>בשלב הזה אין הגבלת זמן!</strong>',
       },
       {
         i: "🗺️",
         t: "שלב 2 — מתכננים מסלול",
         x: '<div style="display:flex;flex-direction:column;align-items:center;margin:0 0 8px"><svg width="140" height="130" viewBox="-5 0 250 245" xmlns="http://www.w3.org/2000/svg"><polygon points="120,20 207,70 207,170 120,220 33,170 33,70" fill="#FFF8E7" stroke="#C9A882" stroke-width="2"/><line x1="120" y1="20" x2="207" y2="70" stroke="#3B82F6" stroke-width="14" stroke-linecap="round"/><line x1="207" y1="70" x2="207" y2="170" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round"/><line x1="207" y1="170" x2="120" y2="220" stroke="#F59E0B" stroke-width="14" stroke-linecap="round"/><line x1="120" y1="220" x2="33" y2="170" stroke="#EF4444" stroke-width="14" stroke-linecap="round"/><line x1="33" y1="170" x2="33" y2="70" stroke="#111827" stroke-width="14" stroke-linecap="round"/><line x1="33" y1="70" x2="120" y2="20" stroke="#3B82F6" stroke-width="14" stroke-linecap="round"/><text x="120" y="120" text-anchor="middle" dominant-baseline="middle" font-size="36" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">42</text></svg></div>לוחצים על משושים לבניית המסלול ליעד.<br>לא לשכוח לסמן גם את משושה היעד עצמו!<br><br>הצבעים של הדלתות מסמנים את רמת הקושי ואת מספר הגרגירים לכל צעד.<br><br>💡 <strong>עזרת כיוון:</strong> בזמן הבנייה, המשושים האפשריים הבאים מסומנים בגבול ירוק על הלוח.<br><br><em style="font-size:.85em;color:#64748b">הצבעים בציור הם לדוגמה — אילו דלתות יש בפועל תלוי ברמה.</em>',
       },
       {
         i: "🚪",
         t: "דלתות וגרגירים",
         x: '<div style="display:flex;flex-direction:column;gap:7px;margin:0 0 10px;font-size:.85em"><div style="padding:7px 11px;background:#EFF6FF;border-radius:8px;border-right:4px solid #3B82F6"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong style="color:#3B82F6">🦴 כחול — עצם</strong><span style="flex-shrink:0;background:#3B82F6;color:#fff;border-radius:999px;padding:2px 9px;font-weight:700;white-space:nowrap">1 גרגיר לצעד</span></div><div style="margin-top:4px;color:#475569">מכפלות <span dir="ltr">4–20</span> · למשל <span dir="ltr" style="white-space:nowrap;font-weight:600;color:#1e293b">3 × 4 = 12</span></div></div><div style="padding:7px 11px;background:#F5F3FF;border-radius:8px;border-right:4px solid #8B5CF6"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong style="color:#8B5CF6">🐟 סגול — דג</strong><span style="flex-shrink:0;background:#7C3AED;color:#fff;border-radius:999px;padding:2px 9px;font-weight:700;white-space:nowrap">2 גרגירים לצעד</span></div><div style="margin-top:4px;color:#475569">מכפלות <span dir="ltr">10–40</span> · למשל <span dir="ltr" style="white-space:nowrap;font-weight:600;color:#1e293b">4 × 5 = 20</span></div></div><div style="padding:7px 11px;background:#FFFBEB;border-radius:8px;border-right:4px solid #F59E0B"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong style="color:#B45309">🍗 כתום — כנף</strong><span style="flex-shrink:0;background:#B45309;color:#fff;border-radius:999px;padding:2px 9px;font-weight:700;white-space:nowrap">5 גרגירים לצעד</span></div><div style="margin-top:4px;color:#475569">מכפלות <span dir="ltr">24–64</span> · למשל <span dir="ltr" style="white-space:nowrap;font-weight:600;color:#1e293b">6 × 7 = 42</span></div></div><div style="padding:7px 11px;background:#FEF2F2;border-radius:8px;border-right:4px solid #EF4444"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong style="color:#EF4444">🌭 אדום — נקניקיה</strong><span style="flex-shrink:0;background:#EF4444;color:#fff;border-radius:999px;padding:2px 9px;font-weight:700;white-space:nowrap">10 גרגירים לצעד</span></div><div style="margin-top:4px;color:#475569">מכפלות <span dir="ltr">42–81</span> · למשל <span dir="ltr" style="white-space:nowrap;font-weight:600;color:#1e293b">8 × 9 = 72</span></div></div><div style="padding:7px 11px;background:#F3F4F6;border-radius:8px;border-right:4px solid #111827"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong style="color:#111827">🥩 שחור — סטייק</strong><span style="flex-shrink:0;background:#111827;color:#fff;border-radius:999px;padding:2px 9px;font-weight:700;white-space:nowrap">12 גרגירים לצעד</span></div><div style="margin-top:4px;color:#475569">כפל ארוך · למשל <span dir="ltr" style="white-space:nowrap;font-weight:600;color:#1e293b">13 × 4 = 52</span></div></div></div><em style="font-size:.8em;color:#7C3AED">סטייק — רמת גיבור בלבד!</em><br><br>קשה יותר = יותר גרגירים לבנק! 🐶',
       },
       {
         i: "✅",
         t: "בדיקה ואישור מסלול",
         x: '<div style="display:flex;flex-direction:column;align-items:center;margin:0 0 10px"><svg width="300" height="80" viewBox="0 0 245 66" xmlns="http://www.w3.org/2000/svg"><polygon points="102.0,5 115.9,13 115.9,29 102.0,37 88.1,29 88.1,13" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="129.7,5 143.6,13 143.6,29 129.7,37 115.8,29 115.8,13" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="157.4,5 171.3,13 171.3,29 157.4,37 143.5,29 143.5,13" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="185.1,5 199.0,13 199.0,29 185.1,37 171.2,29 171.2,13" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="212.8,5 226.7,13 226.7,29 212.8,37 198.9,29 198.9,13" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="32.7,29 46.6,37 46.6,53 32.7,61 18.8,53 18.8,37" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="60.4,29 74.3,37 74.3,53 60.4,61 46.5,53 46.5,37" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="18.9,5 32.8,13 32.8,29 18.9,37 5.0,29 5.0,13" fill="#FFF8E7" stroke="#C9A882" stroke-width="1.5"/><polygon points="46.6,5 60.5,13 60.5,29 46.6,37 32.7,29 32.7,13" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="74.3,5 88.2,13 88.2,29 74.3,37 60.4,29 60.4,13" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="88.1,29 102.0,37 102.0,53 88.1,61 74.2,53 74.2,37" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="115.9,29 129.8,37 129.8,53 115.9,61 102.0,53 102.0,37" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="143.6,29 157.5,37 157.5,53 143.6,61 129.7,53 129.7,37" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="171.3,29 185.2,37 185.2,53 171.3,61 157.4,53 157.4,37" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="199.0,29 212.9,37 212.9,53 199.0,61 185.1,53 185.1,37" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="226.7,29 240.6,37 240.6,53 226.7,61 212.8,53 212.8,37" fill="#FDE68A" stroke="#0891B2" stroke-width="1.5"/><line x1="32.8" y1="13" x2="32.8" y2="29" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="60.5" y1="13" x2="60.5" y2="29" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="88.2" y1="29" x2="74.3" y2="37" stroke="#8B5CF6" stroke-width="3" stroke-linecap="round"/><line x1="102.0" y1="37" x2="102.0" y2="53" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/><line x1="129.8" y1="37" x2="129.8" y2="53" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/><line x1="157.5" y1="37" x2="157.5" y2="53" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/><line x1="185.2" y1="37" x2="185.2" y2="53" stroke="#8B5CF6" stroke-width="3" stroke-linecap="round"/><line x1="212.9" y1="37" x2="212.9" y2="53" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><text x="18.9" y="14" text-anchor="middle" font-size="9">🐕</text><text x="18.9" y="27" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">1</text><text x="46.6" y="21" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif">2</text><text x="74.3" y="21" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif">3</text><text x="102.0" y="21" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#78350F" font-family="Arial,sans-serif" opacity="0.4">4</text><text x="129.7" y="21" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif" opacity="0.4">5</text><text x="157.4" y="21" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#78350F" font-family="Arial,sans-serif" opacity="0.4">6</text><text x="185.1" y="21" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif" opacity="0.4">7</text><text x="212.8" y="21" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#78350F" font-family="Arial,sans-serif" opacity="0.4">8</text><text x="32.7" y="45" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif" opacity="0.4">11</text><text x="60.4" y="45" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#78350F" font-family="Arial,sans-serif" opacity="0.4">12</text><text x="88.1" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif">13</text><text x="115.9" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">14</text><text x="143.6" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">15</text><text x="171.3" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">16</text><text x="199.0" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif">17</text><text x="226.7" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">18</text></svg><div style="font-size:.75em;color:#64748b;margin-top:2px">דוגמה: מסלול ממשושה 1 למשושה 18 🗺️</div></div>לפני שיוצאים לדרך — בדקו את המסלול! 📝<br><br>בצד המסך תראו את פירוט המסלול שבחרתם: כל צעד, סוג האוכל בכל דלת, וסך הגרגירים שתוכלו לצבור.<br><br>ככה תוכלו להחליט אם שווה לעבור דלת קשה בשביל יותר גרגירים, או לבחור דרך קלה יותר.<br><br>לא מרוצים? לוחצים "נקה" 🗑 ובונים מחדש!<br>מוכנים? לוחצים "אשר מסלול" ✅ ויוצאים לדרך!',
       },
       {
         i: "🐕",
         t: "שלב 3 — יוצאים לדרך!",
         x: 'הכלב קופץ ללוח ומתחיל לנוע! 🐾<br><br>לכל צעד:<br>1️⃣ לוחצים "זרוק" 🎲<br>2️⃣ מקבלים תרגיל כפל לפי צבע הדלת<br>3️⃣ עונים על ידי לחיצה על משושה, הקלדה, או כפתורי בחירה<br><br>✅ נכון ← הכלב מתקדם + גרגירים! 🦴<br>❌ טעות ← אפשר לנסות שוב בלי הגבלה!<br>💡 חושפים תשובה ← הכלב נעצר, <strong>הגרגירים שנצברו עד כה נשמרים!</strong> 🦴<br><br>🔢 <strong>צריכים עזרה?</strong> לחצו על כפתור "לוח כפל" בתחתית הפאנל בכל עת.<br><br>🙋 <strong>שחקנים אחרים יכולים לעזור!</strong> כשהשחקן הפעיל פותר — כל שחקן אחר לוחץ על שמו ומנסה לענות. מי שצודק מקבל +1 גרגיר! 🦴',
       },
       {
         i: "⏱",
         t: "הגבלת זמן",
         x: 'לכל רמה יש הגבלת זמן לתור:<br><br>🐾⭐🌟 <strong>מתחילים / בינוני / מתקדם</strong> — 3 דקות<br>🏆 <strong>אלוף</strong> — 2 דקות<br>⚡ <strong>גיבור</strong> — דקה וחצי<br><br>לא סיימתם בזמן? נשארים במקום, <strong>הגרגירים שנצברו נשמרים!</strong> 🦴<br><br>💡 אפשר לכבות את הטיימר בהגדרות.',
       },
       {
         i: "🏆",
         t: "איך מנצחים?",
         x: 'אפשר לבחור בהגדרות:<br><br>🔄 <strong>4 סיבובים</strong> — כולם משחקים 4 סיבובים, מי שצבר הכי הרבה מנצח!<br><br>🎯 <strong>ראשון ל-100</strong> — מגיעים ל-100 גרגירים? ניצחון מיידי! 🎉<br><br>⚡ <strong>גם וגם</strong> — 4 סיבובים, אבל אם מגיעים ל-100 לפני — ניצחון מיידי!<br><br><em style="font-size:.85em;color:#64748b">ברמות מתחילים ובינוני המשחק תמיד 4 סיבובים; «ראשון ל-100» ו«גם וגם» מתאפשרים ממתקדם ומעלה.</em><br><br>בוחרים בהגדרות לפני שמתחילים. ⚙️',
       },
       {
         i: "✨",
         t: "סימנים מיוחדים על הלוח",
         x: '<strong>💎 מספרים עגולים <span dir="ltr" style="white-space:nowrap">(10, 20, 30...)</span></strong><br>נחתתם כאן? שלפו קלף בונוס! 🎁<br>אולי תקבלו: כפול גרגירים / תור נוסף / +10 גרגירים<br><br><strong>🚧 מסתיימים ב-5 <span dir="ltr" style="white-space:nowrap">(15, 25, 35...)</span></strong><br>שלפו קלף הגבלה — אתגר לאיסוף!<br>למשל: "מספר הגרגירים חייב להיות זוגי"<br><br><strong>🦹 מסתיימים ב-6 <span dir="ltr" style="white-space:nowrap">(16, 26, 36...)</span></strong><br>שוד! ✋ אפשר לגנוב גרגירים מיריב (כ-10% מהגרגירים שלו)!<br><br><strong>🎲 מספרים ראשוניים <span dir="ltr" style="white-space:nowrap">(2, 3, 5, 7, 11, 13...)</span></strong><br>מספר שמתחלק רק ב-1 ובעצמו!<br>שלפו קלף טוויסט — הכללים משתנים! 🎲<br><br><em style="font-size:.85em;color:#64748b">💡 ב«מצב מיקוד» (בהגדרות) המשבצות המיוחדות האלה מוסתרות — לוח רגוע יותר, בלי הסחות.</em>',
       },
       {
         i: "🧩",
         t: "פירוק לגורמים",
         x: '<strong>🧩 פירוק לגורמים — מרמת מתקדם ומעלה</strong><br><br>במספרים הגדולים, כשמגיעים למספר היעד מקבלים אתגר נחמד: לפרק אותו לשני מספרים שמכפלתם נותנת אותו — למשל <span dir="ltr" style="white-space:nowrap">4 × 6 = 24</span> או <span dir="ltr" style="white-space:nowrap">3 × 8 = 24</span>.<br>פתרתם? בונוס +5 גרגירים! 🦴 <em>(אפשר גם לדלג.)</em><br><br>ובזמן תכנון המסלול — המשבצות עם <strong>מסגרת זהובה</strong> הן גורמים של היעד. כל משבצת-גורם שעוברים עליה בדרך שווה +2 גרגירים נוספים! 🐾',
       },
       {
         i: "⚙️",
         t: "הגדרות המשחק",
         x: 'לפני שמתחילים — מגדירים את העדפות המשחק שלנו:<br><br>📊 <strong>רמת קושי</strong> — מתחילים עד גיבור<br>⏱ <strong>טיימר</strong> — מופעל או כבוי<br>🔤 <strong>כפתורי בחירה</strong> — לרמות מתחילים/בינוני<br>🦹 <strong>שוד</strong> — מופעל או כבוי<br>🤝 <strong>שיתופי</strong> — כולם ביחד במקום תחרות<br>🎯 <strong>מצב מיקוד</strong> — בלי משבצות מיוחדות, פחות הסחות<br>🎓 <strong>משחק חופשי</strong> — תרגול בלי ניקוד ובלי מנצח<br>🏁 <strong>מטרת המשחק</strong> — איך מנצחים?',
       },
       {
         i: "🤝",
         t: "ביחד — מצב שיתופי",
         x: 'מפעילים "משחק שיתופי" בהגדרות.<br>במצב הזה — <strong>כולנו עובדים ביחד!</strong><br><br>✅ כל הגרגירים נכנסים לבנק המשותף 🦴<br>✅ אין שוד — כולנו אחד!<br>✅ אוספים ביחד כמה שיותר — ובסוף <strong>כולנו מנצחים! 🎉</strong> (ואם מגיעים ל-100 — ניצחון מיידי!)<br><br>🐕🐩🐶🦮 מתאים לילדים צעירים, לטיפול, ולמשחק משפחתי רגוע.',
       }
     ],
  fullGuideBtn: "📚 מדריך משחק מלא",
  simpleGuide: (level) => {
    const goal = {
      i: "🎯",
      t: "המטרה",
      x: 'עוזרים לכלב לאסוף כמה שיותר גרגירים! 🦴<br><br>בכל תור פותרים תרגיל, מתקדמים על הלוח, ואוספים גרגירים.<br><br>מי שאסף הכי הרבה גרגירים — מנצח! 🏆🐶',
    };
    const steps = {
      i: "🎮",
      t: "איך משחקים? 3 שלבים",
      x: '<strong>1.</strong> מקבלים תרגיל ולוחצים על המספר הנכון בלוח. 🔢<br><br><strong>2.</strong> בונים דרך מהכלב עד המספר. 🗺️<br><br><strong>3.</strong> בכל צעד פותרים תרגיל קטן ומתקדמים — וכל צעד שווה גרגירים! 🦴<br><br>טעות? אפשר לנסות שוב, ויש גם רמז 💡',
    };
    const LV: Record<string, string> = {
      beg: '🐾 <strong>מתחילים</strong> — מוצאים על הלוח מספרים עד 40. בדרך עוברים בדלת הכחולה ופותרים תרגילים קלים — מכפלות עד 20. מושלם להתחלה! 😊',
      med: '⭐ <strong>בינוני</strong> — מוצאים מספרים עד 60. תרגילי הדלתות שבדרך מגיעים עד 40.',
      adv: '🌟 <strong>מתקדם</strong> — מוצאים מספרים עד 90. תרגילי הדלתות שבדרך מגיעים עד 64.',
      champ: '🏆 <strong>אלוף</strong> — מוצאים מספרים עד 100. תרגילי הדלתות שבדרך מגיעים עד 81.',
      hero: '⚡ <strong>גיבור</strong> — כפל ארוך (מספר דו-ספרתי × חד-ספרתי), על הלוח המלא עד 100.',
    };
    const levelPage = level
      ? {
          i: "📊",
          t: "הרמה שלכם",
          x: `${LV[level]}<br><br>כל צעד בלוח שווה גרגירים — ככל שהדלת קשה יותר, כך מקבלים יותר גרגירים! 🦴`,
        }
      : {
          i: "📊",
          t: "חמש רמות",
          x: 'במשחק יש 5 רמות, מהקלה לקשה:<br><br>🐾 מתחילים · ⭐ בינוני · 🌟 מתקדם · 🏆 אלוף · ⚡ גיבור<br><br>בוחרים רמה שמתאימה לכם — לכל רמה תרגילים ולוח משלה. תמיד אפשר להחליף! 😊',
        };
    const pages = [goal, steps, levelPage];
    if (level === "adv" || level === "champ" || level === "hero") {
      pages.push({
        i: "🧩",
        t: "פירוק לגורמים",
        x: 'ברמות הגבוהות יש בונוס מיוחד! 🧩<br><br>כשמגיעים למספר היעד, אפשר לפרק אותו לשני מספרים שמכפלתם נותנת אותו (למשל <span dir="ltr" style="white-space:nowrap">4 × 6 = 24</span>) — ומקבלים גרגירים נוספים! 🦴<br><br>גם מעבר במשבצות עם המסגרת הזהובה (גורמים של היעד) שווה בונוס.',
      });
    }
    return pages;
  },
  back: "אחורה →",
  next: "← הבא",
  gotItDone: "✅ הבנתי!",

  tour: (level) => {
    const mathByLevel: Record<string, string> = {
      beg: "לוח הכפל — תשובות עד 40",
      med: "לוח הכפל — תשובות עד 60",
      adv: "לוח הכפל — תשובות עד 90",
      champ: "לוח הכפל — תשובות עד 100",
      hero: "כפל ארוך — מספר דו-ספרתי כפול חד-ספרתי",
    };
    const topNum: Record<string, number> = { beg: 40, med: 60, adv: 90, champ: 100, hero: 100 };
    const timeByLevel: Record<string, string> = {
      beg: "3 דקות",
      med: "3 דקות",
      adv: "3 דקות",
      champ: "2 דקות",
      hero: "דקה וחצי",
    };
    const answerStyle =
      level === "beg" || level === "med"
        ? "אפשר ללחוץ על הכפתור עם התשובה הנכונה, <strong>או</strong> ללחוץ ישר על המשושה עם התשובה בלוח."
        : "אפשר להקליד את התשובה וללחוץ «אשר», <strong>או</strong> ללחוץ ישר על המשושה עם התשובה בלוח.";
    const oneDoor = level === "beg"; // Beginner has a single door (Bone)
    const factorActive = level === "adv" || level === "champ" || level === "hero";
    const pages: TourStep[] = [
      {
        i: "🐕",
        t: "היי! בואו נלמד לשחק",
        target: "center",
        x: 'זה <strong>סיור מודרך</strong> — נעבור יחד על כל חלקי הלוח, האפשרויות, ואיך משחקים, שלב אחרי שלב. 😊<br><br>לוחצים על <strong>«הבא»</strong> כדי להתקדם, או על ✕ כדי לצאת בכל רגע.',
      },
      {
        i: "📋",
        t: "הסרגל העליון",
        target: "header",
        x: `למעלה רואים תמיד:<br><br>👦 <strong>תור של מי עכשיו</strong> — השם של מי שמשחק כרגע.<br>⏱ <strong>השעון</strong> — מופיע כאן כשמתחילים לצעוד, ומראה כמה זמן נשאר לתור (ברמה הזו: ${timeByLevel[level]}).<br>📖 <strong>עזרה</strong> — פותח את ההסבר בכל רגע.<br>✖ <strong>יציאה</strong> — מסיים את המשחק.`,
      },
      {
        i: "🗺️",
        t: "זה לוח המשחק",
        target: "board",
        x: `כל משושה הוא מספר. בתור הראשון הכלב 🐕 מתחיל מהמשושה הראשון, ובכל תור הבא הוא ממשיך מהמשושה שאליו הגיע. המטרה: לטייל על הלוח ולאסוף כמה שיותר גרגירים 🦴.<br><br>ברמה הזו המספרים מגיעים עד <strong>${topNum[level]}</strong>. אפשר לגרור או לגלול כדי להזיז את הלוח ולראות את כולו.`,
      },
      {
        i: "🎯",
        t: "שלב 1 — מוצאים את היעד",
        target: "panel",
        x: `כאן מקבלים תרגיל (${mathByLevel[level]}).<br><br>פותרים אותו, ולוחצים על המשושה עם התשובה בלוח. 🔢<br><br>צריך עזרה? יש כפתור <strong>💜 רמז</strong>, אפשר <strong>להראות תשובה</strong>, ויש גם <strong>לוח כפל</strong> לעזרה.`,
      },
      {
        i: "🚪",
        t: oneDoor ? "הדלת שעוברים בה" : "הדלתות הצבעוניות",
        target: "doors",
        x: oneDoor
          ? 'הקווים הצבעוניים בין המשושים הם <strong>דלתות</strong> 🚪.<br><br>ברמת מתחילים יש דלת אחת — דלת ה<strong>עצם</strong> 🦴. בכל מעבר פותרים תרגיל קטן ומקבלים גרגיר. ברמות הבאות מתווספים עוד צבעי דלתות — קשות יותר אבל שוות יותר גרגירים!'
          : 'הקווים הצבעוניים בין המשושים הם <strong>דלתות</strong> 🚪.<br><br>כל צבע הוא סוג אוכל אחר ותרגיל אחר. כאן רואים אילו דלתות יש ברמה הזו וכמה גרגירים כל אחת שווה — <strong>ככל שהדלת קשה יותר, מקבלים יותר גרגירים!</strong> 🦴',
      },
      {
        i: "🐾",
        t: "שלב 2 — בונים את הדרך",
        target: "board",
        x: 'אחרי שמצאנו את היעד, בונים מסלול מהכלב עד אליו — לוחצים על משושה אחרי משושה. כל משושה חייב לגעת בקודם.<br><br>הצבע של הקו שעוברים עליו קובע איזה תרגיל יהיה שם. 🗺️',
      },
      {
        i: "🧠",
        t: "תכנון ואישור",
        target: "panel",
        x: 'כאן חושבים טוב: 🤔<br><br>• מסלול קצר = פחות תרגילים, אבל גם פחות גרגירים.<br>• דלתות קשות = יותר גרגירים, אבל קשות יותר.<br>בוחרים דרך שמתאימה לכם!<br><br>מוכנים? לוחצים <strong>✅ אשר מסלול</strong>. רוצים לשנות? <strong>🗑 נקה</strong> ומתחילים מחדש.',
      },
      {
        i: "🧩",
        t: "פירוק לגורמים",
        target: "board",
        x: 'ברמה הזו יש בונוס מיוחד! 🧩<br><br>המשבצות עם <strong>המסגרת הזהובה</strong> הן <strong>גורמים</strong> של היעד (מספרים שמתחלקים בו). אם עוברים עליהן בדרך — מקבלים <strong>+2 גרגירים</strong> על כל אחת! 🦴<br><br>וכשמגיעים ליעד, אפשר לפרק אותו לשני מספרים שמכפלתם היא היעד — ולקבל עוד בונוס! 🎉',
      },
      {
        i: "🦴",
        t: "שלב 3 — יוצאים לדרך",
        target: "panel",
        x: `עכשיו צועדים, והשעון מתחיל לתקתק ⏱.<br><br>בכל צעד פותרים את התרגיל של הדלת — ${answerStyle} נכון? מתקדמים וצוברים גרגירים! 🦴<br><br>טעות? אפשר לנסות שוב או לבקש רמז 💡. אפשר גם לוותר — מפסידים את התור אבל שומרים את מה שכבר אספתם.`,
      },
      {
        i: "🙋",
        t: "עוזרים ומרוויחים",
        target: "panel",
        x: 'גם כשזה לא התור שלכם — אפשר לעזור! 🙋<br><br>כאן, בזמן שמישהו אחר פותר תרגיל, שחקן אחר יכול ללחוץ על השם שלו, לכתוב את התשובה — ואם צדק, מקבל <strong>+1 גרגיר על העזרה</strong>! 🦴<br><br>ככה כולם נשארים בעניין וחושבים יחד. 🧠',
      },
      {
        i: "✨",
        t: "משבצות מפתיעות",
        target: "board",
        x: `על חלק מהמשושים יש סמלים מיוחדים:<br><br>💎 <strong>בונוס</strong> — מתנה! (כפול גרגירים / תור נוסף ועוד)<br>🚧 <strong>אתגר</strong> — חוק קטן לאיסוף<br>🎲 <strong>הפתעה</strong> — הכללים משתנים!<br>🦹 <strong>שודד</strong> — אפשר לגנוב גרגירים מיריב${level === "beg" ? " (ברמת מתחילים אפשר לכבות אותו בהגדרות)" : ""}`,
      },
      {
        i: "🏆",
        t: "ניקוד ומי מנצח",
        target: "sidebar",
        x: 'בצד רואים בכל רגע כמה גרגירים יש לכל שחקן 🦴, ואת טבלת הדלתות והנקודות.<br><br>מי שאסף הכי הרבה גרגירים — מנצח! 🎉',
      },
      {
        i: "🎉",
        t: "זהו, אתם מוכנים!",
        target: "center",
        x: 'עכשיו תורכם — בואו נשחק באמת! 🐕🦴',
      },
    ];
    // The factoring step only applies from Advanced up.
    return factorActive ? pages : pages.filter((p) => p.i !== "🧩");
  },
  demoGameBtn: "🧭 סיור מודרך",
  demoPlayerName: "🐕 הדגמה",
  demoHelperName: "🐩 חבר",
  tourFinish: "🎮 בואו נשחק!",
  tourExit: "דלג על הסיור",

  setupTitle: "⚙️ הגדרות משחק",
  howManyPlayers: "👥 כמה שחקנים?",
  playerNamesLabel: "✏️ שמות השחקנים (אפשר לשנות):",
  playerPlaceholder: (dog, i) => `${dog} שם שחקן ${i + 1}...`,
  difficulty: "📊 רמת קושי",
  levels: {
    beg: { icon: "🐾", name: "מתחילים", desc: "לוח עד 40 · בדרך עד 20" },
    med: { icon: "⭐", name: "בינוני", desc: "לוח עד 60 · בדרך עד 40" },
    adv: { icon: "🌟", name: "מתקדם", desc: "לוח עד 90 · בדרך עד 64" },
    champ: { icon: "🏆", name: "אלוף", desc: "לוח עד 100 · בדרך עד 81 | 2 דקות" },
    hero: { icon: "⚡", name: "גיבור", desc: "כפל ארוך | \u2066(11–19)×(2–9)\u2069 | דקה וחצי" },
  },
  options: "🔧 התאמות",
  whatsThis: "מה זה?",
  optTimer: "⏱ טיימר לכל תור",
  optMc: "🔤 כפתורי בחירה (מתחילים/בינוני)",
  optRob: "🦹 מנגנון שוד",
  optCoop: "🤝 משחק שיתופי — אוספים ביחד!",
  optFocus: "🎯 מצב מיקוד — בלי משבצות מיוחדות (פחות הסחות)",
  winCondition: "🏁 מטרת המשחק",
  winModes: {
    rounds: { icon: "🔄", name: "4 סיבובים", desc: "הכי הרבה גרגירים לאחר 4 סיבובים" },
    first100: { icon: "🎯", name: "ראשון ל-100", desc: "הגעה ל-100 גרגירים = ניצחון מיידי" },
    both: { icon: "⚡", name: "גם וגם", desc: "4 סיבובים, אבל ל-100 = ניצחון מיידי" },
  },
  startShort: "🚀 התחל!",

  gameTitle: "🐕🍖 כשכש-נשנש",
  turn: (name) => `תור: ${name}`,
  roundLabel: (round, total) => `סיבוב ${round} מתוך ${total}`,
  instAria: "הסבר ואיך משחקים",
  defaultPlayerName: (dog, i) => `${dog} שחקן ${i + 1}`,

  p1Hint:
    "<strong>שלב 1 — מוצאים יעד 🎯</strong><br>פתרו את התרגיל ולחצו על המשושה עם התשובה בלוח!",
  targetCardLabel: (id, prime) => `🃏 כרטיס יעד #${id}${prime ? " 🎲 ראשוני!" : ""}`,
  targetExpr: (ex) => `${ex} = ?`,
  targetInstruction: (prime) =>
    `${prime ? "🔮 מספר ראשוני — קלף טוויסט מחכה!<br>" : ""}לחצו על המשושה בלוח 👆`,
  showAnswer: "💡 הראו תשובה",
  wrongHexInline: (n) => `המשושה ${n} לא נכון — נסו שוב! 😊`,
  hintBtn: "💜 רמז",
  hintResult: (expr) => calcHintHe(expr),

  p2Hint: (target) =>
    `<strong>שלב 2 — תכננו מסלול 🗺️</strong><br>לחצו על משושים לבניית הדרך.<br>הצלע הצבועה בין שני משושים = רמת הקושי.<br>יעד: <strong>משושה ${target}</strong>`,
  p2Empty: "לחצו על משושים בלוח לבניית המסלול 👆",
  stepHexLabel: (h) => `→ משושה ${h}`,
  doorLabel: (key) => DOOR_LABELS[key],
  pathDoorLabel: (key, pts) => `${DOOR_LABELS[key]} | <span dir="ltr">${DOOR_RANGES[key]}</span> | ${pts}🦴`,
  possiblePellets: (pts, steps) =>
    `🍖 <strong>סה"כ אפשרי: ${pts} גרגירים</strong> ב-${steps} צעדים`,
  routeNotReach: (target) => `⚠️ המסלול לא מגיע למשושה ${target}!`,
  confirmRoute: "✅ אשרו מסלול",
  clearRoute: "🗑 נקו",
  newTarget: "בחרו יעד מחדש",

  p3Hint: (step, total, doorLabel, pts, turnPts) =>
    `<strong>שלב 3 — יוצאים לדרך! 🐕</strong><br>צעד <span dir="ltr">${step}/${total}</span> | אוכל: ${doorLabel} | ${pts} 🦴<br>🦴 גרגירים עד כה: <strong>${turnPts}</strong>`,
  rollFor: (doorLabel) => `🎲 זרקו עבור ${doorLabel}`,
  orClickHex: "או לחצו על המשושה עם התשובה בלוח 👆",
  answerPlaceholder: "התשובה...",
  confirmAnswer: "✅ אשרו תשובה",
  wrongTryAgain: "❌ לא נכון! נסו שוב, או חשפו ותפסידו את התור 😊",
  revealEndsTurn: "💡 חשפו תשובה (מסיים תור)",

  revealTitle: (ans) => `💡 התשובה: ${ans}`,
  revealBody: (ans) => `מצאו את משושה <strong>${ans}</strong> בלוח ולחצו עליו.`,
  gotItThumbs: "הבנתי 👍",
  foundTitle: (n) => `✅ כן! משושה ${n} 🎉`,
  foundBody: (sym) =>
    `מצאת את היעד!${sym ? `<br>⚠️ יש סמל ${sym} על המשושה!` : ""}`,
  planRoute: "👉 תכננו מסלול",
  arrivalTitle: (hex) => `🎉 הגעת ליעד! משושה ${hex}`,
  pelletsThisTurn: (pts) => `🦴 גרגירים שנצברו: <strong>${pts}</strong>`,
  drawBonus: "💎 שלוף בונוס",
  drawLimit: "🚧 שלוף הגבלה",
  drawTwist: "🎲 שלוף טוויסט",
  steal: "🦹 שוד!",
  coopNoRob: "🦹 במשחק שיתופי אין שוד — ממשיכים ביחד!",
  collectPellets: "🦴 שמור לבנק!",
  cards: {
    lim_even: {
      t: "רק זוגי!",
      tx: "מספר הגרגירים שלכם חייב להיות זוגי.<br>אם לא — תאבדו גרגיר אחד 🦴",
    },
    lim_odd: {
      t: "רק אי-זוגי!",
      tx: "מספר הגרגירים שלכם חייב להיות אי-זוגי.<br>אם לא — תאבדו גרגיר אחד 🦴",
    },
    lim_three: {
      t: "3 סוגי אוכל",
      tx: "אם עברתם דרך פחות מ-3 סוגי אוכל שונים —<br>תקבלו רק חצי מהגרגירים!",
    },
    lim_nored: {
      t: "ללא דלת אדומה!",
      tx: "אם עברתם בדלת אדומה (נקניקיה או סטייק) בתור הזה —<br>תאבדו את הגרגירים שצברתם ממנה!",
    },
    lim_short: {
      t: "מסלול קצר",
      tx: "אם בחרתם יותר מ-4 צעדים —<br>תקבלו רק 75% מהגרגירים",
    },
    bon_dbl: { t: "כפול גרגירים! 🦴🦴", tx: "מקבלים פי 2 מכל הגרגירים שצברתם בתור הזה!" },
    bon_extra: { t: "תור נוסף! 🎉", tx: "ברכות — מגיע לכם תור נוסף!" },
    bon_speed: { t: "מסלול מהיר ⚡", tx: "סיימתם לפני חצי הזמן? מקבלים +20 גרגירים!" },
    bon_add10: { t: "+10 גרגירים 🦴", tx: "רק על הגעה ליעד — +10 גרגירים נוספים! 🦴" },
    bon_steps: { t: "צעדים שווים 🐾", tx: "מקבלים +2 גרגירים על כל צעד שהלכתם!" },
    twi_extra: { t: "תור נוסף! 🔄", tx: "קיבלתם מזל — תור נוסף!" },
    twi_teleport: { t: "קפיצה! 🎲", tx: "כוח המשושה הראשוני מקפיץ אתכם למקום אחר על הלוח!" },
    twi_swap: { t: "החלפת מיקום! 🔀", tx: "מתחלפים! אתם ושחקן אחר מחליפים מיקומים על הלוח." },
    twi_dblOrHalf: { t: "כפול או חצי? 🎲", tx: "גורל מכריע: <strong>כפול גרגירים</strong> — או <strong>חצי מהם</strong>. 50/50!" },
    twi_give5: { t: "נדיב! 🤝", tx: "מוציאים עד 5 גרגירים מהבנק שלכם ומוסרים לשחקן עם הכי מעט גרגירים." },
  },
  formatEff,
  extraTurnBtn: "🔄 תור נוסף!",
  robTitle: "🦹 מי לגנוב ממנו גרגירים?",
  robTarget: (name, tokens) => `${name} (${tokens}🦴)`,
  skip: "דלג",
  robResultTitle: "🦹 גנבת גרגירים!",
  robResultBody: (stolen, name) => `לקחתם ${stolen}🦴 מ-${name}! ניאם ניאם 😋`,
  forfeitTitle: (correct) => `💡 התשובה: ${correct}`,
  forfeitBody: (hex, turnPts) =>
    `הדלת נסגרת. התור נגמר.<br>נשארים במשושה <strong>${hex}</strong>.<br>🦴 גרגירים שנצברו: <strong>${turnPts}</strong> — נשמרים בבנק!`,
  saveNext: "🦴 שמור ועבור לתור הבא",
  timeoutTitle: "⏱ הזמן נגמר!",
  timeoutBody: (hex) =>
    `נשארים במשושה ${hex}. הגרגירים שנצברו עד כה נשמרים! 🦴`,
  confirmEndTitle: "✖ לסיים?",
  confirmEndBody: "כל ההתקדמות תאבד.",
  cancel: "ביטול",
  endGame: "סיים",
  close: "סגור",

  settingsHelpTitle: "❓ הסבר ההגדרות",
  settingsHelpBody: `
    <div style="display:flex;flex-direction:column;gap:11px;margin-top:10px">
      <div style="background:#f9fafb;border-radius:10px;padding:11px 13px">
        <strong>⏱ טיימר לכל תור</strong>
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">כשמופעל — יש לכל שחקן 3 דקות לסיים תור (2 דקות ברמת אלוף, דקה וחצי בגיבור). גרגירים שנצברו לפני שהזמן נגמר — <strong>נשמרים!</strong><br>💡 כבו אותו עם ילדים קטנים, כשמתרגלים בפעם הראשונה, או במשחק שיתופי רגוע.</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:11px 13px">
        <strong>🏁 מטרת המשחק</strong>
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">
        <strong>🔄 4 סיבובים</strong> — כולם משחקים 4 סיבובים ומי שצבר הכי הרבה מנצח. משחק קצוב ומאוזן.<br>
        <strong>🎯 ראשון ל-100</strong> — המשחק נמשך עד שמישהו מגיע ל-100 גרגירים ומנצח מיידית (ואם אף אחד לא הגיע ל-100 תוך 10 סיבובים — המוביל מנצח). מתאים לשחקנים חזקים ומשחקים ארוכים.<br>
        <strong>⚡ גם וגם</strong> — 4 סיבובים, אבל אם מישהו הגיע ל-100 לפני הסוף — מנצח מיידית. הבחירה הכי גמישה!</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:11px 13px">
        <strong>🔤 כפתורי בחירה (מתחילים/בינוני)</strong>
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">ברמות מתחילים ובינוני — התשובה מוצגת כ-4 כפתורים לבחירה במקום הקלדה. מקל על ילדים שמתחילים ללמוד.<br>💡 כבה אותו כדי לתרגל שליפה מהירה מהזיכרון ללא רמזים.</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:11px 13px">
        <strong>🦹 מנגנון שוד</strong>
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">כשמופעל ונוחתים על משושה 🦹 — אפשר לגנוב גרגירים מיריב! מוסיף מתח ואסטרטגיה.<br>💡 כבה אצל ילדים רגישים לתחרות, בטיפול, או במשחק שיתופי.</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:11px 13px">
        <strong>🤝 משחק שיתופי</strong>
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">כל השחקנים צוות אחד — גרגירים מצטברים בבנק משותף, אין תחרות ואין שוד. מנצחים ביחד ב-100!<br>💡 מתאים לגיל צעיר, לפגישות טיפוליות, ולמשחק משפחתי רגוע.</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:11px 13px">
        <strong>🎯 מצב מיקוד</strong>
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">מסתיר את כל המשבצות המיוחדות מהלוח — אין קלפי בונוס, אין הגבלות, אין שוד ואין קלפי טוויסט. הכלב פשוט מטייל ופותר תרגילים, בלי הפתעות וקלפים שקופצים באמצע התור.<br><strong>למי מתאים?</strong> לילדים שמתקשים בקשב ומתפזרים בקלות, וכשרוצים שכל תשומת הלב תהיה על החשבון עצמו.<br>💡 אתגר פירוק הגורמים (ברמות הגבוהות) עדיין נשאר — הוא חלק מהחשבון, לא הסחה.</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:11px 13px">
        <strong>🎓 משחק חופשי</strong>
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">משחק ללא ניקוד ובלי מנצח — במקום גרגירים, סופרים כמה תרגילים כל שחקן פתר. אין לחץ של ניצחון, אין שוד והמשחק לא נגמר אחרי 4 סיבובים — ממשיכים כמה שרוצים.<br><strong>למי מתאים?</strong> לילדים שנלחצים מתחרות, לתרגול רגוע, ולשיעור או טיפול שבו רוצים להתמקד רק בלמידה.<br>💡 כדאי כשהמטרה היא לתרגל הרבה חשבון בנעימים — בלי הסחות דעת של ניקוד וניצחון.</p>
      </div>
    </div>`,

  videoLabels: {
    tutorial: "🎬 טוטוריאל — הסבר על הלוח והאפשרויות",
    gameplay: "🎮 דוגמה למשחק מהיר",
    beg: "🐾 מדריך — רמת מתחילים",
    med: "⭐ מדריך — רמת בינוני",
    adv: "🌟 מדריך — רמת מתקדם",
    champ: "🏆 מדריך — רמת אלוף",
    hero: "⚡ מדריך — רמת גיבור",
  },
  videoComingSoon: "הסרטון יהיה זמין בקרוב!",
  videoComingSoonHint:
    "כדי לקשר סרטון, ערוך את מערך VIDEOS בקוד<br>והכנס את מזהה YouTube.",

  winnerTitle: "מנצח! 🏆",
  winnerSuffix: " 🎉",
  newGameBtn: "🔄 משחק חדש",
  coopWinTitle: "ניצחון משותף! 🏆",
  coopWinName: "כולנו מנצחים! 🎉",
  coopTeamwork: "🤝 שיתוף פעולה",
  coopTogether: (shared) => `${shared}🦴 ביחד`,
  resultsSaved: "✅ התוצאות נשמרו אוטומטית",
  viewResultsBtn: "📊 כל התוצאות",

  viewResults: "📊 תוצאות",
  resultsTitle: "📊 תוצאות משחקים",
  noResults: "אין תוצאות שמורות עדיין",
  clearResults: "🗑 נקה הכל",
  downloadResults: "⬇ ייצא לקובץ",

  sharedBank: "🤝 בנק משותף",
  sharedProgress: (shared) => `🦴 ${shared}/100 לניצחון!`,
  hexLabel: (h) => `📍 משושה ${h}`,

  doorLegendTitle: "🚪 דלתות וגרגירים",
  doorLegendPts: (pts) => `${pts}🦴`,

  helpCardBtn: "לוח כפל",

  spectatorPrompt: "מישהו אחר יודע? לחץ על שמך:",
  spectatorAnswerFor: (name) => `${name} עונה:`,
  spectatorCorrect: (name) => `+1 ל-${name}! 🎉`,
  spectatorWrong: "❌ לא נכון",

  primeHexTitle: (n) => `🎲 משושה ראשוני — ${n}!`,
  primeHexMsg: (n) => `המספר <strong>${n}</strong> הוא מספר ראשוני — מתחלק רק ב-1 ובעצמו, ואי-אפשר לפרק אותו לגורמים!<br>זה אומר... קלף טוויסט מחכה לך! 🎲`,
  drawTwistAfterPrime: "🎲 שלוף קלף טוויסט!",

  factorTitle: (n) => `🧩 פרקו את ${n} לגורמים!`,
  factorPrompt: (n) =>
    `מצאו שני מספרים (כל אחד 2 ומעלה) שמכפלתם היא <strong>${n}</strong>.<br>פתרתם? תקבלו בונוס! 🦴`,
  factorCheck: "✅ בדקו",
  factorSkipBtn: "דלג",
  factorCorrect: (a, b, n, bonus) =>
    `🎉 כל הכבוד! <span dir="ltr">${a} × ${b} = ${n}</span> — בונוס +${bonus} 🦴`,
  factorWrong: (n) => `כמעט! צריך שני מספרים שמכפלתם היא ${n}. נסו שוב 😊`,
  factorTilesBonus: (count, pts) =>
    `🧩 עברת על ${count} משבצות-גורם של היעד — בונוס +${pts} 🦴`,
  factorHuntHint: (target) =>
    `🧩 המשבצות עם המסגרת הזהובה הן גורמים של ${target} — עברו עליהן בדרך לבונוס!`,

  optFreePlay: "🎓 משחק חופשי — ספור תרגילים (ללא ניקוד)",
  freeSolvedCount: (n) => `✅ ${n}`,

  p2CoopHint: "💡 שיתוף פעולה: כל הגרגירים נכנסים לבנק המשותף!",

  researchTitle: "🔬 מחקר (לא חובה)",
  researchHint: "למילוי כשאוספים נתונים — נשמר עם תוצאות המשחק לצורך ניתוח.",
  participantLabel: "קוד נבדק",
  conditionLabel: "תנאי / קבוצה",
  participantPlaceholder: "למשל S07",
  conditionPlaceholder: "למשל כלב / ביקורת",

  statTitle: "🧠 שליפה",
  statAccuracy: (correct, total) => `דיוק: ${correct}/${total}`,
  statSpeed: (sec) => `זמן ממוצע: ${sec} שׂנ׳`,
  statNoData: "—",

  quickStartBtn: "🚀 התחל מהר!",
  quickStartTitle: "⚡ 3 שלבים פשוטים",
  quickStartSteps: [
    "🎯 שלב 1: פתור תרגיל חשבון ולחץ על המשושה עם התשובה בלוח",
    "🗺️ שלב 2: תכנן מסלול למשושה היעד על ידי לחיצה על משושים",
    "🐕 שלב 3: עבור כל דלת על ידי פתרון תרגיל כפל — וצבור גרגירים!",
  ],
  quickStartGo: "🎮 בואו נשחק!",

  phaseLabels: ["מצא יעד", "תכנן", "צא לדרך"],
};
