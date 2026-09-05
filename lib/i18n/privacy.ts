import type { Locale } from "../engine/types";

/**
 * The privacy and credits notice, in both languages.
 *
 * This copy lives beside the Dict rather than inside it, on purpose. It is one
 * long document rather than a scattering of labels, and a description of what
 * the software does with a child's data has to say the same thing in Hebrew and
 * in English or it is worthless. Keeping the two versions in one file, section
 * by section, is what makes a drift between them visible.
 *
 * If the game's behaviour changes, this text changes with it. It is not
 * decoration: it is a statement to parents and to schools about where a child's
 * name goes.
 */

export interface PrivacySection {
  heading: string;
  body: string[];
}

export interface PrivacyCopy {
  /** browser tab title */
  title: string;
  pageTitle: string;
  updated: string;
  intro: string;
  sections: PrivacySection[];
  contactHeading: string;
  /** the sentence that introduces the address; the address itself follows it */
  contactIntro: string;
  contactEmail: string;
  creditsHeading: string;
  creditsBody: string[];
  backToGame: string;
  /** the footer link that points here */
  footerLink: string;
}

export const PRIVACY: Record<Locale, PrivacyCopy> = {
  he: {
    title: "פרטיות וקרדיטים",
    pageTitle: "פרטיות וקרדיטים",
    updated: "עודכן ב-5 בספטמבר 2026",
    intro:
      "המשחק הזה מיועד לילדים, ולכן הדף הזה מנסה לומר בפשטות מה בדיוק נשמר, איפה, ולכמה זמן. אין כאן חשבונות, אין פרסומות ואין מעקב.",
    sections: [
      {
        heading: "כשמשחקים לבד, במחשב או בטלפון",
        body: [
          "הכול נשאר על המכשיר שלכם, בזיכרון של הדפדפן, ולא נשלח לשום מקום.",
          "מה שנשמר שם: השמות שהוקלדו, תוצאות של משחקים קודמים, אילו תרגילים נענו נכון ואילו לא, כמה זמן לקח לענות, ורשימת התרגילים שכדאי לחזור עליהם. בנוסף נשמרות ההעדפות, למשל אם המוזיקה דלוקה.",
          "הנתונים האלה הם שלכם. הם לא מגיעים אלינו ואנחנו לא רואים אותם.",
        ],
      },
      {
        heading: "כשמשחקים יחד דרך האינטרנט",
        body: [
          "כדי שכמה ילדים ישחקו על אותו לוח, צריך שרת שמחזיק את הלוח המשותף. במצב הזה נשלח לשרת השם שהוקלד, כדי שהשחקנים האחרים בחדר יראו מי משחק, ונשלחות גם התשובות והמהלכים, כדי שכולם יראו את אותו לוח.",
          "מה שנשמר בשרת: קוד החדר, השמות של המשתתפים, הרמה, ההגדרות והמצב הנוכחי של הלוח. עד ארבעה שחקנים בחדר.",
          "כמה זמן: החדר נמחק אוטומטית שש שעות אחרי הפעילות האחרונה בו. אין צורך לעשות שום דבר כדי למחוק אותו.",
          "מה לא נשלח לשרת: פירוט זמני התגובה והרישום המפורט של התשובות. אלה נשארים על המכשיר גם במשחק קבוצתי.",
          "האתר מתארח בשירות Netlify, ושם יושבים גם חדרי המשחק במשך אותן שש שעות.",
        ],
      },
      {
        heading: "מה המשחק אף פעם לא אוסף",
        body: [
          "אין הרשמה, אין סיסמה, אין כתובת מייל ואין מספר טלפון.",
          "לא נשאלים גיל, כיתה, בית ספר או מקום מגורים.",
          "אין פרסומות, אין כלי מדידה של צד שלישי ואין סקריפטים חיצוניים. גם הגופנים מוגשים מהאתר עצמו ולא מגוגל.",
        ],
      },
      {
        heading: "בקשה קטנה",
        body: [
          "במשחק הקבוצתי עדיף להקליד שם פרטי או כינוי, ולא שם מלא. השם נועד רק כדי שהחברים בחדר ידעו מי משחק.",
        ],
      },
      {
        heading: "איך מוחקים",
        body: [
          "במסך הסיכום בסוף המשחק יש כפתור שמוחק את כל מה שנשמר על המכשיר, כולל התוצאות והרשימות.",
          "אפשר גם למחוק את נתוני האתר דרך ההגדרות של הדפדפן.",
          "חדרי משחק קבוצתיים נמחקים מעצמם, כאמור.",
        ],
      },
    ],
    contactHeading: "שאלות ופניות",
    contactIntro:
      "לכל שאלה על הפרטיות במשחק, או לבקשה למחוק מידע, אפשר לכתוב לכתובת",
    contactEmail: "klavhavim@gmail.com",
    creditsHeading: "קרדיטים",
    creditsBody: [
      "מוזיקת רקע: Leonardo Paz (Leohpaz), מתוך Ocean Music Pack. בשימוש באישור היוצר.",
      "המשחק פותח על ידי דפנה נודל.",
    ],
    backToGame: "חזרה למשחק",
    footerLink: "פרטיות וקרדיטים",
  },
  en: {
    title: "Privacy and credits",
    pageTitle: "Privacy and credits",
    updated: "Last updated 5 September 2026",
    intro:
      "This game is made for children, so this page tries to say plainly what is stored, where, and for how long. There are no accounts, no adverts and no tracking.",
    sections: [
      {
        heading: "Playing on your own, on a computer or a phone",
        body: [
          "Everything stays on your device, in the browser's own storage, and is never sent anywhere.",
          "What is kept there: the names typed in, results of earlier games, which exercises were answered correctly and which were not, how long each answer took, and the list of facts worth practising again. Preferences are kept too, such as whether the music is on.",
          "This is your data. It does not reach us and we cannot see it.",
        ],
      },
      {
        heading: "Playing together over the internet",
        body: [
          "For several children to share one board, a server has to hold that shared board. In this mode the name typed in is sent to the server so the other players in the room can see who is playing, and the answers and moves are sent too, so everyone sees the same board.",
          "What the server keeps: the room code, the players' names, the level, the settings and the current state of the board. Up to four players in a room.",
          "For how long: a room is deleted automatically six hours after the last activity in it. Nothing needs to be done to delete it.",
          "What is not sent to the server: the response times and the detailed record of answers. Those stay on the device even in a group game.",
          "The site is hosted on Netlify, and the game rooms sit there for those six hours.",
        ],
      },
      {
        heading: "What the game never collects",
        body: [
          "No sign-up, no password, no email address and no phone number.",
          "Nobody is asked for an age, a class, a school or a location.",
          "No adverts, no third-party measurement tools and no external scripts. Even the fonts are served from the site itself rather than from Google.",
        ],
      },
      {
        heading: "One small request",
        body: [
          "In the group game, a first name or a nickname is better than a full name. The name is only there so the others in the room know who is playing.",
        ],
      },
      {
        heading: "How to delete",
        body: [
          "The summary screen at the end of a game has a button that deletes everything kept on the device, including results and practice lists.",
          "Site data can also be cleared from the browser's own settings.",
          "Group game rooms delete themselves, as described above.",
        ],
      },
    ],
    contactHeading: "Questions",
    contactIntro:
      "For any question about privacy in this game, or to ask for data to be deleted, write to",
    contactEmail: "klavhavim@gmail.com",
    creditsHeading: "Credits",
    creditsBody: [
      "Background music: Leonardo Paz (Leohpaz), from the Ocean Music Pack. Used with the author's permission.",
      "The game was made by Daffy Nudel.",
    ],
    backToGame: "Back to the game",
    footerLink: "Privacy and credits",
  },
};
