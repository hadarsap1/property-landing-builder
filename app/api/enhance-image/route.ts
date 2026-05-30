import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { rateLimit } from '@/lib/rate-limit';

const MAX_BODY_BYTES = 12_000_000; // ~12 MB — a single base64 photo

const ENHANCE_PROMPT =
  'Enhance this real estate photo: improve brightness, contrast, and sharpness slightly. ' +
  'Correct white balance and reduce noise if needed. ' +
  'Do NOT add, remove, or change any objects, furniture, or room features. ' +
  'Keep every item in the room exactly as photographed. Return a clean, professional result.';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = await rateLimit(req, { name: 'enhance-image', limit: 15, windowMs: 60_000 });
  if (limited) return limited;

  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'התמונה גדולה מדי' }, { status: 413 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 503 });
  }

  let imageDataUrl: string;
  try {
    const body = (await req.json()) as { imageDataUrl?: string };
    if (!body.imageDataUrl?.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
    }
    imageDataUrl = body.imageDataUrl;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const mimeType = imageDataUrl.match(/^data:(image\/\w+);base64,/)?.[1] ?? 'image/jpeg';
    const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const file = new File([buffer], 'photo.jpg', { type: mimeType });

    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: file,
      prompt: ENHANCE_PROMPT,
      // 'auto' lets the model preserve the photo's aspect ratio instead of
      // squashing landscape listing photos into a 1:1 square.
      size: 'auto',
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: 'No image returned from AI' }, { status: 502 });
    }

    return NextResponse.json({ enhancedDataUrl: `data:image/png;base64,${b64}` });
  } catch (err) {
    console.error('[enhance-image]', err);
    return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 });
  }
}
