import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sendAdminNotificationEmail } from '@/lib/email'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as {
    message?: string
    name?: string
    email?: string
    source?: string
    _hp?: string
  }

  // Honeypot
  if (body._hp) return NextResponse.json({ ok: true })

  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'message required' }, { status: 400 })
  }

  const session = await auth()
  const userEmail = session?.user?.email ?? body.email ?? null
  const userName  = session?.user?.name  ?? body.name  ?? null
  const userType  = session?.user?.userType
    ?? (session?.user?.agencyId ? 'commercial' : session?.user?.personalUserId ? 'personal' : null)

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  const subject = `[פנייה] ${body.source ?? 'תמיכה'} — ${userName ?? userEmail ?? 'אנונימי'}`
  const text = [
    `נשלח מ: ${body.source ?? '—'}`,
    `שם: ${userName ?? '—'}`,
    `מייל: ${userEmail ?? '—'}`,
    `סוג חשבון: ${userType ?? 'לא מחובר'}`,
    `IP: ${ip}`,
    '',
    'הודעה:',
    body.message.trim(),
  ].join('\n')

  await sendAdminNotificationEmail({ subject, body: text })

  return NextResponse.json({ ok: true })
}
