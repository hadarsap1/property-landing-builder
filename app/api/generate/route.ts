import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { PropertyProject } from '@/types/project';

const MAX_STORY_CHARS = 2_000  // truncate rawStory before sending
const MAX_TOKENS_OUTPUT = 640  // title+tagline+story+highlights well under this

interface GenerateRequestBody {
  project: PropertyProject;
  agencyId?: string;
}

async function isAgencyRateLimited(agencyId: string): Promise<boolean> {
  if (!process.env.KV_URL) return false
  try {
    const { kv } = await import('@vercel/kv')
    const today = new Date().toISOString().slice(0, 10)
    const key = `ai_rl:generate:${agencyId}:${today}`
    const count = await kv.incr(key)
    if (count === 1) await kv.expire(key, 86_400)
    return count > 50 // 50 generate calls per agency per day
  } catch {
    return false
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: GenerateRequestBody;
  try {
    body = (await req.json()) as GenerateRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { project, agencyId } = body;

  if (!project || typeof project !== 'object') {
    return NextResponse.json({ error: 'Missing project data' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  if (agencyId && await isAgencyRateLimited(agencyId)) {
    return NextResponse.json({ error: 'הגעת למגבלה היומית ליצירת תוכן' }, { status: 429 });
  }

  const client = new Anthropic({ apiKey });

  // Truncate free-text seller description to cap input tokens
  const rawStory = (project.rawStory ?? '').slice(0, MAX_STORY_CHARS)

  const propertyDesc = [
    project.title        && `נכס: ${project.title}`,
    project.street       && `כתובת: ${project.street}${project.neighborhood ? `, ${project.neighborhood}` : ''}${project.city ? `, ${project.city}` : ''}`,
    project.rooms        && `חדרים: ${project.rooms}`,
    project.builtArea    && `שטח: ${project.builtArea} מ"ר`,
    project.floor        && `קומה: ${project.floor}${project.totalFloors ? ` מתוך ${project.totalFloors}` : ''}`,
    project.buildYear    && `שנת בנייה: ${project.buildYear}`,
    rawStory             && `מה אמר המוכר: ${rawStory}`,
  ].filter(Boolean).join('\n')

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: MAX_TOKENS_OUTPUT,
      system: `אתה קופירייטר נדל"ן מהשורה הראשונה בשוק הישראלי. כותב בעברית. סגנון חם, ספציפי, ושכנועי - לא גנרי. הדגש על ייחודיות הנכס.`,
      messages: [
        {
          role: 'user',
          content: `כתוב תוכן שיווקי עבור הנכס הבא. החזר JSON בלבד (ללא markdown) עם המבנה:
{
  "title": "כותרת מרשימה לנכס",
  "tagline": "תגית קצרה וחזקה (עד 8 מילים)",
  "story": "2-3 פסקאות על הנכס, חמות ומשכנעות",
  "highlights": ["נקודה מרכזית 1", "נקודה מרכזית 2", "נקודה מרכזית 3"]
}

פרטי הנכס:
${propertyDesc}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'No text response from AI' }, { status: 500 });
    }

    try {
      const result = JSON.parse(content.text) as unknown;
      return NextResponse.json(result);
    } catch {
      const match = content.text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const extracted = JSON.parse(match[0]) as unknown;
          return NextResponse.json(extracted);
        } catch {
          return NextResponse.json({ error: 'Invalid JSON from AI' }, { status: 500 });
        }
      }
      return NextResponse.json({ error: 'Invalid JSON from AI' }, { status: 500 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[generate] Anthropic error:', { message });
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
  }
}
