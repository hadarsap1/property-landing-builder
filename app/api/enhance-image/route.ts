import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const ENHANCE_PROMPT =
  'Enhance this real estate photo: improve brightness, contrast, and sharpness slightly. ' +
  'Correct white balance and reduce noise if needed. ' +
  'Do NOT add, remove, or change any objects, furniture, or room features. ' +
  'Keep every item in the room exactly as photographed. Return a clean, professional result.';

export async function POST(req: NextRequest): Promise<NextResponse> {
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
      size: '1024x1024',
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
