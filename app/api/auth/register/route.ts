import { NextRequest, NextResponse } from 'next/server'
import { getAgentByEmail, createAgentWithPassword } from '@/lib/db/queries/agents'
import { createAgency, generateUniqueAgencySlug } from '@/lib/db/queries/agencies'
import { upsertSubscription } from '@/lib/billing/access'
import { PLAN_TRIAL_DAYS } from '@/lib/billing/config'
import { sendAdminNotificationEmail } from '@/lib/email'

export async function POST(req: NextRequest): Promise<NextResponse> {
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
}
