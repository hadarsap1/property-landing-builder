import { NextRequest, NextResponse } from 'next/server'
import { getAgentByInviteToken } from '@/lib/db/queries/agents'

// GET: validate token and return agent info (for the set-password page)
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const agent = await getAgentByInviteToken(token)
  if (!agent) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })

  return NextResponse.json({ name: agent.name, email: agent.email })
}
