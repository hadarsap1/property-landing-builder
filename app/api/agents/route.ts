import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAgentsByAgency, createAgentWithInvite } from '@/lib/db/queries/agents'
import { getAgencyById } from '@/lib/db/queries/agencies'
import { sendInviteEmail } from '@/lib/email'
import { sql } from '@/lib/db'

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.agencyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const agents = await getAgentsByAgency(session.user.agencyId)

  // Count listings and leads per agent for the delete-warning UI
  const { rows: counts } = await sql<{ agent_id: string; listing_count: string; lead_count: string }>`
    SELECT
      a.id AS agent_id,
      COUNT(DISTINCT l.id)::text AS listing_count,
      COUNT(DISTINCT ld.id)::text AS lead_count
    FROM agents a
    LEFT JOIN listings  l  ON l.agent_id  = a.id AND l.status != 'sold'
    LEFT JOIN leads     ld ON ld.agent_id = a.id
    WHERE a.agency_id = ${session.user.agencyId}
    GROUP BY a.id
  `
  const countMap = Object.fromEntries(counts.map(r => [r.agent_id, {
    listing_count: parseInt(r.listing_count, 10),
    lead_count: parseInt(r.lead_count, 10),
  }]))

  const safe = agents.map(({ password_hash: _p, invitation_token: _t, ...a }) => ({
    ...a,
    listing_count: countMap[a.id]?.listing_count ?? 0,
    lead_count: countMap[a.id]?.lead_count ?? 0,
  }))
  return NextResponse.json({ agents: safe })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.agencyId || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await req.json()) as { name?: string; email?: string; role?: string; phone?: string; calendly_url?: string }
  if (!body.name || !body.email) {
    return NextResponse.json({ error: 'name and email are required' }, { status: 400 })
  }

  const agent = await createAgentWithInvite({
    agency_id: session.user.agencyId,
    name: body.name,
    email: body.email,
    role: body.role === 'admin' ? 'admin' : 'agent',
    phone: body.phone ?? null,
    calendly_url: body.calendly_url ?? null,
  })

  const agency = await getAgencyById(session.user.agencyId)
  const origin = (process.env.NEXTAUTH_URL ?? 'https://app.propbuilder.co.il').replace(/\/$/, '')
  const inviteUrl = `${origin}/auth/set-password?token=${agent.raw_token}`

  await sendInviteEmail({
    to: agent.email,
    agencyName: agency?.name ?? '',
    inviteUrl,
    inviterName: session.user.name ?? undefined,
  })

  const { password_hash: _p, invitation_token: _t, raw_token: _r, ...safe } = agent
  return NextResponse.json({ agent: safe, inviteUrl }, { status: 201 })
}
