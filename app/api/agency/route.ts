import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAgencyById, updateAgency } from '@/lib/db/queries/agencies'

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.agencyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const agency = await getAgencyById(session.user.agencyId)
  if (!agency) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ agency })
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.agencyId || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = (await req.json()) as Record<string, unknown>
  const allowed = ['name', 'logo_url', 'primary_color', 'secondary_color', 'contact_email', 'contact_phone'] as const
  const data = Object.fromEntries(
    allowed.filter((k) => k in body).map((k) => [k, body[k]])
  ) as Parameters<typeof updateAgency>[1]

  const agency = await updateAgency(session.user.agencyId, data)
  return NextResponse.json({ agency })
}
