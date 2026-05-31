import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAllSubscriptions } from '@/lib/billing/access'

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (session?.user?.email !== process.env.SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const subscriptions = await getAllSubscriptions()
  return NextResponse.json({ subscriptions })
}
