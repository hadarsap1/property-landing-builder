// questionsData.js - בנק שאלות ונתונים לכל הרי ישראל ולפי דרגות קושי

export const DIFFICULTY_LEVELS = {
  easy: { id: 'easy', name: 'קל (מתחילים)', description: 'מילים קצרות (2-3 אותיות) ותרגילי חשבון עד 10', color: '#4ADE80' },
  medium: { id: 'medium', name: 'בינוני (מתקדמים)', description: 'מילים של 3-4 אותיות ותרגילי חשבון עד 15', color: '#FBBF24' },
  hard: { id: 'hard', name: 'מאתגר (אלופים)', description: 'מילים ארוכות (4-5+ אותיות) ותרגילים עד 20 עם נעלמים', color: '#F87171' }
};

export const ISRAEL_MOUNTAINS = [
  { id: 1, name: 'הר החרמון', region: 'צפון הגולן ❄️', theme: 'אותיות דפוס וצלילים', icon: '🏔️', type: 'letter_rec', topPercent: 8, leftPercent: 65 },
  { id: 2, name: 'הר תבור', region: 'גליל תחתון 🌳', theme: 'ספירה וכמויות', icon: '🍎', type: 'counting', topPercent: 22, leftPercent: 55 },
  { id: 3, name: 'הר הכרמל', region: 'חיפה והכרמל 🌲', theme: 'כתיבת אותיות דפוס', icon: '✍️', type: 'letter_tracing', topPercent: 35, leftPercent: 40 },
  { id: 4, name: 'הר הגלבוע', region: 'עמק יזרעאל 🌾', theme: 'חשבון חיבור וחיסור', icon: '➕', type: 'math', topPercent: 48, leftPercent: 62 },
  { id: 5, name: 'הרי ירושלים', region: 'ירושלים והמרכז 🏰', theme: 'הרכבת מילים בדפוס', icon: '🧩', type: 'word_builder', topPercent: 62, leftPercent: 52 },
  { id: 6, name: 'הר רמון', region: 'מכתש רמון והנגב 🏜️', theme: 'השלמת סדרות', icon: '🔢', type: 'sequence', topPercent: 78, leftPercent: 42 },
  { id: 7, name: 'הרי אילת', region: 'אילת והערבה 🐠', theme: 'הר האלופים המסכם', icon: '🏆', type: 'champion_mix', topPercent: 92, leftPercent: 48 }
];

// בנק מילים רחב ומגוון לפי דרגות קושי
const WORD_BANK = {
  easy: [
    { word: 'תפוח', emoji: '🍎', start: 'ת', startOptions: ['ת', 'ב', 'ר', 'מ'], display: 'ת פ _ ח', missing: 'ו', missingOptions: ['ו', 'י', 'א', 'ם'] },
    { word: 'דוב', emoji: '🐻', start: 'ד', startOptions: ['ד', 'ג', 'ר', 'כ'], display: 'ד _ ב', missing: 'ו', missingOptions: ['ו', 'י', 'א', 'ם'] },
    { word: 'גל', emoji: '🌊', start: 'ג', startOptions: ['ג', 'ד', 'ז', 'ח'], display: 'ג _', missing: 'ל', missingOptions: ['ל', 'ר', 'ם', 'נ'] },
    { word: 'אמא', emoji: '👩', start: 'א', startOptions: ['א', 'ב', 'מ', 'נ'], display: 'א _ א', missing: 'מ', missingOptions: ['מ', 'נ', 'ב', 'כ'] },
    { word: 'דג', emoji: '🐟', start: 'ד', startOptions: ['ד', 'ג', 'ל', 'ר'], display: 'ד _', missing: 'ג', missingOptions: ['ג', 'ד', 'ז', 'ח'] },
    { word: 'הר', emoji: '⛰️', start: 'ה', startOptions: ['ה', 'א', 'ר', 'ת'], display: 'ה _', missing: 'ר', missingOptions: ['ר', 'ל', 'נ', 'ם'] },
    { word: 'פר', emoji: '🐂', start: 'פ', startOptions: ['פ', 'ב', 'ר', 'ל'], display: 'פ _', missing: 'ר', missingOptions: ['ר', 'ל', 'נ', 'ם'] },
    { word: 'חג', emoji: '🎈', start: 'ח', startOptions: ['ח', 'ה', 'ג', 'ד'], display: 'ח _', missing: 'ג', missingOptions: ['ג', 'ד', 'ז', 'ח'] },
    { word: 'כד', emoji: '🏺', start: 'כ', startOptions: ['כ', 'ל', 'מ', 'נ'], display: 'כ _', missing: 'ד', missingOptions: ['ד', 'ג', 'ר', 'כ'] },
    { word: 'פה', emoji: '👄', start: 'פ', startOptions: ['פ', 'ב', 'ר', 'מ'], display: 'פ _', missing: 'ה', missingOptions: ['ה', 'א', 'ר', 'ת'] }
  ],
  medium: [
    { word: 'שולחן', emoji: '🪑', start: 'ש', startOptions: ['ש', 'ס', 'ל', 'כ'], display: 'ש _ ל ח ן', missing: 'ו', missingOptions: ['ו', 'י', 'א', 'ם'] },
    { word: 'בלון', emoji: '🎈', start: 'ב', startOptions: ['ב', 'פ', 'מ', 'נ'], display: 'ב _ ו ן', missing: 'ל', missingOptions: ['ל', 'ר', 'ם', 'נ'] },
    { word: 'חתול', emoji: '🐱', start: 'ח', startOptions: ['ח', 'ה', 'כ', 'ת'], display: 'ח ת _ ל', missing: 'ו', missingOptions: ['ו', 'י', 'א', 'ם'] },
    { word: 'בית', emoji: '🏠', start: 'ב', startOptions: ['ב', 'י', 'ת', 'נ'], display: 'ב _ ת', missing: 'י', missingOptions: ['י', 'ו', 'א', 'ם'] },
    { word: 'שמש', emoji: '☀️', start: 'ש', startOptions: ['ש', 'מ', 'ס', 'ר'], display: 'ש _ ש', missing: 'מ', missingOptions: ['מ', 'נ', 'ס', 'ר'] },
    { word: 'ספר', emoji: '📚', start: 'ס', startOptions: ['ס', 'ש', 'פ', 'ר'], display: 'ס _ ר', missing: 'פ', missingOptions: ['פ', 'ב', 'מ', 'נ'] },
    { word: 'עץ', emoji: '🌳', start: 'ע', startOptions: ['ע', 'א', 'ץ', 'צ'], display: 'ע _', missing: 'ץ', missingOptions: ['ץ', 'צ', 'ם', 'ן'] },
    { word: 'ירח', emoji: '🌙', start: 'י', startOptions: ['י', 'ו', 'ר', 'ח'], display: 'י _ ח', missing: 'ר', missingOptions: ['ר', 'ל', 'נ', 'ם'] },
    { word: 'כלב', emoji: '🐕', start: 'כ', startOptions: ['כ', 'ל', 'ב', 'נ'], display: 'כ _ ב', missing: 'ל', missingOptions: ['ל', 'ר', 'ם', 'נ'] },
    { word: 'פרח', emoji: '🌸', start: 'פ', startOptions: ['פ', 'ר', 'ח', 'כ'], display: 'פ _ ח', missing: 'ר', missingOptions: ['ר', 'ל', 'נ', 'ם'] }
  ],
  hard: [
    { word: 'מכונית', emoji: '🚗', start: 'מ', startOptions: ['מ', 'נ', 'כ', 'ת'], display: 'מ כ ו _ י ת', missing: 'נ', missingOptions: ['נ', 'מ', 'כ', 'ת'] },
    { word: 'פילפילון', emoji: '🐘', start: 'פ', startOptions: ['פ', 'צ', 'ק', 'ר'], display: 'פ _ ל פ י ל ו ן', missing: 'י', missingOptions: ['י', 'ו', 'א', 'ל'] },
    { word: 'מדרכה', emoji: '🛣️', start: 'מ', startOptions: ['מ', 'נ', 'ל', 'ס'], display: 'מ ד _ כ ה', missing: 'ר', missingOptions: ['ר', 'ל', 'נ', 'ם'] },
    { word: 'חללית', emoji: '🚀', start: 'ח', startOptions: ['ח', 'ל', 'מ', 'ת'], display: 'ח _ ל י ת', missing: 'ל', missingOptions: ['ל', 'ר', 'ם', 'נ'] },
    { word: 'סוכרייה', emoji: '🍭', start: 'ס', startOptions: ['ס', 'כ', 'ר', 'י'], display: 'ס _ כ ר י י ה', missing: 'ו', missingOptions: ['ו', 'י', 'א', 'ם'] },
    { word: 'ספגטי', emoji: '🍝', start: 'ס', startOptions: ['ס', 'פ', 'ג', 'ט'], display: 'ס _ ג ט י', missing: 'פ', missingOptions: ['פ', 'ב', 'מ', 'נ'] }
  ]
};

// בנק אותיות לחיבור נקודות
const CONNECT_DOTS_BANK = [
  { char: 'א', name: 'אָלֶף', dots: [{ id: 1, label: '1', x: 20, y: 20 }, { id: 2, label: '2', x: 80, y: 80 }, { id: 3, label: '3', x: 70, y: 30 }, { id: 4, label: '4', x: 30, y: 70 }] },
  { char: 'ב', name: 'בֵּית', dots: [{ id: 1, label: '1', x: 20, y: 20 }, { id: 2, label: '2', x: 80, y: 20 }, { id: 3, label: '3', x: 80, y: 80 }, { id: 4, label: '4', x: 20, y: 80 }] },
  { char: 'ג', name: 'גִּימֵל', dots: [{ id: 1, label: '1', x: 80, y: 20 }, { id: 2, label: '2', x: 30, y: 20 }, { id: 3, label: '3', x: 30, y: 80 }, { id: 4, label: '4', x: 60, y: 80 }] },
  { char: 'ד', name: 'דָּלֶת', dots: [{ id: 1, label: '1', x: 20, y: 20 }, { id: 2, label: '2', x: 80, y: 20 }, { id: 3, label: '3', x: 80, y: 80 }] },
  { char: 'ה', name: 'הֵא', dots: [{ id: 1, label: '1', x: 20, y: 20 }, { id: 2, label: '2', x: 80, y: 20 }, { id: 3, label: '3', x: 80, y: 80 }, { id: 4, label: '4', x: 30, y: 50 }] },
  { char: 'מ', name: 'מֵם', dots: [{ id: 1, label: '1', x: 20, y: 80 }, { id: 2, label: '2', x: 20, y: 20 }, { id: 3, label: '3', x: 80, y: 20 }, { id: 4, label: '4', x: 80, y: 80 }] },
  { char: 'ר', name: 'רֵישׁ', dots: [{ id: 1, label: '1', x: 20, y: 20 }, { id: 2, label: '2', x: 80, y: 20 }, { id: 3, label: '3', x: 80, y: 80 }] },
  { char: 'ש', name: 'שִׁין', dots: [{ id: 1, label: '1', x: 20, y: 20 }, { id: 2, label: '2', x: 20, y: 80 }, { id: 3, label: '3', x: 50, y: 80 }, { id: 4, label: '4', x: 80, y: 80 }] }
];

function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function getMountainQuestions(mountainId, difficulty = 'easy') {
  const words = shuffleArray(WORD_BANK[difficulty] || WORD_BANK.easy);

  switch (mountainId) {
    case 1: // הר החרמון - זיהוי אותיות
      return words.slice(0, 3).map((w, idx) => ({
        id: `1-${idx + 1}`,
        type: 'letter_rec',
        title: `תרגיל ${idx + 1}/3: באיזו אות מתחילה המילה?`,
        question: `באיזו אות דפוס מתחילה המילה ${w.word}?`,
        targetWord: w.word,
        targetEmoji: w.emoji,
        correctAnswer: w.start,
        options: w.startOptions,
        hint: `הקשב/י לצליל הראשון הפותח במילה ${w.word}!`,
        explanation: `נכון מאוד! המילה ${w.word} מתחילה באות ${w.start} בדפוס!`
      }));

    case 2: // הר תבור - ספירה וכמויות
      return [
        {
          id: '2-1',
          type: 'counting',
          title: 'תרגיל 1/3: ספירת תפוחים',
          question: 'כמה תפוחים יש על העץ?',
          countTarget: difficulty === 'easy' ? 4 : (difficulty === 'medium' ? 7 : 12),
          emoji: '🍎',
          options: difficulty === 'easy' ? [3, 4, 5, 2] : (difficulty === 'medium' ? [6, 7, 8, 5] : [10, 12, 14, 11]),
          hint: 'לחץ/י על כל תפוח כדי לספור אותו בסבלנות',
          explanation: 'ספירה מצוינת! תשובה נכונה!'
        },
        {
          id: '2-2',
          type: 'counting',
          title: 'תרגיל 2/3: ספירת כוכבים',
          question: 'כמה כוכבים מנצנצים בשמיים?',
          countTarget: difficulty === 'easy' ? 5 : (difficulty === 'medium' ? 9 : 15),
          emoji: '⭐',
          options: difficulty === 'easy' ? [4, 5, 6, 3] : (difficulty === 'medium' ? [8, 9, 10, 7] : [13, 15, 16, 14]),
          hint: 'ספור/י את הכוכבים המנצנצים אחד-אחד',
          explanation: 'מעולה! ספרת את כל הכוכבים!'
        },
        {
          id: '2-3',
          type: 'counting',
          title: 'תרגיל 3/3: ספירת גלגלים',
          question: 'כמה גלגלים יש במגרש?',
          countTarget: difficulty === 'easy' ? 3 : (difficulty === 'medium' ? 8 : 14),
          emoji: '🛞',
          options: difficulty === 'easy' ? [2, 3, 4, 5] : (difficulty === 'medium' ? [7, 8, 9, 6] : [12, 14, 15, 13]),
          hint: 'לחץ/י על כל גלגל לספירה מדוייקת',
          explanation: 'הר תבור הושלם! כל הכבוד!'
        }
      ];

    case 3: { // הר הכרמל - כתיבת אותיות דפוס ב-Canvas
      const dotsPool = shuffleArray(CONNECT_DOTS_BANK);
      return dotsPool.slice(0, 3).map((d, idx) => ({
        id: `3-${idx + 1}`,
        type: 'letter_tracing',
        title: `תרגיל ${idx + 1}/3: כתיבת אות הדפוס ${d.char}`,
        question: `צייר/י את האות הדפוס ${d.char} (שמה: ${d.name}) לפי קווי המתאר`,
        targetChar: d.char,
        charName: d.name,
        hint: `עקוב/י את קווי המתאר וצייר/י מעל האות המקווקות`,
        explanation: `כתבת את האות הדפוס ${d.char} בצורה מופלאה!`
      }));
    }

    case 4: // הר הגלבוע - חשבון חיבור וחיסור
      return [
        {
          id: '4-1',
          type: 'math',
          title: 'תרגיל 1/3: תרגיל חיבור',
          question: difficulty === 'easy' ? 'כמה זה 3 ועוד 2?' : (difficulty === 'medium' ? 'כמה זה 7 ועוד 5?' : 'כמה זה 8 ועוד 6?'),
          num1: difficulty === 'easy' ? 3 : (difficulty === 'medium' ? 7 : 8),
          num2: difficulty === 'easy' ? 2 : (difficulty === 'medium' ? 5 : 6),
          op: '+',
          emoji1: '🚗',
          emoji2: '🚗',
          options: difficulty === 'easy' ? [4, 5, 6, 3] : (difficulty === 'medium' ? [11, 12, 13, 10] : [13, 14, 15, 12]),
          correctAnswer: difficulty === 'easy' ? 5 : (difficulty === 'medium' ? 12 : 14),
          hint: 'חבר/י את שתי הקבוצות יחד',
          explanation: 'תשובה נכונה בחשבון!'
        },
        {
          id: '4-2',
          type: 'math',
          title: 'תרגיל 2/3: תרגיל חיסור',
          question: difficulty === 'easy' ? 'כמה זה 6 פחות 2?' : (difficulty === 'medium' ? 'כמה זה 10 פחות 4?' : 'כמה זה 16 פחות 7?'),
          num1: difficulty === 'easy' ? 6 : (difficulty === 'medium' ? 10 : 16),
          num2: difficulty === 'easy' ? 2 : (difficulty === 'medium' ? 4 : 7),
          op: '-',
          emoji1: '🍎',
          options: difficulty === 'easy' ? [3, 4, 5, 2] : (difficulty === 'medium' ? [5, 6, 7, 8] : [8, 9, 10, 11]),
          correctAnswer: difficulty === 'easy' ? 4 : (difficulty === 'medium' ? 6 : 9),
          hint: 'קח/י את המספר הראשון ותחסיר/י ממנו',
          explanation: 'חיסור מדויק ביותר!'
        },
        {
          id: '4-3',
          type: 'math',
          title: 'תרגיל 3/3: תרגיל מאתגר בחשבון',
          question: difficulty === 'easy' ? 'כמה זה 4 ועוד 3?' : (difficulty === 'medium' ? 'כמה זה 9 ועוד 4?' : 'מהו המספר החסר: 7 ועוד כמה שווה 13?'),
          equationStr: difficulty === 'easy' ? '4 + 3 = ?' : (difficulty === 'medium' ? '9 + 4 = ?' : '7 + ? = 13'),
          options: difficulty === 'easy' ? [6, 7, 8, 5] : (difficulty === 'medium' ? [12, 13, 14, 11] : [5, 6, 7, 4]),
          correctAnswer: difficulty === 'easy' ? 7 : (difficulty === 'medium' ? 13 : 6),
          hint: 'ספור/י באצבעות או השתמש/י בדף טיוטה',
          explanation: 'הר הגלבוע הושלם בחישובים מבריקים!'
        }
      ];

    case 5: // הרי ירושלים - הרכבת מילים בדפוס
      return words.slice(0, 3).map((w, idx) => ({
        id: `5-${idx + 1}`,
        type: 'word_builder',
        title: `תרגיל ${idx + 1}/3: מילה חסרה בדפוס`,
        question: `איזו אות דפוס חסרה כדי להשלים את המילה ${w.word}?`,
        displayWord: w.display,
        fullWord: w.word,
        missingLetter: w.missing,
        options: w.missingOptions,
        emoji: w.emoji,
        hint: `איזו אות דפוס חסרה לציירת המילה ${w.word}?`,
        explanation: `אות דפוס נכונה! המילה היא ${w.word}!`
      }));

    case 6: // הר רמון - השלמת סדרות
      return [
        {
          id: '6-1',
          type: 'sequence',
          title: 'תרגיל 1/3: סדרת מספרים',
          question: 'מהו המספר החסר בסדרה?',
          sequence: difficulty === 'easy' ? ['1', '2', '?', '4', '5'] : (difficulty === 'medium' ? ['5', '6', '?', '8', '9'] : ['10', '12', '?', '16', '18']),
          correctAnswer: difficulty === 'easy' ? '3' : (difficulty === 'medium' ? '7' : '14'),
          options: difficulty === 'easy' ? ['3', '6', '0', '7'] : (difficulty === 'medium' ? ['7', '8', '4', '10'] : ['13', '14', '15', '11']),
          hint: 'עקוב/י אחרי הסדרה מתחילה לסוף',
          explanation: 'סדרה נכונה ביותר!'
        },
        {
          id: '6-2',
          type: 'sequence',
          title: 'תרגיל 2/3: סדרת אותיות דפוס',
          question: 'איזו אות דפוס חסרה בסדרה?',
          sequence: difficulty === 'easy' ? ['א', 'ב', '?', 'ד', 'ה'] : (difficulty === 'medium' ? ['ג', 'ד', '?', 'ו', 'ז'] : ['כ', 'ל', '?', 'נ', 'ס']),
          correctAnswer: difficulty === 'easy' ? 'ג' : (difficulty === 'medium' ? 'ה' : 'מ'),
          options: difficulty === 'easy' ? ['ג', 'ו', 'ז', 'ח'] : (difficulty === 'medium' ? ['ה', 'ו', 'ז', 'ח'] : ['מ', 'נ', 'ע', 'פ']),
          hint: 'איזו אות דפוס באה לפי סדר האלף-בית?',
          explanation: 'אות סדרה נכונה!'
        },
        {
          id: '6-3',
          type: 'sequence',
          title: 'תרגיל 3/3: סדרה מאתגרת',
          question: 'מהו האיבר החסר בסדרה?',
          sequence: difficulty === 'easy' ? ['2', '3', '4', '?', '6'] : (difficulty === 'medium' ? ['2', '4', '6', '?', '10'] : ['3', '6', '9', '?', '15']),
          correctAnswer: difficulty === 'easy' ? '5' : (difficulty === 'medium' ? '8' : '12'),
          options: difficulty === 'easy' ? ['5', '7', '8', '1'] : (difficulty === 'medium' ? ['7', '8', '9', '11'] : ['11', '12', '13', '14']),
          hint: 'ספור/י את הקפיצה בין המספרים',
          explanation: 'הר רמון הושלם בהצלחה!'
        }
      ];

    case 7: // הרי אילת - הר האלופים
    default:
      return [
        {
          id: '7-1',
          type: 'math',
          title: 'תרגיל 1/3: אלוף החשבון',
          question: difficulty === 'easy' ? 'כמה זה 4 ועוד 4?' : (difficulty === 'medium' ? 'כמה זה 8 ועוד 6?' : 'כמה זה 12 ועוד 8?'),
          num1: difficulty === 'easy' ? 4 : (difficulty === 'medium' ? 8 : 12),
          num2: difficulty === 'easy' ? 4 : (difficulty === 'medium' ? 6 : 8),
          op: '+',
          emoji1: '⭐',
          options: difficulty === 'easy' ? [7, 8, 9, 6] : (difficulty === 'medium' ? [13, 14, 15, 12] : [18, 19, 20, 17]),
          correctAnswer: difficulty === 'easy' ? 8 : (difficulty === 'medium' ? 14 : 20),
          hint: 'חיבור אלופים!',
          explanation: 'חישוב מבריק!'
        },
        {
          id: '7-2',
          type: 'letter_rec',
          title: 'תרגיל 2/3: אלוף אותיות הדפוס',
          question: 'איזו אות דפוס מתחילה את המילה אילת?',
          targetWord: 'אילת',
          targetEmoji: '🐟',
          correctAnswer: 'א',
          options: ['א', 'ע', 'י', 'ל'],
          hint: 'איזו אות ראשונה במילה א-י-ל-ת?',
          explanation: 'האות אָלֶף בדפוס!'
        },
        {
          id: '7-3',
          type: 'sequence',
          title: 'תרגיל 3/3: אתגר סיום המסע!',
          question: 'איזו אות דפוס חסרה בסדרה?',
          sequence: ['א', 'ב', 'ג', '?', 'ה'],
          correctAnswer: 'ד',
          options: ['ד', 'ו', 'ז', 'ח'],
          hint: 'האות הרביעית באלף-בית בדפוס!',
          explanation: 'אלוף האלופים עומר! סיימת בהצלחה את כל מפת ישראל!'
        }
      ];
  }
}
