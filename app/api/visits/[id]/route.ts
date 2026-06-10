import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { updateVisitStatus, deleteVisit } from '@/lib/db/queries/visits'
import { sql } from '@/lib/db'
import type { PropertyVisit } from '@/lib/db/types'

type RouteContext = { params: Promise<{ id: string }> }

async function getVisitForAgency(id: string, agencyId: string): Promise<PropertyVisit | null> {
  const { rows } = await sql<PropertyVisit>`
    SELECT * FROM property_visits WHERE id = ${id} AND agency_id = ${agencyId} LIMIT 1
  `
  return rows[0] ?? null
}

export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await auth()
  const agencyId = session?.user?.agencyId
  if (!agencyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await getVisitForAgency(id, agencyId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json() as { status?: PropertyVisit['status'] }
  const validStatuses = ['scheduled', 'completed', 'cancelled', 'no_show']
  if (!body.status || !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updated = await updateVisitStatus(id, body.status)
  return NextResponse.json({ visit: updated })
}

export async function DELETE(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await auth()
  const agencyId = session?.user?.agencyId
  if (!agencyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await getVisitForAgency(id, agencyId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await deleteVisit(id)
  return new NextResponse(null, { status: 204 })
}
