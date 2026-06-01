import { handlers } from '@/auth'

// next-auth's reqWithEnvURL() rewrites every request's origin to match AUTH_URL.
// If AUTH_URL points to the wrong Vercel project domain this breaks OAuth callbacks.
// Clearing it forces next-auth to use the real incoming host instead.
// trustHost:true in auth.ts ensures that host is accepted.
process.env.AUTH_URL = ''

export const { GET, POST } = handlers
