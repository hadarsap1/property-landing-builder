import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  return NextResponse.json({
    signedIn: !!session,
    user: session?.user ?? null,
    expires: session?.expires ?? null,
  })
}
