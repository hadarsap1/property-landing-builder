import type { PropertyProject } from '@/types/project';

export interface StaticExample {
  id: string;
  template: PropertyProject['template'];
  title: string;
  city: string;
  rooms: number;
  builtArea: number;
  price: number;
  tagline: string;
  highlights: string[];
  heroBg: string;
  heroText: string;
  accent: string;
  badge: string;
}

export const STATIC_EXAMPLES: StaticExample[] = [
  {
    id: 'dark-luxury',
    template: 'dark-luxury',
    title: 'פנטהאוז מרהיב בלב תל אביב',
    city: 'תל אביב',
    rooms: 5,
    builtArea: 180,
    price: 8_900_000,
    tagline: 'גג פרטי, נוף עד הים, פינישים של יוקרה',
    highlights: ['גג פרטי 60 מ״ר', 'נוף פנורמי לים', 'חניה כפולה'],
    heroBg: 'linear-gradient(135deg,#0a0e1a 0%,#1a1f35 100%)',
    heroText: '#c9a96e',
    accent: '#c9a96e',
    badge: 'יוקרה',
  },
  {
    id: 'warm-homey',
    template: 'warm-homey',
    title: 'בית פרטי חמים בכפר סבא',
    city: 'כפר סבא',
    rooms: 6,
    builtArea: 220,
    price: 4_200_000,
    tagline: 'גינה ירוקה, שקט מוחלט, מרחק צעדים מהפארק',
    highlights: ['גינה 250 מ״ר', 'חדר שינה ראשי עם ממ״ד', 'חניה + מחסן'],
    heroBg: 'linear-gradient(135deg,#8b5e3c 0%,#6b4530 100%)',
    heroText: '#f5efe6',
    accent: '#c17f51',
    badge: 'ביתי וחמים',
  },
  {
    id: 'modern-blue',
    template: 'modern-blue',
    title: 'דירת 4 חדרים מחודשת ברמת גן',
    city: 'רמת גן',
    rooms: 4,
    builtArea: 110,
    price: 2_850_000,
    tagline: 'שיפוץ מלא 2024, מטבח מודרני, מרפסת שמש',
    highlights: ['שיפוץ מלא', 'מרפסת 18 מ״ר', 'קרוב לרכבת'],
    heroBg: 'linear-gradient(135deg,#1e3a5f 0%,#2d5a8e 100%)',
    heroText: '#ffffff',
    accent: '#3b82f6',
    badge: 'מודרני',
  },
  {
    id: 'nature-space',
    template: 'nature-space',
    title: 'וילה ירוקה בפרדס חנה',
    city: 'פרדס חנה',
    rooms: 7,
    builtArea: 300,
    price: 5_500_000,
    tagline: 'חצר בת דונם, בריכה, שקט כפרי לצד הכביש המהיר',
    highlights: ['בריכת שחייה', 'חצר דונם', 'בית אורחים נפרד'],
    heroBg: 'linear-gradient(135deg,#2d5a27 0%,#1a3518 100%)',
    heroText: '#f0f5f0',
    accent: '#4ade80',
    badge: 'טבע ושקט',
  },
  {
    id: 'urban-bold',
    template: 'urban-bold',
    title: 'לופט עיצובי בשכונת פלורנטין',
    city: 'תל אביב',
    rooms: 3,
    builtArea: 95,
    price: 3_100_000,
    tagline: 'תקרות גבוהות, חלונות ענקיים, אווירת ניו יורק',
    highlights: ['תקרה 4 מ׳', 'חלונות ענק', 'לב שכונת הבועז'],
    heroBg: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)',
    heroText: '#f0e68c',
    accent: '#f59e0b',
    badge: 'אורבני',
  },
];
