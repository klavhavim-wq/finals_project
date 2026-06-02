import type { DoorKey, EffResult } from "../engine/types";
import type { Dict } from "./index";

const DOOR_LABELS: Record<DoorKey, string> = {
  blue: "🦴 עצם",
  purple: "🐟 דג",
  yellow: "🍗 כנף",
  red: "🌭 נקניקיה",
  redlong: "🥩 סטייק",
};

const DOOR_RANGES: Record<DoorKey, string> = {
  blue: "2–4 × 2–4",
  purple: "3–6 × 3–6",
  yellow: "5–8 × 5–8",
  red: "7–9 × 7–9",
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
  if (a >= 10) {
    const t = Math.floor(a / 10) * 10, o = a % 10;
    return `💜 רמז: פרקו את ${a} ל-${t}+${o}:<br>${ltr(`(${t} × ${b}) + (${o} × ${b}) = ?`)}`;
  }
  if (b >= 10) {
    const t = Math.floor(b / 10) * 10, o = b % 10;
    return `💜 רמז: פרקו את ${b} ל-${t}+${o}:<br>${ltr(`(${a} × ${t}) + (${a} × ${o}) = ?`)}`;
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
    return `💜 רמז: ${ltr(`${nums[0]} × ${nums[1]} = <strong>${nums[0] * nums[1]}</strong>`)}, ואז × ${nums[2]} = ?`;
  }
  const dM = expr.match(/^(\d+)\s*÷\s*(\d+)$/);
  if (dM) {
    const [a, b] = [+dM[1], +dM[2]];
    if (b === 2) return `💜 רמז: ÷2 = חצי — מה זה חצי מ-${a}?`;
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
    if (a % 10 === 0 || b % 10 === 0)
      return `💜 רמז: התחילו מ-<strong>${Math.max(a, b)}</strong> וספרו עוד <strong>${Math.min(a, b)}</strong>`;
    if (b <= 5) return `💜 רמז: ספרו ${b} קדימה מ-${a}`;
    return `💜 רמז: ${ltr(`${a} + ${b}`)} — ספרו קדימה!`;
  }
  return `💜 רמז: חשבו צעד-צעד! 🐾`;
}

function formatEff(r: EffResult): string {
  switch (r.eff) {
    case "dblPts":
      return `🦴×2! סה"כ: <strong>${r.total}</strong> גרגירים`;
    case "add10":
      return `+10 🦴! סה"כ: <strong>${r.total}</strong>`;
    case "add15":
      return `+15 🦴! סה"כ: <strong>${r.total}</strong>`;
    case "speedBonus":
      return r.applied
        ? `+20 🦴 על מהירות! סה"כ: <strong>${r.total}</strong>`
        : "לא מהיר מספיק הפעם 😅";
    case "stepsBonus":
      return `+${r.steps * 2} 🦴 (${r.steps} צעדים × 2)! סה"כ: <strong>${r.total}</strong>`;
    case "evenOnly":
      return r.applied
        ? `הגרגירים לא זוגיים! הורדה 1 🦴 — נשאר: <strong>${r.total}</strong>`
        : "✅ הגרגירים זוגיים! עובר בשלום";
    case "oddOnly":
      return r.applied
        ? `הגרגירים לא אי-זוגיים! הורדה 1 🦴 — נשאר: <strong>${r.total}</strong>`
        : "✅ הגרגירים אי-זוגיים! עובר בשלום";
    case "threeColors":
      return r.applied
        ? `רק ${r.count} סוגי אוכל — חצי גרגירים: <strong>${r.total}</strong>`
        : `✅ ${r.count} סוגי אוכל! עובר בשלום`;
    case "noRed":
      return r.applied
        ? `${r.count} נקניקיות! −${r.lost} 🦴 — נשאר: <strong>${r.total}</strong>`
        : "✅ ללא נקניקיה! עובר בשלום";
    case "shortPath":
      return r.applied
        ? `מסלול ארוך (${r.steps} צעדים) — 75%: <strong>${r.total}</strong> 🦴`
        : "✅ מסלול קצר! עובר בשלום";
    case "extraTurn":
      return "🎉 תור נוסף מגיע לך!";
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
  howToPlay: "📖 איך משחקים?",
  tutorialVideos: "🎬 סרטוני הסבר",     inst: [
       {
         i: "🎮",
         t: "הלוח שלנו",
         x: '<div style="text-align:center;margin:0 0 8px"><svg width="200" height="80" viewBox="0 0 182 80" xmlns="http://www.w3.org/2000/svg"><polygon points="46,14 68.5,27 68.5,53 46,66 23.5,53 23.5,27" fill="#FFF8E7" stroke="#C9A882" stroke-width="1.5"/><polygon points="91,14 113.5,27 113.5,53 91,66 68.5,53 68.5,27" fill="#FFF8E7" stroke="#C9A882" stroke-width="1.5"/><polygon points="136,14 158.5,27 158.5,53 136,66 113.5,53 113.5,27" fill="#FEF08A" stroke="#C9A882" stroke-width="1.5"/><line x1="68.5" y1="27" x2="68.5" y2="53" stroke="#3B82F6" stroke-width="4.5" stroke-linecap="round"/><line x1="113.5" y1="27" x2="113.5" y2="53" stroke="#8B5CF6" stroke-width="4.5" stroke-linecap="round"/><text x="46" y="44" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">12</text><text x="91" y="40" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">24</text><text x="136" y="40" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">36</text><text x="46" y="29" text-anchor="middle" font-size="16">🐕</text></svg></div>הלוח מכיל 100 משושים ממוספרים. בין המשושים יש צלעות צבעוניות — אלה ה"דלתות" שלנו! 🚪<br><br>כל צבע = סוג אוכל + רמת קושי.<br><br>🎯 <strong>המטרה:</strong> לצבור כמה שיותר גרגירים לבנק של הכלב! 🐶🦴',
       },
       {
         i: "🎯",
         t: "שלב 1 — מוצאים את היעד",
         x: '<div style="text-align:center;margin:0 0 8px"><svg width="180" height="70" viewBox="0 0 180 70" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="176" height="66" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/><text x="90" y="22" text-anchor="middle" font-size="12" fill="#64748b">🎯 כרטיס יעד</text><text x="90" y="50" text-anchor="middle" font-size="22" font-weight="bold" fill="#1e293b">6 × 4 = ?</text></svg></div>שולפים כרטיס יעד עם תרגיל חשבון, למשל: <strong><span dir="ltr">6 × 4 = ?</span></strong><br><br>פותרים בראש 🧠 ולוחצים על המשושה עם התשובה (24) בלוח!<br><br>טעות? <strong>אפשר לנסות שוב כמה פעמים שרוצים!</strong> 😊<br>רוצים עזרה? אפשר לבחור רמז 💡, או ללחוץ "הראה תשובה".<br><br>ℹ️ <strong>בשלב הזה אין הגבלת זמן!</strong>',
       },
       {
         i: "🗺️",
         t: "שלב 2 — מתכננים מסלול",
         x: '<div style="text-align:center;margin:0 0 8px"><svg width="140" height="130" viewBox="-5 0 250 245" xmlns="http://www.w3.org/2000/svg"><polygon points="120,20 207,70 207,170 120,220 33,170 33,70" fill="#FFF8E7" stroke="#C9A882" stroke-width="2"/><line x1="120" y1="20" x2="207" y2="70" stroke="#3B82F6" stroke-width="14" stroke-linecap="round"/><line x1="207" y1="70" x2="207" y2="170" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round"/><line x1="207" y1="170" x2="120" y2="220" stroke="#F59E0B" stroke-width="14" stroke-linecap="round"/><line x1="120" y1="220" x2="33" y2="170" stroke="#EF4444" stroke-width="14" stroke-linecap="round"/><line x1="33" y1="170" x2="33" y2="70" stroke="#DC2626" stroke-width="14" stroke-linecap="round"/><line x1="33" y1="70" x2="120" y2="20" stroke="#3B82F6" stroke-width="14" stroke-linecap="round"/><text x="120" y="120" text-anchor="middle" dominant-baseline="middle" font-size="36" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">42</text></svg></div>לוחצים על משושים לבניית המסלול ליעד.<br>לא לשכוח לסמן גם את משושה היעד עצמו!<br><br>הצבעים מסמנים את קושי התרגיל ומספר הגרגירים שפתירתו ומעבר למשושה הסמוך מוסיפים לבנק:<br><br><div style="display:flex;flex-direction:column;gap:6px;margin:8px 0;font-size:.85em"><div style="padding:6px 10px;background:#EFF6FF;border-radius:8px;border-right:4px solid #3B82F6">🦴 <strong style="color:#3B82F6">כחול — עצם</strong>: לוח הכפל עד 4, למשל <span dir="ltr">3 × 4 = 12</span> — <strong>1 גרגיר</strong> לצעד</div><div style="padding:6px 10px;background:#F5F3FF;border-radius:8px;border-right:4px solid #8B5CF6">🐟 <strong style="color:#8B5CF6">סגול — דג</strong>: לוח הכפל עד 6, למשל <span dir="ltr">4 × 5 = 20</span> — <strong>2 גרגירים</strong> לצעד</div><div style="padding:6px 10px;background:#FFFBEB;border-radius:8px;border-right:4px solid #F59E0B">🍗 <strong style="color:#F59E0B">צהוב — כנף</strong>: לוח הכפל עד 8, למשל <span dir="ltr">6 × 7 = 42</span> — <strong>5 גרגירים</strong> לצעד</div><div style="padding:6px 10px;background:#FEF2F2;border-radius:8px;border-right:4px solid #EF4444">🌭 <strong style="color:#EF4444">אדום — נקניקיה</strong>: לוח הכפל 7–9, למשל <span dir="ltr">8 × 9 = 72</span> — <strong>10 גרגירים</strong> לצעד</div><div style="padding:6px 10px;background:#FEF2F2;border-radius:8px;border-right:4px solid #DC2626">🥩 <strong style="color:#DC2626">אדום-כהה — סטייק</strong>: כפל ארוך, למשל <span dir="ltr">13 × 4 = 52</span> — <strong>20 גרגירים</strong> לצעד</div></div><em style="font-size:.8em;color:#7C3AED">סטייק — רמת גיבור בלבד!</em><br><br>קשה יותר = יותר גרגירים לבנק! 🐶',
       },
       {
         i: "✅",
         t: "בדיקה ואישור מסלול",
         x: '<div style="text-align:center;margin:0 0 10px"><svg width="300" height="80" viewBox="0 0 245 66" xmlns="http://www.w3.org/2000/svg"><polygon points="102.0,5 115.9,13 115.9,29 102.0,37 88.1,29 88.1,13" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="129.7,5 143.6,13 143.6,29 129.7,37 115.8,29 115.8,13" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="157.4,5 171.3,13 171.3,29 157.4,37 143.5,29 143.5,13" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="185.1,5 199.0,13 199.0,29 185.1,37 171.2,29 171.2,13" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="212.8,5 226.7,13 226.7,29 212.8,37 198.9,29 198.9,13" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="32.7,29 46.6,37 46.6,53 32.7,61 18.8,53 18.8,37" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="60.4,29 74.3,37 74.3,53 60.4,61 46.5,53 46.5,37" fill="#FFF8E7" stroke="#C9A882" stroke-width="1" opacity="0.35"/><polygon points="18.9,5 32.8,13 32.8,29 18.9,37 5.0,29 5.0,13" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="46.6,5 60.5,13 60.5,29 46.6,37 32.7,29 32.7,13" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="74.3,5 88.2,13 88.2,29 74.3,37 60.4,29 60.4,13" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="88.1,29 102.0,37 102.0,53 88.1,61 74.2,53 74.2,37" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="115.9,29 129.8,37 129.8,53 115.9,61 102.0,53 102.0,37" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="143.6,29 157.5,37 157.5,53 143.6,61 129.7,53 129.7,37" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="171.3,29 185.2,37 185.2,53 171.3,61 157.4,53 157.4,37" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="199.0,29 212.9,37 212.9,53 199.0,61 185.1,53 185.1,37" fill="#DBEAFE" stroke="#0891B2" stroke-width="1.5"/><polygon points="226.7,29 240.6,37 240.6,53 226.7,61 212.8,53 212.8,37" fill="#FDE68A" stroke="#0891B2" stroke-width="1.5"/><line x1="32.8" y1="13" x2="32.8" y2="29" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="60.5" y1="13" x2="60.5" y2="29" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="88.2" y1="29" x2="74.3" y2="37" stroke="#8B5CF6" stroke-width="3" stroke-linecap="round"/><line x1="102.0" y1="37" x2="102.0" y2="53" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/><line x1="129.8" y1="37" x2="129.8" y2="53" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/><line x1="157.5" y1="37" x2="157.5" y2="53" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/><line x1="185.2" y1="37" x2="185.2" y2="53" stroke="#8B5CF6" stroke-width="3" stroke-linecap="round"/><line x1="212.9" y1="37" x2="212.9" y2="53" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><text x="18.9" y="14" text-anchor="middle" font-size="9">🐕</text><text x="18.9" y="27" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">1</text><text x="46.6" y="21" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif">2</text><text x="74.3" y="21" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif">3</text><text x="102.0" y="21" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#78350F" font-family="Arial,sans-serif" opacity="0.4">4</text><text x="129.7" y="21" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif" opacity="0.4">5</text><text x="157.4" y="21" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#78350F" font-family="Arial,sans-serif" opacity="0.4">6</text><text x="185.1" y="21" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif" opacity="0.4">7</text><text x="212.8" y="21" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#78350F" font-family="Arial,sans-serif" opacity="0.4">8</text><text x="32.7" y="45" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif" opacity="0.4">11</text><text x="60.4" y="45" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#78350F" font-family="Arial,sans-serif" opacity="0.4">12</text><text x="88.1" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif">13</text><text x="115.9" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">14</text><text x="143.6" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">15</text><text x="171.3" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">16</text><text x="199.0" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#7C3AED" font-family="Arial,sans-serif">17</text><text x="226.7" y="45" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="#78350F" font-family="Arial,sans-serif">18</text></svg><div style="font-size:.75em;color:#64748b;margin-top:2px">דוגמה: מסלול ממשושה 1 למשושה 18 🗺️</div></div>לפני שיוצאים לדרך — בדקו את המסלול! 📝<br><br>בצד המסך תראו את פירוט המסלול שבחרתם: כל צעד, סוג האוכל בכל דלת, וסך הגרגירים שתוכלו לצבור.<br><br>ככה תוכלו להחליט אם שווה לעבור דלת קשה בשביל יותר גרגירים, או לבחור דרך קלה יותר.<br><br>לא מרוצים? לוחצים "נקה" 🗑 ובונים מחדש!<br>מוכנים? לוחצים "אשר מסלול" ✅ ויוצאים לדרך!',
       },
       {
         i: "🐕",
         t: "שלב 3 — יוצאים לדרך!",
         x: 'הכלב קופץ ללוח ומתחיל לנוע! 🐾<br><br>לכל צעד:<br>1️⃣ לוחצים "זרוק" 🎲<br>2️⃣ מקבלים תרגיל כפל לפי צבע הדלת<br>3️⃣ עונים על ידי לחיצה על משושה, הקלדה, או כפתורי בחירה<br><br>✅ נכון ← הכלב מתקדם + גרגירים! 🦴<br>❌ טעות ← אפשר לנסות שוב בלי הגבלה!<br>💡 חושפים תשובה ← הכלב נעצר, <strong>הגרגירים שנצברו עד כה נשמרים!</strong> 🦴',
       },
       {
         i: "⏱",
         t: "הגבלת זמן",
         x: 'לכל רמה יש הגבלת זמן לתור:<br><br>🐾⭐🌟 <strong>מתחילים / בינוני / מתקדם</strong> — 3 דקות<br>🏆 <strong>אלוף</strong> — 2 דקות<br>⚡ <strong>גיבור</strong> — <span dir="ltr">1:30</span> דקות<br><br>לא סיימתם בזמן? נשארים במקום, <strong>הגרגירים שנצברו נשמרים!</strong> 🦴<br><br>💡 אפשר לכבות את הטיימר בהגדרות.',
       },
       {
         i: "🏆",
         t: "איך מנצחים?",
         x: 'אפשר לבחור בהגדרות:<br><br>🔄 <strong>4 סיבובים</strong> — כולם משחקים 4 סיבובים, מי שצבר הכי הרבה מנצח!<br><br>🎯 <strong>ראשון ל-100</strong> — מגיעים ל-100 גרגירים? ניצחון מיידי! 🎉<br><br>⚡ <strong>גם וגם</strong> — 4 סיבובים, אבל אם מגיעים ל-100 לפני — ניצחון מיידי!<br><br>בוחרים בהגדרות לפני שמתחילים. ⚙️',
       },
       {
         i: "✨",
         t: "סימנים מיוחדים על הלוח",
         x: '<strong>💎 מספרים עגולים <span dir="ltr">(10, 20, 30...)</span></strong><br>נחתתם כאן? שלופו קלף בונוס! 🎁<br>אולי תקבלו: כפול גרגירים / תור נוסף / +10 גרגירים<br><br><strong>🚧 מסתיימים ב-5 <span dir="ltr">(15, 25, 35...)</span></strong><br>שלופו קלף הגבלה — אתגר לאיסוף!<br>למשל: "מספר הגרגירים חייב להיות זוגי"<br><br><strong>🦹 מסתיימים ב-6 <span dir="ltr">(16, 26, 36...)</span></strong><br>שוד! ✋ אפשר לגנוב גרגירים מיריב!<br><br><strong>🔮 מספרים ראשוניים <span dir="ltr">(2, 3, 5, 7, 11, 13...)</span></strong><br>מספר שמתחלק רק ב-1 ובעצמו!<br>שלופו קלף טוויסט — הכללים משתנים! 🎲',
       },
       {
         i: "⚙️",
         t: "הגדרות המשחק",
         x: 'לפני שמתחילים — מגדירים את העדפות המשחק שלנו:<br><br>📊 <strong>רמת קושי</strong> — מתחילים עד גיבור<br>⏱ <strong>טיימר</strong> — מופעל או כבוי<br>🔤 <strong>כפתורי בחירה</strong> — לרמות מתחילים/בינוני<br>🦹 <strong>שוד</strong> — מופעל או כבוי<br>🤝 <strong>שיתופי</strong> — כולם ביחד במקום תחרות<br>🏁 <strong>מטרת המשחק</strong> — איך מנצחים?',
       },
       {
         i: "🤝",
         t: "ביחד — מצב שיתופי",
         x: 'מפעילים "משחק שיתופי" בהגדרות.<br>במצב הזה — <strong>כולנו עובדים ביחד!</strong><br><br>✅ כל הגרגירים נכנסים לבנק המשותף 🦴<br>✅ אין שוד — כולנו אחד!<br>✅ מגיעים ל-100 ביחד — <strong>כולנו מנצחים! 🎉</strong><br><br>🐕🐩🐕‍🦺🦮 מתאים לילדים צעירים, לטיפול, ולמשחק משפחתי רגוע.',
       }
     ],
  back: "אחורה →",
  next: "← הבא",
  gotItDone: "✅ הבנתי!",

  setupTitle: "⚙️ הגדרות משחק",
  howManyPlayers: "👥 כמה שחקנים?",
  playerNamesLabel: "✏️ שמות השחקנים (אפשר לשנות):",
  playerPlaceholder: (dog, i) => `${dog} שם שחקן ${i + 1}...`,
  difficulty: "📊 רמת קושי",
  levels: {
    beg: { icon: "🐾", name: "מתחילים", desc: "כפל ראשון | \u2066(2–4)×(2–4)\u2069" },
    med: { icon: "⭐", name: "בינוני", desc: "כפל עד 6 | \u2066(3–6)×(3–6)\u2069" },
    adv: { icon: "🌟", name: "מתקדם", desc: "כפל עד 8 | \u2066(5–8)×(5–8)\u2069" },
    champ: { icon: "🏆", name: "אלוף", desc: "כפל \u20667–9\u2069 | 2 דקות" },
    hero: { icon: "⚡", name: "גיבור", desc: "כפל ארוך | \u2066(11–19)×(2–9)\u2069 | \u20661:30\u2069 דקות" },
  },
  watch: "🎬 צפה",
  options: "🔧 התאמות",
  whatsThis: "מה זה?",
  optTimer: "⏱ טיימר לכל תור",
  optMc: "🔤 כפתורי בחירה (מתחילים/בינוני)",
  optRob: "🦹 מנגנון שוד",
  optCoop: "🤝 משחק שיתופי — אוספים ביחד!",
  winCondition: "🏁 מטרת המשחק",
  winModes: {
    rounds: { icon: "🔄", name: "4 סיבובים", desc: "הכי הרבה גרגירים לאחר 4 סיבובים" },
    first100: { icon: "🎯", name: "ראשון ל-100", desc: "הגעה ל-100 גרגירים = ניצחון מיידי" },
    both: { icon: "⚡", name: "גם וגם", desc: "4 סיבובים, אבל ל-100 = ניצחון מיידי" },
  },
  startShort: "🚀 התחל!",

  gameTitle: "🐕🍖 כשכש-נשנש",
  turn: (name) => `תור: ${name}`,
  defaultPlayerName: (dog, i) => `${dog} שחקן ${i + 1}`,

  p1Hint:
    "<strong>שלב 1 — מוצאים יעד 🎯</strong><br>פתור את התרגיל ולחץ על המשושה עם התשובה בלוח!",
  targetCardLabel: (id, prime) => `🃏 כרטיס יעד #${id}${prime ? " 🎲 ראשוני!" : ""}`,
  targetExpr: (ex) => `${ex} = ?`,
  targetInstruction: (prime) =>
    `${prime ? "🔮 מספר ראשוני — קלף טוויסט מחכה!<br>" : ""}לחץ על המשושה בלוח 👆`,
  showAnswer: "💡 הראה תשובה",
  wrongHexInline: (n) => `המשושה ${n} לא נכון — נסה שוב! 😊`,
  hintBtn: "💜 רמז",
  hintResult: (expr) => calcHintHe(expr),

  p2Hint: (target) =>
    `<strong>שלב 2 — תכנן מסלול 🗺️</strong><br>לחץ על משושים לבניית הדרך.<br>הצלע הצבועה בין שני משושים = רמת הקושי.<br>יעד: <strong>משושה ${target}</strong>`,
  p2Empty: "לחץ על משושים בלוח לבניית המסלול 👆",
  stepHexLabel: (h) => `→ משושה ${h}`,
  doorLabel: (key) => DOOR_LABELS[key],
  pathDoorLabel: (key, pts) => `${DOOR_LABELS[key]} | <span dir="ltr">${DOOR_RANGES[key]}</span> | ${pts}נק׳`,
  possiblePellets: (pts, steps) =>
    `🍖 <strong>סה"כ אפשרי: ${pts} נקודות</strong> ב-${steps} צעדים`,
  routeNotReach: (target) => `⚠️ המסלול לא מגיע למשושה ${target}!`,
  confirmRoute: "✅ אשר מסלול",
  clearRoute: "🗑 נקה",
  newTarget: "← בחר יעד מחדש",

  p3Hint: (step, total, doorLabel, pts, turnPts) =>
    `<strong>שלב 3 — יוצאים לדרך! 🐕</strong><br>צעד ${step}/${total} | אוכל: ${doorLabel} | ${pts} 🦴<br>🦴 גרגירים עד כה: <strong>${turnPts}</strong>`,
  rollFor: (doorLabel) => `🎲 זרוק עבור ${doorLabel}`,
  orClickHex: "או לחץ על המשושה עם התשובה בלוח 👆",
  answerPlaceholder: "התשובה...",
  confirmAnswer: "✅ אשר תשובה",
  wrongTryAgain: "❌ לא נכון! נסה שוב, או חשוף ותפסיד את התור 😊",
  revealEndsTurn: "💡 חשוף תשובה (מסיים תור)",

  revealTitle: (ans) => `💡 התשובה: ${ans}`,
  revealBody: (ans) => `מצא את משושה <strong>${ans}</strong> בלוח ולחץ עליו.`,
  gotItThumbs: "הבנתי 👍",
  foundTitle: (n) => `✅ כן! משושה ${n} 🎉`,
  foundBody: (sym) =>
    `מצאת את היעד!${sym ? `<br>⚠️ יש סמל ${sym} על המשושה!` : ""}`,
  planRoute: "👉 תכנן מסלול",
  arrivalTitle: (hex) => `🎉 הגעת ליעד! משושה ${hex}`,
  pelletsThisTurn: (pts) => `🦴 גרגירים שנצברו: <strong>${pts}</strong>`,
  drawBonus: "💎 שלוף בונוס",
  drawLimit: "🚧 שלוף הגבלה",
  drawTwist: "🎲 שלוף טוויסט",
  steal: "🦹 שוד!",
  collectPellets: "🦴 שמור לבנק!",
  cards: {
    lim_even: {
      t: "רק זוגי!",
      tx: "מספר הגרגירים שלך חייב להיות זוגי.<br>אם לא — תאבד גרגיר אחד 🦴",
    },
    lim_odd: {
      t: "רק אי-זוגי!",
      tx: "מספר הגרגירים שלך חייב להיות אי-זוגי.<br>אם לא — תאבד גרגיר אחד 🦴",
    },
    lim_three: {
      t: "3 סוגי אוכל",
      tx: "אם עברת דרך פחות מ-3 סוגי אוכל שונים —<br>תקבל רק חצי מהגרגירים!",
    },
    lim_nored: {
      t: "ללא נקניקיה!",
      tx: "אם השתמשת בנקניקיה בתור הזה —<br>תאבד את הגרגירים שקיבלת ממנה!",
    },
    lim_short: {
      t: "מסלול קצר",
      tx: "אם בחרת יותר מ-4 צעדים —<br>תקבל רק 75% מהגרגירים",
    },
    bon_dbl: { t: "כפול גרגירים! 🦴🦴", tx: "מקבל פי 2 מכל הגרגירים שצברת בתור הזה!" },
    bon_extra: { t: "תור נוסף! 🎉", tx: "ברכות — מגיע לך תור נוסף!" },
    bon_speed: { t: "מסלול מהיר ⚡", tx: "סיימת לפני חצי הזמן? מקבל +20 גרגירים!" },
    bon_add10: { t: "+10 גרגירים 🦴", tx: "רק על הגעה ליעד — +10 גרגירים נוספים! 🦴" },
    bon_steps: { t: "צעדים שווים 🐾", tx: "מקבל +2 גרגירים על כל צעד שהלכת!" },
    twi_extra: { t: "תור נוסף! 🔄", tx: "קיבלת מזל — תור נוסף!" },
    twi_dbl: { t: "כפול גרגירים! 🦴", tx: "מקבל פי 2 גרגירים בתור הזה! 🦴🦴" },
    twi_prime: { t: "בונוס ראשוני 🎲", tx: "הגעת למספר ראשוני — +15 גרגירים!" },
    twi_kibble: { t: "קערת האוכל 🦴", tx: "מקבל +2 גרגירים על כל צעד שהלכת!" },
    twi_dbl2: { t: "כפול גרגירים! 🦴🦴", tx: "כפול גרגירים לתור הזה!" },
  },
  formatEff,
  extraTurnBtn: "🔄 תור נוסף!",
  robTitle: "🦹 מי לגנוב ממנו גרגירים?",
  robTarget: (name, tokens) => `${name} (${tokens}🦴)`,
  skip: "דלג",
  robResultTitle: "🦹 גנבת גרגירים!",
  robResultBody: (stolen, name) => `לקחת ${stolen}🦴 מ-${name}! ням ням 😋`,
  forfeitTitle: (correct) => `💡 התשובה: ${correct}`,
  forfeitBody: (hex, turnPts) =>
    `הדלת נסגרת. התור נגמר.<br>נשארת במשושה <strong>${hex}</strong>.<br>🦴 גרגירים שנצברו: <strong>${turnPts}</strong> — נשמרים בבנק!`,
  saveNext: "🦴 שמור ועבור לתור הבא",
  timeoutTitle: "⏱ הזמן נגמר!",
  timeoutBody: (hex) =>
    `נשאר במשושה ${hex}. הגרגירים שנצברו עד כה נשמרים! 🦴`,
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
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">כשמופעל — יש לכל שחקן 3 דקות לסיים תור (2 דקות ברמת אלוף, 1:30 בגיבור). גרגירים שנצברו לפני שהזמן נגמר — <strong>נשמרים!</strong><br>💡 כבה אותו עם ילדים קטנים, כשמתרגלים ראשונה, או במשחק שיתופי רגוע.</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:11px 13px">
        <strong>🏁 מטרת המשחק</strong>
        <p style="margin-top:5px;color:#4b5563;font-size:.88rem;line-height:1.6">
        <strong>🔄 4 סיבובים</strong> — כולם משחקים 4 סיבובים ומי שצבר הכי הרבה מנצח. משחק קצוב ומאוזן.<br>
        <strong>🎯 ראשון ל-100</strong> — המשחק נמשך עד שמישהו מגיע ל-100 גרגירים ומנצח מיידית. מתאים לשחקנים חזקים ומשחקים ארוכים.<br>
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
  videoMenuTitle: "🎬 סרטוני הסבר",
  videoMenuTutorial: "🎬 טוטוריאל — הסבר על הלוח, הדלתות והכללים",
  videoMenuGameplay: "🎮 דוגמה למשחק מהיר מלא",
  videoMenuNote: "סרטונים לפי רמה — זמינים בעמוד ההגדרות ליד כל רמה",

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
};
