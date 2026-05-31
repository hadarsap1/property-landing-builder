import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getAllDiscountCodes,
  createDiscountCode,
  toggleDiscountCode,
  deleteDiscountCode,
} from '@/lib/billing/discount-codes'
import type { Session } from 'next-auth'

function isAdmin(session: Session | null): boolean {
  return session?.user?.email === process.env.SUPER_ADMIN_EMAIL
}

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const codes = await getAllDiscountCodes()
  return NextResponse.json({ codes })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as {
    code?: string
    discount_pct?: number
    max_uses?: number | null
    expires_at?: string | null
  }

  if (!body.code?.trim() || !body.discount_pct) {
    return NextResponse.json({ error: 'code and discount_pct are required' }, { status: 422 })
  }

  const code = await createDiscountCode({
    code: body.code.trim(),
    discount_pct: body.discount_pct,
    max_uses: body.max_uses ?? null,
    expires_at: body.expires_at ? new Date(body.expires_at) : null,
  })

  return NextResponse.json({ code }, { status: 201 })
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as { id?: string; active?: boolean }
  if (!body.id || body.active === undefined) {
    return NextResponse.json({ error: 'id and active required' }, { status: 422 })
  }

  await toggleDiscountCode(body.id, body.active)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = (await req.json()) as { id?: string }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 422 })

  await deleteDiscountCode(id)
  return NextResponse.json({ ok: true })
}
