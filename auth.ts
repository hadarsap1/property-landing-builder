import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { sql } from '@/lib/db';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

export function isAdmin(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            checks: ['state'],
          }),
        ]
      : []),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        // Upsert user into our DB on first sign-in and store our UUID.
        if (sql) {
          const rows = await sql`
            INSERT INTO users (email, name, avatar_url)
            VALUES (${user.email}, ${user.name ?? null}, ${user.image ?? null})
            ON CONFLICT (email) DO UPDATE
              SET name        = EXCLUDED.name,
                  avatar_url  = EXCLUDED.avatar_url
            RETURNING id
          `;
          if (rows[0]) token.uid = rows[0].id as string;
        } else {
          token.uid = user.id ?? user.email;
        }
        token.isAdmin = isAdmin(user.email);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        (session.user as typeof session.user & { isAdmin: boolean }).isAdmin =
          token.isAdmin as boolean;
      }
      return session;
    },
  },
  trustHost: true,
});
