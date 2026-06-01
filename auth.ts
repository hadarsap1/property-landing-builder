import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import type { Agent } from '@/lib/db/types'
import { upsertPersonalUser, getPersonalUserById } from '@/lib/db/queries/personal-users'
import { getAgentByEmail } from '@/lib/db/queries/agents'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),

    // Email/password for commercial agents
    Credentials({
      id: 'agent-credentials',
      name: 'Agent Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const { rows } = await sql<Agent>`
          SELECT * FROM agents WHERE email = ${credentials.email as string} LIMIT 1
        `
        const agent = rows[0]
        if (!agent?.password_hash) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          agent.password_hash
        )
        if (!valid) return null

        return {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          agencyId: agent.agency_id,
          role: agent.role,
          userType: 'commercial' as const,
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        // Check if this Google account belongs to an existing agent (broker)
        const agent = await getAgentByEmail(user.email).catch(() => null)
        if (agent) {
          const u = user as unknown as Record<string, unknown>
          u.userType = 'commercial'
          u.agencyId = agent.agency_id
          u.role = agent.role
          return true
        }

        // Otherwise upsert as personal user
        const pu = await upsertPersonalUser({
          email: user.email,
          name: user.name ?? null,
          photo_url: user.image ?? null,
        })
        const u = user as unknown as Record<string, unknown>
        u.personalUserId = pu.id
        u.plan = pu.plan
        u.agencyId = pu.agency_id ?? undefined
        u.userType = 'personal'
      }
      return true
    },

    async jwt({ token, user, account, trigger, session: updateData }) {
      // Allow client-side session update (e.g. after broker setup)
      if (trigger === 'update' && updateData) {
        const d = updateData as Record<string, unknown>
        if (d.userType) token.userType = d.userType as string
        if (d.agencyId) token.agencyId = d.agencyId as string
        if (d.role) token.role = d.role as string
        return token
      }

      if (user) {
        if (account?.provider === 'google') {
          const u = user as unknown as Record<string, unknown>
          if (u.userType === 'commercial') {
            // Existing agent logging in via Google
            token.userType = 'commercial'
            token.agencyId = u.agencyId as string | undefined
            token.role = u.role as string | undefined
          } else {
            // Personal user via Google
            token.userType = 'personal'
            token.personalUserId = u.personalUserId as string
            if ((u.plan as string) === 'commercial') {
              token.userType = 'commercial'
              token.agencyId = u.agencyId as string | undefined
            }
          }
        } else {
          // Credentials provider — commercial agent
          token.userType = 'commercial'
          token.agencyId = (user as Record<string, unknown>).agencyId as string | undefined
          token.role = (user as Record<string, unknown>).role as string | undefined
        }
      }

      // Refresh personal user data on each token refresh to pick up upgrades
      if (token.userType === 'personal' && token.personalUserId && !token.agencyId) {
        const pu = await getPersonalUserById(token.personalUserId as string)
        if (pu?.plan === 'commercial' && pu.agency_id) {
          token.userType = 'commercial'
          token.agencyId = pu.agency_id
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        const u = session.user as unknown as Record<string, unknown>
        u.userType = token.userType
        u.personalUserId = token.personalUserId
        u.agencyId = token.agencyId
        u.role = token.role
      }
      return session
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  session: { strategy: 'jwt' },
})
