import { NextRequest, NextResponse } from 'next/server'
import { getAgentByEmail, createAgentWithPassword } from '@/lib/db/queries/agents'
import { createAgency, generateUniqueAgencySlug } from '@/lib/db/queries/agencies'
import { upsertSubscription } from '@/lib/billing/access'
import { PLAN_TRIAL_DAYS } from '@/lib/billing/config'
import { sendAdminNotificationEmail } from '@/lib/email'
import { kvRateLimitSoft, memRateLimit } from '@/lib/rate-limit'

async function isRegisterRateLimited(ip: string): Promise<boolean> {
  // In-memory guard runs regardless of KV (per server instance)
  if (memRateLimit(`reg:${ip}`, 5, 3_600_000)) return true
  return kvRateLimitSoft(`rl:register:${ip}`, 5, 3600)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (await isRegisterRateLimited(ip)) {
    return NextResponse.json({ error: 'יותר מדי ניסיונות — נסה שוב מאוחר יותר' }, { status: 429 })
  }

  try {
    const body = (await req.json()) as {
      name?: string
      agency_name?: string
      email?: string
      password?: string
    }

    if (!body.name?.trim() || !body.agency_name?.trim() || !body.email?.trim() || !body.password) {
      return NextResponse.json({ error: 'כל השדות נדרשים' }, { status: 422 })
    }

    if (body.password.length < 8) {
      return NextResponse.json({ error: 'הסיסמה חייבת להכיל לפחות 8 תווים' }, { status: 422 })
    }

    const email = body.email.toLowerCase().trim()

    const existing = await getAgentByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'כתובת מייל זו כבר רשומה במערכת' }, { status: 409 })
    }

    const slug = await generateUniqueAgencySlug(body.agency_name)
    const agency = await createAgency({
      slug,
      name: body.agency_name.trim(),
      contact_email: email,
    })

    await createAgentWithPassword({
      agency_id: agency.id,
      name: body.name.trim(),
      email,
      password: body.password,
      role: 'admin',
    })

    await upsertSubscription({
      agencyId: agency.id,
      status: 'trialing',
      trialEndsAt: new Date(Date.now() + PLAN_TRIAL_DAYS * 86_400_000),
    })

    void sendAdminNotificationEmail({
      subject: `סוכנות חדשה נרשמה: ${body.agency_name.trim()}`,
      body: `שם: ${body.name.trim()}\nסוכנות: ${body.agency_name.trim()}\nמייל: ${email}\nSlug: /${slug}`,
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[register]', message)

    // Return a human-readable Hebrew error based on the DB error type
    if (message.includes('missing_connection_string') || message.includes('POSTGRES_URL')) {
      return NextResponse.json({ error: 'מסד הנתונים אינו מוגדר — יש להגדיר POSTGRES_URL ב-Vercel' }, { status: 500 })
    }
    if (message.includes('relation') && message.includes('does not exist')) {
      return NextResponse.json({ error: 'טבלאות מסד הנתונים חסרות — יש להריץ את schema.sql' }, { status: 500 })
    }
    if (message.includes('unique') || message.includes('duplicate')) {
      return NextResponse.json({ error: 'כתובת המייל כבר קיימת במערכת' }, { status: 409 })
    }

    return NextResponse.json({ error: `שגיאה פנימית: ${message}` }, { status: 500 })
  }
}
