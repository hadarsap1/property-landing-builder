import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { sql } from '@/lib/db';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const MAX_SCREENSHOT_BYTES = 2_000_000; // ~2 MB data URL

/** Escape HTML so user content can't inject markup into the notification email. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = await rateLimit(req, { name: 'feedback', limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  let body: { type?: string; message?: string; contact?: string; screenshot?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const type = typeof body.type === 'string' ? body.type.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const contact = typeof body.contact === 'string' ? body.contact.trim().slice(0, 200) : '';
  const screenshot =
    typeof body.screenshot === 'string' &&
    body.screenshot.startsWith('data:image/') &&
    body.screenshot.length <= MAX_SCREENSHOT_BYTES
      ? body.screenshot
      : null;

  if (!['bug', 'suggestion'].includes(type)) {
    return NextResponse.json({ error: 'invalid type' }, { status: 400 });
  }
  if (!message || message.length > 2000) {
    return NextResponse.json({ error: 'invalid message' }, { status: 400 });
  }

  const session = await auth();
  const userEmail = session?.user?.email ?? null;
  const userAgent = req.headers.get('user-agent') ?? null;

  // Save to DB
  if (sql) {
    await sql`
      INSERT INTO feedback (type, message, contact, user_email, user_agent, screenshot)
      VALUES (${type}, ${message}, ${contact || null}, ${userEmail}, ${userAgent}, ${screenshot})
    `;
  }

  // Send email via Resend
  if (resend) {
    const typeLabel = type === 'bug' ? '🐛 באג' : '💡 הצעה';
    const fromContact = contact || userEmail || 'אנונימי';
    // Subject is a mail header — strip line breaks to prevent header injection.
    const safeSubjectContact = fromContact.replace(/[\r\n]+/g, ' ');
    const screenshotHtml = screenshot
      ? `<div style="margin-top:16px"><img src="${screenshot}" alt="צילום מסך" style="max-width:100%;border-radius:8px;border:1px solid #e5e7eb"/></div>`
      : '';

    await resend.emails.send({
      from: 'Property Builder <noreply@hadarsap.online>',
      to: 'hadarsap@gmail.com',
      subject: `[Property Builder] ${typeLabel} מ-${safeSubjectContact}`,
      html: `
        <div dir="rtl" style="font-family:sans-serif;max-width:600px;padding:24px">
          <h2 style="margin:0 0 8px">${typeLabel}</h2>
          <p style="color:#666;margin:0 0 20px;font-size:14px">
            מאת: <strong>${escapeHtml(fromContact)}</strong>
            ${userEmail && contact && userEmail !== contact ? ` (חשבון: ${escapeHtml(userEmail)})` : ''}
          </p>
          <div style="background:#f9f9f9;border-radius:8px;padding:16px;white-space:pre-wrap;line-height:1.6;font-size:14px">
${escapeHtml(message)}
          </div>
          ${screenshotHtml}
          <p style="color:#aaa;font-size:12px;margin-top:24px">
            נשלח מ-property-landing-builder.vercel.app
          </p>
        </div>
      `,
    });
  }

  return NextResponse.json({ ok: true });
}
