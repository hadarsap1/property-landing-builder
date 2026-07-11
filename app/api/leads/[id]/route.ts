import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getLeadById, updateLeadStatus, updateLeadAssignee } from '@/lib/db/queries/leads'
import { getAgentById } from '@/lib/db/queries/agents'
import { sendLeadAssignedEmail } from '@/lib/email'
import { ensureSchema } from '@/lib/db/ensure-schema'
import type { Lead } from '@/lib/db/types'

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? 'property-landing-builder.vercel.app'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const lead = await getLeadById(id)
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (lead.agency_id !== session.user.agencyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ lead })
}

export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const lead = await getLeadById(id)
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (lead.agency_id !== session.user.agencyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await req.json()) as { status?: string; assigned_agent_id?: string | null }

  // Assignment: agent must belong to the same agency (or null to unassign)
  if ('assigned_agent_id' in body) {
    // Self-migrating: guarantees leads.assigned_agent_id exists even if no
    // ensureSchema-calling page was visited since the deploy
    await ensureSchema()
    const agentId = body.assigned_agent_id ?? null
    if (agentId !== null) {
      const agent = await getAgentById(agentId)
      if (!agent || agent.agency_id !== session.user.agencyId) {
        return NextResponse.json({ error: 'Invalid agent' }, { status: 422 })
      }
      // Notify the assignee unless they assigned it to themselves
      if (agent.id !== session.user.id) {
        void sendLeadAssignedEmail({
          to: agent.email,
          leadName: lead.name,
          leadPhone: lead.phone,
          listingTitle: lead.listing_title ?? 'נכס',
          leadUrl: `https://${ROOT_DOMAIN}/dashboard/leads/${lead.id}`,
        }).catch((err) => console.error('[leads] assignment notification failed', err))
      }
    }
    const updated = await updateLeadAssignee(id, agentId)
    if (!body.status) return NextResponse.json({ lead: updated })
  }

  if (body.status !== undefined) {
    const validStatuses: Lead['status'][] = [
      'new', 'contacted', 'visited', 'serious', 'irrelevant', 'offer_made', 'closed',
    ]
    if (!body.status || !validStatuses.includes(body.status as Lead['status'])) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    const updated = await updateLeadStatus(id, body.status as Lead['status'])
    return NextResponse.json({ lead: updated })
  }

  return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
}
