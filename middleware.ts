import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // ── /dashboard — requires any authenticated user ──────────────────────────
  if (pathname.startsWith('/dashboard') && !session) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('signin', '1');
    return NextResponse.redirect(url);
  }

  // ── /admin — requires admin flag in JWT ───────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const isAdmin = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin;
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
