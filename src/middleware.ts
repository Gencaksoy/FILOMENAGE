import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth-client';
import { parseSessionCookie } from '@/lib/auth-session';

interface SessionData {
  id: string;
  role: string;
  email: string;
  features?: Record<string, boolean>;
}

async function parseSession(cookieValue?: string): Promise<SessionData | null> {
  if (!cookieValue) return null;

  const user = await parseSessionCookie(cookieValue);
  if (!user?.id) return null;

  return {
    id: user.id,
    role: user.role,
    email: user.email,
    features: user.features,
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
  const user = await parseSession(sessionCookie);

  // Protected paths that require authentication
  const isProtectedPath =
    pathname.startsWith('/vehicles') ||
    pathname.startsWith('/customers') ||
    pathname.startsWith('/maintenances') ||
    pathname.startsWith('/inspection') ||
    pathname.startsWith('/parking-tickets') ||
    pathname.startsWith('/audit-logs') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/super-admin') ||
    pathname.startsWith('/notifications');

  if (isProtectedPath && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    const isSuper = user.role === 'SUPER_ADMIN';

    // Super Admin route protection
    if (pathname.startsWith('/super-admin') && !isSuper) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Staff cannot access admin-only pages
    if (user.role === 'STAFF') {
      if (
        pathname.startsWith('/users') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/audit-logs')
      ) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/vehicles/:path*',
    '/customers/:path*',
    '/maintenances/:path*',
    '/inspection/:path*',
    '/parking-tickets/:path*',
    '/audit-logs/:path*',
    '/users/:path*',
    '/settings/:path*',
    '/super-admin/:path*',
    '/notifications/:path*',
  ],
};
