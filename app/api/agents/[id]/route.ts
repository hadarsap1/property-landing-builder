import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAgentById, updateAgent, deleteAgent } from '@/lib/db/queries/agents'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.agencyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const target = await getAgentById(id)
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target.agency_id !== session.user.agencyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Agents can edit their own profile; only admins can change roles
  const isSelf = session.user.id === id
  const isAdmin = session.user.role === 'admin'
  if (!isSelf && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as Record<string, string>
  const updated = await updateAgent(id, {
    name: body.name,
    phone: body.phone ?? undefined,
    photo_url: body.photo_url ?? undefined,
    calendly_url: body.calendly_url ?? undefined,
    // Only admins can change role, and cannot demote themselves
    ...(isAdmin && !isSelf && body.role ? { role: body.role as 'admin' | 'agent' } : {}),
  })
  const { password_hash: _p, invitation_token: _t, ...safe } = updated ?? target
  return NextResponse.json({ agent: safe })
}

export async function DELETE(_req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.agencyId || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (session.user.id === id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }
  const target = await getAgentById(id)
  if (!target || target.agency_id !== session.user.agencyId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await deleteAgent(id)
  return new NextResponse(null, { status: 204 })
}
