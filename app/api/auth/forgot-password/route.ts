import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { ensureSchema } from '@/lib/db/ensure-schema'
import type { Agent } from '@/lib/db/types'
import crypto from 'crypto'

async function isRateLimited(ip: string): Promise<boolean> {
  if (!process.env.KV_URL) {
    console.warn('[forgot-password] KV_URL not configured — password-reset rate limiting is disabled')
    return false
  }
  try {
    const { kv } = await import('@vercel/kv')
    const key = `pwd_reset_rl:${ip}`
    const count = await kv.incr(key)
    if (count === 1) await kv.expire(key, 3600)
    return count > 5 // 5 reset requests per IP per hour
  } catch {
    return false
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (await isRateLimited(ip)) {
    // Always return 200 to not reveal email existence
    return NextResponse.json({ ok: true })
  }

  const body = (await req.json()) as { email?: string }
  const email = body.email?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ ok: true }) // silent — don't reveal email existence
  }

  await ensureSchema().catch(() => {})

  const { rows } = await sql<Agent>`
    SELECT id FROM agents WHERE email = ${email} LIMIT 1
  `
  const agent = rows[0]

  if (agent) {
    // Invalidate any existing unused tokens for this agent
    await sql`
      UPDATE password_reset_tokens SET used = true WHERE agent_id = ${agent.id} AND used = false
    `

    const token = crypto.randomBytes(32).toString('hex')
    await sql`
      INSERT INTO password_reset_tokens (agent_id, token)
      VALUES (${agent.id}, ${token})
    `

    const origin = (process.env.NEXTAUTH_URL ?? 'https://app.propbuilder.co.il').replace(/\/$/, '')
    const resetUrl = `${origin}/auth/reset-password?token=${token}`

    await sendPasswordResetEmail({ to: email, resetUrl }).catch(err => {
      console.error('[forgot-password] email send failed:', err)
    })
  }

  // Always return 200 to prevent email enumeration
  return NextResponse.json({ ok: true })
}
