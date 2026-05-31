import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Nodemailer from 'next-auth/providers/nodemailer'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import type { Agent } from '@/lib/db/types'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Email/password for agents
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
        }
      },
    }),

    // Magic link for sellers (no password required)
    Nodemailer({
      id: 'seller-magic-link',
      name: 'Seller Magic Link',
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.agencyId = (user as { agencyId?: string }).agencyId
        token.role = (user as { role?: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { agencyId?: string; role?: string }).agencyId =
          token.agencyId as string | undefined
        ;(session.user as { agencyId?: string; role?: string }).role =
          token.role as string | undefined
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
