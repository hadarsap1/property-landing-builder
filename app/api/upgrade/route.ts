import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAgency } from '@/lib/db/queries/agencies'
import { upgradePersonalUser } from '@/lib/db/queries/personal-users'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.personalUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.userType === 'commercial') {
    return NextResponse.json({ error: 'Already commercial' }, { status: 400 })
  }

  let body: { agencyName?: string; agencySlug?: string } = {}
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const name = body.agencyName?.trim()
  const slug = body.agencySlug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
  if (!name || !slug) {
    return NextResponse.json({ error: 'agencyName and agencySlug are required' }, { status: 422 })
  }

  const agency = await createAgency({ slug, name })
  await upgradePersonalUser(session.user.personalUserId, agency.id)

  return NextResponse.json({ ok: true, agencyId: agency.id })
}
