import { NextRequest } from 'next/server'
import { proxy } from './proxy'

export default function middleware(request: NextRequest) {
  return proxy(request)
}

export { config } from './proxy'
