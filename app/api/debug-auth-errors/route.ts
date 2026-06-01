import { NextResponse } from 'next/server'
import { getAuthErrors } from '@/lib/auth-error-log'

export async function GET() {
  return NextResponse.json({ errors: getAuthErrors() })
}
