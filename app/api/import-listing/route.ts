import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

const MAX_TEXT_LEN = 20_000; // a pasted listing is never this long

export interface ImportedListing {
  title?: string;
  street?: string;
  city?: string;
  neighborhood?: string;
  price?: number;
  priceOnRequest?: boolean;
  builtArea?: number;
  gardenArea?: number;
  rooms?: number;
  floor?: number;
  totalFloors?: number;
  parkingSpots?: number;
  parkingType?: 'covered' | 'outdoor';
  hasStorage?: boolean;
  hasSaferoom?: boolean;
  hasElevator?: boolean;
  airDirections?: ('N' | 'S' | 'E' | 'W')[];
  buildYear?: number;
  renovationYear?: number;
  bathrooms?: number;
  rawStory?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = await rateLimit(req, { name: 'import-listing', limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  let body: { text?: string };
  try {
    body = (await req.json()) as { text?: string };
  } catch {
    return NextResponse.json({ error: 'גוף בקשה לא תקין' }, { status: 400 });
  }
  const text = body.text?.trim();

  if (!text || text.length < 20) {
    return NextResponse.json({ error: 'טקסט קצר מדי' }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LEN) {
    return NextResponse.json({ error: 'הטקסט ארוך מדי' }, { status: 413 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let message: Anthropic.Message;
  try {
    message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `אתה מחלץ מידע מובנה ממודעות נדל"ן בישראל. החזר JSON בלבד, ללא markdown, ללא הסברים.
אם ערך לא קיים במודעה, אל תכלול אותו ב-JSON (עדיף שדה חסר על פני ניחוש שגוי).`,
    messages: [
      {
        role: 'user',
        content: `חלץ את הפרטים הבאים מהמודעה. החזר JSON עם השדות האלה (כלול רק שדות שאתה בטוח לגביהם):

{
  "title": "כותרת/שם הנכס",
  "street": "שם רחוב ומספר",
  "city": "עיר",
  "neighborhood": "שכונה",
  "price": 1500000,            // מחיר במספר שלם בשקלים
  "priceOnRequest": false,     // true אם כתוב "מחיר לפי פניה"
  "builtArea": 85,             // שטח בנוי במ"ר
  "gardenArea": 20,            // שטח גינה/מרפסת במ"ר
  "rooms": 4,                  // מספר חדרים (מספר עשרוני כגון 3.5)
  "floor": 3,                  // קומה
  "totalFloors": 8,            // סה"כ קומות בבניין
  "parkingSpots": 1,           // מספר חניות
  "parkingType": "covered",    // "covered" או "outdoor"
  "hasStorage": true,          // האם יש מחסן
  "hasSaferoom": true,         // האם יש ממ"ד
  "hasElevator": true,         // האם יש מעלית
  "airDirections": ["N","W"],  // כיווני אוויר: N/S/E/W
  "buildYear": 2005,           // שנת בנייה
  "renovationYear": 2020,      // שנת שיפוץ
  "bathrooms": 2,              // מספר שירותים/מקלחות
  "rawStory": "..."            // תיאור חופשי של הנכס כפי שמופיע במודעה
}

המודעה:
${text}`,
      },
    ],
    });
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : 'Unknown error';
    console.error('[import-listing] Anthropic error:', { message: m });
    return NextResponse.json({ error: 'שגיאה בחיבור ל-AI' }, { status: 502 });
  }

  const content = message.content[0];
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'תגובה לא תקינה מה-AI' }, { status: 500 });
  }

  // Extract JSON from response (handles cases where model wraps in markdown)
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'לא הצלחתי לנתח את המודעה' }, { status: 500 });
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as ImportedListing;
    return NextResponse.json({ listing: parsed });
  } catch {
    return NextResponse.json({ error: 'שגיאה בפענוח תשובת ה-AI' }, { status: 500 });
  }
}
