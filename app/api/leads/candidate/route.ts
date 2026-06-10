import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createLead } from '@/lib/db/queries/leads'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as {
    name?: string
    phone?: string
    email?: string
    budget?: number
    rooms_min?: number
    rooms_max?: number
    desired_areas?: string
  }

  if (!body.name && !body.phone && !body.email) {
    return NextResponse.json(
      { error: 'לפחות שדה אחד נדרש: שם, טלפון או מייל' },
      { status: 400 }
    )
  }

  const lead = await createLead({
    listing_id: null,
    agency_id: session.user.agencyId,
    name: body.name ?? null,
    phone: body.phone ?? null,
    email: body.email ?? null,
    source: 'direct',
    budget: body.budget ?? null,
    rooms_min: body.rooms_min ?? null,
    rooms_max: body.rooms_max ?? null,
    desired_areas: body.desired_areas ?? null,
  })

  return NextResponse.json({ lead }, { status: 201 })
}
