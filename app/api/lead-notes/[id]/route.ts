import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sql } from '@/lib/db'
import type { LeadNote, Lead } from '@/lib/db/types'
import { markFollowUpDone } from '@/lib/db/queries/leads'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify agency ownership via lead
  const { rows } = await sql<LeadNote & { agency_id: string }>`
    SELECT ln.*, l.agency_id
    FROM lead_notes ln
    JOIN leads l ON l.id = ln.lead_id
    WHERE ln.id = ${id}
    LIMIT 1
  `
  const note = rows[0]
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (note.agency_id !== session.user.agencyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await req.json()) as { follow_up_done?: boolean }
  if (body.follow_up_done === true) {
    const updated = await markFollowUpDone(id)
    return NextResponse.json({ note: updated })
  }

  return NextResponse.json({ error: 'No valid update' }, { status: 400 })
}
