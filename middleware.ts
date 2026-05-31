import type { NextRequest } from 'next/server'
import { proxy } from './proxy'

export function middleware(req: NextRequest) {
  const res = proxy(req)
  // Inject current pathname so server layouts can detect the active route
  res.headers.set('x-pathname', req.nextUrl.pathname)
  return res
}

export { config } from './proxy'
