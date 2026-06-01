import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAgency, generateUniqueAgencySlug } from '@/lib/db/queries/agencies'
import { createAgentWithPassword, getAgentByEmail } from '@/lib/db/queries/agents'
import { upsertSubscription } from '@/lib/billing/access'
import { PLAN_TRIAL_DAYS } from '@/lib/billing/config'
import crypto from 'crypto'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'יש להתחבר תחילה' }, { status: 401 })
    }

    const { agencyName } = (await req.json()) as { agencyName?: string }
    if (!agencyName?.trim()) {
      return NextResponse.json({ error: 'יש להזין שם סוכנות' }, { status: 422 })
    }

    const email = session.user.email.toLowerCase()

    // Prevent duplicate setup
    const existing = await getAgentByEmail(email)
    if (existing) {
      return NextResponse.json({ agencyId: existing.agency_id, ok: true }, { status: 200 })
    }

    const slug = await generateUniqueAgencySlug(agencyName)
    const agency = await createAgency({
      slug,
      name: agencyName.trim(),
      contact_email: email,
    })

    // Create agent without a password — they always authenticate via Google
    await createAgentWithPassword({
      agency_id: agency.id,
      name: session.user.name?.trim() || agencyName.trim(),
      email,
      password: crypto.randomUUID(), // random, never used (Google-only account)
      role: 'admin',
    })

    await upsertSubscription({
      agencyId: agency.id,
      status: 'trialing',
      trialEndsAt: new Date(Date.now() + PLAN_TRIAL_DAYS * 86_400_000),
    })

    return NextResponse.json({ agencyId: agency.id, role: 'admin', ok: true }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[broker-setup]', message)
    if (message.includes('relation') && message.includes('does not exist')) {
      return NextResponse.json({ error: 'טבלאות חסרות — יש להריץ schema.sql' }, { status: 500 })
    }
    return NextResponse.json({ error: `שגיאה: ${message}` }, { status: 500 })
  }
}
