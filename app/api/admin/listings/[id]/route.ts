import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deleteListing, updateListing, getListingById } from '@/lib/db/queries/listings'
import type { Session } from 'next-auth'

function isAdmin(session: Session | null): boolean {
  return !!process.env.SUPER_ADMIN_EMAIL && session?.user?.email === process.env.SUPER_ADMIN_EMAIL
}

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = (await req.json()) as { status?: 'active' | 'paused' | 'sold' }
  if (!body.status || !['active', 'paused', 'sold'].includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const existing = await getListingById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await updateListing(id, { status: body.status })
  return NextResponse.json({ listing: updated })
}

export async function DELETE(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const existing = await getListingById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await deleteListing(id)
  return new NextResponse(null, { status: 204 })
}
