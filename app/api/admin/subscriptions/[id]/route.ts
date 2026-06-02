import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { setManualOverride } from '@/lib/billing/access'
import { sql } from '@/lib/db'
import type { Subscription } from '@/lib/db/types'
import type { Session } from 'next-auth'

type RouteContext = { params: Promise<{ id: string }> }

function isAdmin(session: Session | null): boolean {
  return !!process.env.SUPER_ADMIN_EMAIL && session?.user?.email === process.env.SUPER_ADMIN_EMAIL
}

export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = (await req.json()) as {
    manual_override?: boolean
    status?: Subscription['status']
  }

  if (body.manual_override !== undefined) {
    const sub = await setManualOverride(id, body.manual_override)
    return NextResponse.json({ subscription: sub })
  }

  if (body.status) {
    const { rows } = await sql<Subscription>`
      UPDATE subscriptions
      SET status = ${body.status}, updated_at = now()
      WHERE agency_id = ${id}
      RETURNING *
    `
    return NextResponse.json({ subscription: rows[0] ?? null })
  }

  return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
}
