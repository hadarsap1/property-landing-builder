import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import type { PropertyProject } from '@/types/project';

interface GenerateRequestBody {
  project: PropertyProject;
}

const MAX_BODY_BYTES = 200_000; // ~200 KB — ample for a property's text fields

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = await rateLimit(req, { name: 'generate', limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'בקשה גדולה מדי' }, { status: 413 });
  }

  let body: GenerateRequestBody;
  try {
    body = (await req.json()) as GenerateRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { project } = body;

  if (!project || typeof project !== 'object') {
    return NextResponse.json({ error: 'Missing project data' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });

  const propertyDesc = `
    נכס: ${project.title}
    כתובת: ${project.street}, ${project.neighborhood}, ${project.city}
    חדרים: ${project.rooms}, שטח: ${project.builtArea} מ"ר
    קומה: ${project.floor} מתוך ${project.totalFloors}
    שנת בנייה: ${project.buildYear}
    מה אמר המוכר: ${project.rawStory}
  `;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
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
