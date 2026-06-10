import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getLeadById } from '@/lib/db/queries/leads'
import { getVisitsByLead } from '@/lib/db/queries/visits'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await auth()
  const agencyId = session?.user?.agencyId
  if (!agencyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const lead = await getLeadById(id)
  if (!lead || lead.agency_id !== agencyId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const visits = await getVisitsByLead(id)
  return NextResponse.json({ visits })
}
