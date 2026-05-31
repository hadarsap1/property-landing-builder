import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getLeadById, updateLeadStatus } from '@/lib/db/queries/leads'
import type { Lead } from '@/lib/db/types'

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

  const body = (await req.json()) as { status?: string }
  const validStatuses: Lead['status'][] = [
    'new', 'contacted', 'visited', 'serious', 'irrelevant', 'offer_made', 'closed',
  ]
  if (!body.status || !validStatuses.includes(body.status as Lead['status'])) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updated = await updateLeadStatus(id, body.status as Lead['status'])
  return NextResponse.json({ lead: updated })
}
