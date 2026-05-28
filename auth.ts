import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import NeonAdapter from '@auth/neon-adapter';
import { Pool } from '@neondatabase/serverless';

// Admin emails allowed to access /admin — comma-separated env var
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

export function isAdmin(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email);
}

export const { handlers, signIn, signOut, auth } = NextAuth(() => {
  // NeonAdapter needs a direct SQL connection (not pooled).
  // If DATABASE_URL is absent we skip the adapter — auth still works
  // with JWT-only sessions but user data won't be persisted to PG.
  const adapter = process.env.DATABASE_URL
    ? NeonAdapter(new Pool({ connectionString: process.env.DATABASE_URL }))
    : undefined;

  return {
    adapter,
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ],
    session: {
      // JWT strategy works without an adapter and is edge-compatible.
      strategy: 'jwt',
    },
    callbacks: {
      jwt({ token, user }) {
        // Persist user id and admin flag into the JWT on first sign-in.
        if (user) {
          token.uid = user.id;
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
    pages: {
      // Keep sign-in inline (no redirect to a separate page).
      // We'll show a modal in the builder, so no custom signIn page needed.
    },
    trustHost: true,
  };
});
