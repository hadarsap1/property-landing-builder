import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sql } from '@/lib/db'
import type { PendingChange, Listing } from '@/lib/db/types'
import { reviewChange } from '@/lib/db/queries/pending-changes'
import { getListingById } from '@/lib/db/queries/listings'
import type { Session } from 'next-auth'

type RouteContext = { params: Promise<{ id: string }> }

function ownsListing(listing: Listing, session: Session | null): boolean {
  const user = session?.user as { agencyId?: string; personalUserId?: string } | undefined
  if (user?.agencyId && listing.agency_id === user.agencyId) return true
  if (user?.personalUserId && listing.user_id === user.personalUserId) return true
  return false
}

export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()

  const { rows } = await sql<PendingChange>`
    SELECT * FROM pending_changes WHERE id = ${id} LIMIT 1
  `
  const existing = rows[0]
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const listing = await getListingById(existing.listing_id)
  if (!listing || !ownsListing(listing, session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await req.json()) as { status?: string; agent_note?: string }
  if (body.status !== 'approved' && body.status !== 'rejected') {
    return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 })
  }

  const change = await reviewChange(id, body.status, body.agent_note)
  return NextResponse.json({ change })
}
