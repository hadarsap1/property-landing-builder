import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getLeadById, addLeadNote, getLeadNotes } from '@/lib/db/queries/leads'

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

  const notes = await getLeadNotes(id)
  return NextResponse.json({ notes })
}

export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.agencyId || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const lead = await getLeadById(id)
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (lead.agency_id !== session.user.agencyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await req.json()) as { note?: string; follow_up_at?: string }
  if (!body.note?.trim()) {
    return NextResponse.json({ error: 'note is required' }, { status: 400 })
  }

  const note = await addLeadNote({
    lead_id: id,
    agent_id: session.user.id,
    note: body.note.trim(),
    follow_up_at: body.follow_up_at ? new Date(body.follow_up_at) : null,
  })

  return NextResponse.json({ note }, { status: 201 })
}
