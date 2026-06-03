import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'

interface ResetTokenRow {
  id: string
  agent_id: string
  used: boolean
  expires_at: Date
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as { token?: string; password?: string }
  const { token, password } = body

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'הסיסמה חייבת להכיל לפחות 8 תווים' }, { status: 400 })
  }

  // Atomically mark the token used in one UPDATE — this prevents both the race
  // condition (two concurrent requests both seeing used=false) and the gap between
  // password update and token invalidation (no transaction needed).
  const { rows } = await sql<{ agent_id: string }>`
    UPDATE password_reset_tokens
    SET used = true
    WHERE token = ${token}
      AND used = false
      AND expires_at > now()
    RETURNING agent_id
  `
  const agentId = rows[0]?.agent_id

  if (!agentId) {
    return NextResponse.json({ error: 'הקישור אינו תקף או שפג תוקפו' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 12)

  await sql`UPDATE agents SET password_hash = ${hash} WHERE id = ${agentId}`

  return NextResponse.json({ ok: true })
}
