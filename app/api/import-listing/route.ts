import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export interface ImportedListing {
  title?: string
  street?: string
  city?: string
  neighborhood?: string
  price?: number
  priceOnRequest?: boolean
  builtArea?: number
  gardenArea?: number
  rooms?: number
  floor?: number
  totalFloors?: number
  parkingSpots?: number
  parkingType?: 'covered' | 'outdoor'
  hasStorage?: boolean
  hasSaferoom?: boolean
  hasElevator?: boolean
  airDirections?: ('N' | 'S' | 'E' | 'W')[]
  buildYear?: number
  renovationYear?: number
  bathrooms?: number
  rawStory?: string
}

const MAX_INPUT_CHARS = 3_000
const MAX_TOKENS_OUTPUT = 512

async function isAgencyRateLimited(agencyId: string): Promise<boolean> {
  if (!process.env.KV_URL) return false
  try {
    const { kv } = await import('@vercel/kv')
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const key = `ai_rl:import:${agencyId}:${today}`
    const count = await kv.incr(key)
    if (count === 1) await kv.expire(key, 86_400)
    return count > 30 // 30 imports per agency per day
  } catch {
    return false
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json() as { text?: string; agencyId?: string };
  const raw = body.text?.trim() ?? ''

  if (raw.length < 20) {
    return NextResponse.json({ error: 'טקסט קצר מדי' }, { status: 400 });
  }

  // Hard cap on input to prevent runaway token bills
  const text = raw.slice(0, MAX_INPUT_CHARS)

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  // Per-agency daily rate limit (graceful — no block in dev without KV)
  if (body.agencyId && await isAgencyRateLimited(body.agencyId)) {
    return NextResponse.json({ error: 'הגעת למגבלה היומית לייבוא נכסים' }, { status: 429 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    // Haiku: extraction task, no creativity needed — ~10× cheaper than Sonnet
    model: 'claude-haiku-4-5-20251001',
    max_tokens: MAX_TOKENS_OUTPUT,
    system: `אתה מחלץ מידע מובנה ממודעות נדל"ן בישראל. החזר JSON בלבד, ללא markdown, ללא הסברים.
אם ערך לא קיים במודעה — אל תכלול אותו ב-JSON (עדיף שדה חסר על פני ניחוש שגוי).`,
    messages: [
      {
        role: 'user',
        content: `חלץ את הפרטים הבאים מהמודעה. החזר JSON עם השדות האלה (כלול רק שדות שאתה בטוח לגביהם):

{
  "title": "כותרת/שם הנכס",
  "street": "שם רחוב ומספר",
  "city": "עיר",
  "neighborhood": "שכונה",
  "price": 1500000,
  "priceOnRequest": false,
  "builtArea": 85,
  "gardenArea": 20,
  "rooms": 4,
  "floor": 3,
  "totalFloors": 8,
  "parkingSpots": 1,
  "parkingType": "covered",
  "hasStorage": true,
  "hasSaferoom": true,
  "hasElevator": true,
  "airDirections": ["N","W"],
  "buildYear": 2005,
  "renovationYear": 2020,
  "bathrooms": 2,
  "rawStory": "תיאור חופשי כפי שמופיע במודעה"
}

המודעה:
${text}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'תגובה לא תקינה מה-AI' }, { status: 500 });
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'לא הצלחתי לנתח את המודעה' }, { status: 500 });
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    return NextResponse.json({ listing: parsed });
  } catch {
    return NextResponse.json({ error: 'שגיאה בפענוח תשובת ה-AI' }, { status: 500 });
  }
}
