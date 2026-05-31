import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAgency, generateUniqueAgencySlug } from '@/lib/db/queries/agencies'
import { getAgentByEmail, createAgentWithInvite } from '@/lib/db/queries/agents'
import { upsertSubscription } from '@/lib/billing/access'
import { PLAN_TRIAL_DAYS } from '@/lib/billing/config'
import { sendInviteEmail } from '@/lib/email'
import type { Session } from 'next-auth'

function isAdmin(session: Session | null): boolean {
  return session?.user?.email === process.env.SUPER_ADMIN_EMAIL
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as {
    agency_name?: string
    admin_name?: string
    admin_email?: string
  }

  if (!body.agency_name?.trim() || !body.admin_name?.trim() || !body.admin_email?.trim()) {
    return NextResponse.json({ error: 'agency_name, admin_name, and admin_email are required' }, { status: 422 })
  }

  const email = body.admin_email.toLowerCase().trim()

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

  await upsertSubscription({
    agencyId: agency.id,
    status: 'trialing',
    trialEndsAt: new Date(Date.now() + PLAN_TRIAL_DAYS * 86_400_000),
  })

  const agent = await createAgentWithInvite({
    agency_id: agency.id,
    name: body.admin_name.trim(),
    email,
    role: 'admin',
  })

  const origin = process.env.NEXTAUTH_URL ?? `https://${req.headers.get('host') ?? 'localhost:3000'}`
  const inviteUrl = `${origin}/auth/set-password?token=${agent.raw_token}`

  await sendInviteEmail({ to: email, agencyName: agency.name, inviteUrl })

  return NextResponse.json({ agency, inviteUrl }, { status: 201 })
}
