import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      agencyId?: string
      role?: 'admin' | 'agent'
      userType?: 'personal' | 'commercial'
      personalUserId?: string
    } & DefaultSession['user']
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    agencyId?: string
    role?: string
    userType?: string
    personalUserId?: string
  }
}
