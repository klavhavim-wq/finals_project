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
         x: '<div style="text-align:center;margin:0 0 8px"><svg width="160" height="70" viewBox="0 0 136 70" xmlns="http://www.w3.org/2000/svg"><polygon points="30,13 49,24 49,46 30,57 11,46 11,24" fill="#D1FAE5" stroke="#e5e7eb" stroke-width="1.5"/><polygon points="68,13 87,24 87,46 68,57 49,46 49,24" fill="#FFF8E7" stroke="#e5e7eb" stroke-width="1.5"/><polygon points="106,13 125,24 125,46 106,57 87,46 87,24" fill="#FEF08A" stroke="#e5e7eb" stroke-width="1.5"/><line x1="49" y1="24" x2="49" y2="46" stroke="#3B82F6" stroke-width="4" stroke-linecap="round"/><line x1="87" y1="24" x2="87" y2="46" stroke="#8B5CF6" stroke-width="4" stroke-linecap="round"/><text x="30" y="38" text-anchor="middle" font-size="10" font-family="serif">🐕</text><text x="106" y="38" text-anchor="middle" font-size="10" font-family="serif">⭐</text><text x="30" y="10" text-anchor="middle" font-size="7" fill="#555">12</text><text x="68" y="10" text-anchor="middle" font-size="7" fill="#555">24</text><text x="106" y="10" text-anchor="middle" font-size="7" fill="#555">36</text></svg></div>הלוח מכיל 100 משושים ממוספרים. בין המשושים יש קצוות צבעוניות — אלה ה"דלתות" שלנו! 🚪<br><br>כל צבע = סוג אוכל + רמת קושי.<br><br>🎯 <strong>המטרה:</strong> לצבור כמה שיותר גרגירים לבנק של הכלב! 🐶🦴',
       },
       {
         i: "🎯",
         t: "שלב 1 — מוצאים את היעד",
         x: '<div style="text-align:center;margin:0 0 8px"><svg width="180" height="70" viewBox="0 0 180 70" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="176" height="66" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/><text x="90" y="22" text-anchor="middle" font-size="12" fill="#64748b">🎯 כרטיס יעד</text><text x="90" y="50" text-anchor="middle" font-size="22" font-weight="bold" fill="#1e293b">6 × 4 = ?</text></svg></div>שולפים כרטיס יעד עם תרגיל חשבון, למשל: <strong><span dir="ltr">6 × 4 = ?</span></strong><br><br>פותרים בראש 🧠 ולוחצים על המשושה עם התשובה (24) בלוח!<br><br>טעות? <strong>אפשר לנסות שוב כמה פעמים שרוצים!</strong> 😊<br>רוצים עזרה? לוחצים "הראה תשובה".<br><br>ℹ️ <strong>בשלב הזה אין הגבלת זמן!</strong>',
       },
       {
         i: "🗺️",
         t: "שלב 2 — מתכננים מסלול",
         x: '<div style="text-align:center;margin:0 0 8px"><svg width="120" height="110" viewBox="-5 0 250 245" xmlns="http://www.w3.org/2000/svg"><polygon points="120,20 207,70 207,170 120,220 33,170 33,70" fill="#FFF8E7" stroke="#e5e7eb" stroke-width="2"/><line x1="120" y1="20" x2="207" y2="70" stroke="#3B82F6" stroke-width="14" stroke-linecap="round"/><line x1="207" y1="70" x2="207" y2="170" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round"/><line x1="207" y1="170" x2="120" y2="220" stroke="#F59E0B" stroke-width="14" stroke-linecap="round"/><line x1="120" y1="220" x2="33" y2="170" stroke="#EF4444" stroke-width="14" stroke-linecap="round"/><line x1="33" y1="170" x2="33" y2="70" stroke="#DC2626" stroke-width="14" stroke-linecap="round"/><line x1="33" y1="70" x2="120" y2="20" stroke="#3B82F6" stroke-width="14" stroke-linecap="round"/><text x="120" y="130" text-anchor="middle" dominant-baseline="middle" font-size="38" font-family="serif">🐕</text></svg></div>זכרו — המטרה היא לצבור יותר גרגירים! 🦴<br>לוחצים על משושים לבניית המסלול ליעד (לא לשכוח לסמן גם את משושה היעד עצמו!).<br><br>הקצה הצבעונית בין משושים = סוג אוכל:<br><br>🦴 <strong>עצם</strong> — לוח הכפל עד 4 | <span dir="ltr">1</span> גרגיר לצעד<br>🐟 <strong>דג</strong> — לוח הכפל עד 6 | <span dir="ltr">2</span> גרגירים לצעד<br>🍗 <strong>כנף</strong> — לוח הכפל עד 8 | <span dir="ltr">5</span> גרגירים לצעד<br>🌭 <strong>נקניקיה</strong> — לוח הכפל 7–9 | <span dir="ltr">10</span> גרגירים לצעד<br>🥩 <strong>סטייק</strong> — כפל ארוך | <span dir="ltr">20</span> גרגירים לצעד<br><em style="font-size:.85em;color:#7C3AED">סטייק — רמת גיבור בלבד!</em><br><br>קשה יותר = יותר גרגירים לבנק! 🐶',
       },
       {
         i: "🎨",
         t: "הדלתות — הצבעים על הלוח",
         x: '<div style="text-align:center;margin:0 0 8px"><svg width="160" height="145" viewBox="-5 0 250 245" xmlns="http://www.w3.org/2000/svg"><polygon points="120,20 207,70 207,170 120,220 33,170 33,70" fill="#FFF8E7" stroke="#e5e7eb" stroke-width="2"/><line x1="120" y1="20" x2="207" y2="70" stroke="#3B82F6" stroke-width="14" stroke-linecap="round"/><line x1="207" y1="70" x2="207" y2="170" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round"/><line x1="207" y1="170" x2="120" y2="220" stroke="#F59E0B" stroke-width="14" stroke-linecap="round"/><line x1="120" y1="220" x2="33" y2="170" stroke="#EF4444" stroke-width="14" stroke-linecap="round"/><line x1="33" y1="170" x2="33" y2="70" stroke="#DC2626" stroke-width="14" stroke-linecap="round"/><line x1="33" y1="70" x2="120" y2="20" stroke="#3B82F6" stroke-width="14" stroke-linecap="round"/><text x="120" y="130" text-anchor="middle" dominant-baseline="middle" font-size="38" font-family="serif">🐕</text></svg></div><div style="font-size:.78rem;line-height:1.95"><div>🦴 <strong style="color:#3B82F6">כחול — עצם</strong>: לוח הכפל עד 4 | <span dir="ltr">(2–4)×(2–4)</span> = <strong>1 גרגיר לצעד</strong> | <span dir="ltr">3×4=12</span> ✔</div><div>🐟 <strong style="color:#8B5CF6">סגול — דג</strong>: לוח הכפל עד 6 | <span dir="ltr">(3–6)×(3–6)</span> = <strong>2 גרגירים לצעד</strong> | <span dir="ltr">4×5=20</span> ✔</div><div>🍗 <strong style="color:#F59E0B">צהוב — כנף</strong>: לוח הכפל עד 8 | <span dir="ltr">(5–8)×(5–8)</span> = <strong>5 גרגירים לצעד</strong> | <span dir="ltr">6×7=42</span> ✔</div><div>🌭 <strong style="color:#EF4444">אדום — נקניקיה</strong>: לוח הכפל 7–9 | <span dir="ltr">(7–9)×(7–9)</span> = <strong>10 גרגירים לצעד</strong> | <span dir="ltr">8×9=72</span> ✔</div><div>🥩 <strong style="color:#DC2626">אדום-כהה — סטייק</strong>: גיבורים! | <span dir="ltr">(11–19)×(2–9)</span> = <strong>20 גרגירים לצעד</strong> | <span dir="ltr">13×4=52</span> ✔</div></div>',
       },
       {
         i: "✅",
         t: "בדיקה ואישור מסלול",
         x: 'לפני שיוצאים לדרך — בדקו את המסלול! 📝<br><br>תראו כמה גרגירים אפשריים, כמה צעדים, ואיזה דלתות על הדרך.<br><br>לא מרוצים? לוחצים "נקה" 🗑 ובונים מחדש!<br><br>מוכנים? לוחצים "אשר מסלול" ✅ ויוצאים לדרך!',
       },
       {
         i: "🐕",
         t: "שלב 3 — יוצאים לדרך!",
         x: 'הכלב קופץ ללוח ומתחיל לנוע! 🐾<br><br>לכל צעד:<br>1️⃣ לוחצים "זרוק" 🎲<br>2️⃣ מקבלים תרגיל כפל לפי צבע הדלת<br>3️⃣ עונים על ידי לחיצה על משושה, הקלדה, או כפתורי בחירה<br><br>✅ נכון → הכלב מתקדם + גרגירים! 🦴<br>❌ טעות → אפשר לנסות שוב בלי הגבלה!<br>💡 חושפים תשובה → הכלב נעצר, <strong>הגרגירים שנצברו עד כה נשמרים!</strong> 🦴',
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
         x: 'לפני שמתחילים אפשר להתאים את המשחק:<br><br>📊 <strong>רמת קושי</strong> — מתחילים עד גיבור<br>⏱ <strong>טיימר</strong> — מופעל או כבוי<br>🔤 <strong>כפתורי בחירה</strong> — לרמות מתחילים/בינוני<br>🦹 <strong>שוד</strong> — מופעל או כבוי<br>🤝 <strong>שיתופי</strong> — כולם ביחד במקום תחרות<br>🏁 <strong>מטרת המשחק</strong> — איך מנצחים?',
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
