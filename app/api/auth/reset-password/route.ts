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

  const { rows } = await sql<ResetTokenRow>`
    SELECT id, agent_id, used, expires_at
    FROM password_reset_tokens
    WHERE token = ${token}
    LIMIT 1
  `
  const row = rows[0]

  if (!row || row.used || new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ error: 'הקישור אינו תקף או שפג תוקפו' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 12)

  await sql`UPDATE agents SET password_hash = ${hash} WHERE id = ${row.agent_id}`
  await sql`UPDATE password_reset_tokens SET used = true WHERE id = ${row.id}`

  return NextResponse.json({ ok: true })
}
