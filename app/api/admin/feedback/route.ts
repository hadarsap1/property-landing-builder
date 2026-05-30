import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { sql } from '@/lib/db';
import { auth, isAdmin } from '@/auth';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/** Escape HTML so stored user content can't inject markup into the reply email. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await req.json() as {
    id?: number;
    action?: 'resolve' | 'reopen' | 'reply';
    reply?: string;
  };

  const { id, action } = body;
  if (!id || !action) return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  if (!sql) return NextResponse.json({ error: 'no db' }, { status: 500 });

  if (action === 'resolve') {
    await sql`UPDATE feedback SET status = 'done', resolved_at = now() WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  }

  if (action === 'reopen') {
    await sql`UPDATE feedback SET status = 'open', resolved_at = NULL WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  }

  if (action === 'reply') {
    const replyText = typeof body.reply === 'string' ? body.reply.trim() : '';
    if (!replyText) return NextResponse.json({ error: 'empty reply' }, { status: 400 });

    if (!resend) {
      return NextResponse.json(
        { error: 'email_not_configured', message: 'RESEND_API_KEY is not set in environment variables' },
        { status: 503 }
      );
    }

    const rows = await sql`SELECT * FROM feedback WHERE id = ${id}`;
    const item = rows[0];
    if (!item) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const rawTo = item.contact?.includes('@') ? item.contact : item.user_email?.includes('@') ? item.user_email : null;
    const to = rawTo ? rawTo.toLowerCase() : null;
    if (!to) return NextResponse.json({ error: 'no valid email to reply to' }, { status: 400 });

    const typeLabel = item.type === 'bug' ? 'דיווח על באג' : 'הצעה';

    const { error: sendError } = await resend.emails.send({
      from: 'Property Builder <noreply@hadarsap.online>',
      to,
      subject: `Re: ${typeLabel} ב-Property Builder`,
      html: `
        <div dir="rtl" style="font-family:sans-serif;max-width:560px;padding:24px">
          <p style="line-height:1.7;font-size:15px;color:#1a1a1a">${escapeHtml(replyText).replace(/\n/g, '<br/>')}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="font-size:12px;color:#9ca3af">בהמשך ל${typeLabel} שנשלח ל-property-landing-builder.vercel.app</p>
          <blockquote style="border-right:3px solid #e5e7eb;padding-right:12px;color:#6b7280;font-size:13px;margin:8px 0 0">
            ${escapeHtml(item.message as string).replace(/\n/g, '<br/>')}
          </blockquote>
        </div>
      `,
    });

    if (sendError) {
      console.error('[feedback reply] Resend error:', sendError);
      return NextResponse.json(
        { error: 'send_failed', message: sendError.message },
        { status: 502 }
      );
    }

    await sql`
      UPDATE feedback
      SET admin_reply = ${replyText},
          replied_at  = now(),
          status      = 'done',
          resolved_at = now()
      WHERE id = ${id}
    `;

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
