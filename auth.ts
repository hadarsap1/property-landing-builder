import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { sql } from '@/lib/db'
import { after } from 'next/server'
import bcrypt from 'bcryptjs'
import type { Agent } from '@/lib/db/types'
import {
  upsertPersonalUser,
  getPersonalUserById,
  getPersonalUserByEmail,
} from '@/lib/db/queries/personal-users'
import { getAgentByEmail } from '@/lib/db/queries/agents'
import { ensureSchema } from '@/lib/db/ensure-schema'

function logAuthEvent(stage: string, payload: unknown) {
  const data = JSON.stringify({ stage, payload, ts: new Date().toISOString() })
  const write = async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS auth_debug_log (
        id SERIAL PRIMARY KEY, ts TIMESTAMPTZ DEFAULT NOW(), data TEXT
      )
    `.catch(() => {})
    await sql`INSERT INTO auth_debug_log (data) VALUES (${data})`.catch(() => {})
  }
  try { after(write) } catch { write().catch(() => {}) }
}

function serializeError(e: unknown): unknown {
  if (e instanceof Error) {
    const ex = e as Error & { code?: string; cause?: unknown }
    return {
      name: ex.name,
      message: ex.message,
      code: ex.code,
      stack: ex.stack?.split('\n').slice(0, 6).join('\n'),
      cause: serializeError(ex.cause),
    }
  }
  return e
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      id: 'agent-credentials',
      name: 'Agent Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null
          const { rows } = await sql<Agent>`
            SELECT * FROM agents WHERE email = ${credentials.email as string} LIMIT 1
          `
          const agent = rows[0]
          if (!agent?.password_hash) return null
          const valid = await bcrypt.compare(credentials.password as string, agent.password_hash)
          if (!valid) return null
          return {
            id: agent.id,
            name: agent.name,
            email: agent.email,
            agencyId: agent.agency_id,
            role: agent.role,
            userType: 'commercial' as const,
          }
        } catch (err) {
          logAuthEvent('credentials:authorize:error', serializeError(err))
          return null
        }
      },
    }),
  ],

  callbacks: {
    async signIn() {
      // Always allow — we resolve user type in jwt() so failures don't block sign-in.
      return true
    },

    async jwt({ token, user, account, trigger, session: updateData }) {
      try {
      // Client-side session.update() — re-fetch from DB; never trust client-supplied agencyId/role
      if (trigger === 'update' && updateData) {
        if (token.userType === 'personal' && token.personalUserId) {
          const pu = await getPersonalUserById(token.personalUserId as string).catch(() => null)
          if (pu?.plan === 'commercial' && pu.agency_id) {
            token.userType = 'commercial'
            token.agencyId = pu.agency_id
            if (typeof token.email === 'string') {
              const agent = await getAgentByEmail(token.email).catch(() => null)
              if (agent) token.role = agent.role
            }
          }
        } else if (token.userType === 'commercial' && typeof token.email === 'string') {
          const agent = await getAgentByEmail(token.email).catch(() => null)
          if (agent) {
            token.role = agent.role
            token.agencyId = agent.agency_id
          } else {
            // Agent deleted from DB — strip commercial privileges so next route redirects to login
            token.agencyId = undefined
            token.role = undefined
          }
        }
        return token
      }

      // First call after sign-in: resolve user type from email
      if (user && account) {
        if (account.provider === 'agent-credentials') {
          const u = user as unknown as Record<string, unknown>
          token.id       = user.id
          token.userType = 'commercial'
          token.agencyId = u.agencyId as string | undefined
          token.role     = u.role as string | undefined
          return token
        }

        if (account.provider === 'google' && user.email) {
          await ensureSchema().catch(err => logAuthEvent('jwt:ensureSchema:error', serializeError(err)))

          const agent = await getAgentByEmail(user.email).catch(err => {
            logAuthEvent('jwt:getAgentByEmail:error', { email: user.email, err: serializeError(err) })
            return null
          })

          if (agent) {
            token.id       = agent.id
            token.userType = 'commercial'
            token.agencyId = agent.agency_id
            token.role     = agent.role
            return token
          }

          let personalUserId: string | undefined
          try {
            const pu = await upsertPersonalUser({
              email: user.email,
              name: user.name ?? null,
              photo_url: user.image ?? null,
            })
            personalUserId = pu.id
          } catch (err) {
            logAuthEvent('jwt:upsertPersonalUser:error', { email: user.email, err: serializeError(err) })
            // Fallback: maybe the row exists already but the upsert hit a constraint we don't expect
            const existing = await getPersonalUserByEmail(user.email).catch(() => null)
            if (existing) personalUserId = existing.id
          }

          token.id             = personalUserId
          token.userType       = 'personal'
          token.personalUserId = personalUserId

          if (!personalUserId) {
            logAuthEvent('jwt:no personalUserId after upsert', { email: user.email })
          }
          return token
        }
      }

      // Subsequent calls: refresh personal user plan in case of upgrade
      if (token.userType === 'personal' && token.personalUserId && !token.agencyId) {
        const pu = await getPersonalUserById(token.personalUserId as string).catch(() => null)
        if (pu?.plan === 'commercial' && pu.agency_id) {
          token.userType = 'commercial'
          token.agencyId = pu.agency_id
        }
      }
      return token
      } catch (err) {
        logAuthEvent('jwt:unhandled', serializeError(err))
        return token
      }
    },

    async session({ session, token }) {
      if (!session.user) return session

      const u = session.user as unknown as Record<string, unknown>
      u.id             = token.id
      u.userType       = token.userType
      u.personalUserId = token.personalUserId
      u.agencyId       = token.agencyId
      u.role           = token.role

      // Safety net: if jwt() never populated the token (or populated userType but not
      // personalUserId for personal users), resolve from email so the session is always usable.
      if ((!u.userType || (u.userType === 'personal' && !u.personalUserId)) && session.user.email) {
        try {
          const agent = await getAgentByEmail(session.user.email)
          if (agent) {
            u.userType = 'commercial'
            u.agencyId = agent.agency_id
            u.role     = agent.role
            token.userType = 'commercial'
            token.agencyId = agent.agency_id
            token.role     = agent.role
            return session
          }
          let pu = await getPersonalUserByEmail(session.user.email)
          if (!pu) {
            pu = await upsertPersonalUser({
              email: session.user.email,
              name: session.user.name ?? null,
              photo_url: session.user.image ?? null,
            }).catch((err: unknown) => {
              logAuthEvent('session:upsertPersonalUser:error', serializeError(err))
              return null
            })
          }
          if (pu) {
            u.userType       = 'personal'
            u.personalUserId = pu.id
            token.userType       = 'personal'
            token.personalUserId = pu.id
          }
        } catch (err) {
          logAuthEvent('session:resolveByEmail:error', serializeError(err))
        }
      }

      return session
    },

    async redirect({ url, baseUrl }) {
      // Allow same-origin redirects; reject protocol-relative (//evil.com) and external URLs.
      try {
        if (url.startsWith('/') && !url.startsWith('//')) return `${baseUrl}${url}`
        const u = new URL(url)
        if (u.origin === new URL(baseUrl).origin) return url
      } catch {}
      return baseUrl
    },
  },

  pages: {
    signIn: '/auth/login',
    error:  '/auth/error',
  },

  session: { strategy: 'jwt' },
})
