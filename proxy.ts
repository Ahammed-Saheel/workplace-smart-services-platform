import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'wsc_session';

const ROLE_PREFIX: Record<string, string> = {
  '/employee': 'EMPLOYEE',
  '/cafeteria-owner': 'CAFETERIA_OWNER',
  '/charging-owner': 'CHARGING_OWNER',
  '/admin': 'ADMIN',
};

const ROLE_HOME: Record<string, string> = {
  EMPLOYEE: '/employee/dashboard',
  CAFETERIA_OWNER: '/cafeteria-owner/dashboard',
  CHARGING_OWNER: '/charging-owner/dashboard',
  ADMIN: '/admin/dashboard',
};

const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

async function readSession(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as { sub: string; role: string; name: string; email: string };
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await readSession(req);

  const matchedPrefix = Object.keys(ROLE_PREFIX).find((p) =>
    pathname.startsWith(p)
  );

  if (matchedPrefix) {
    if (!session) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== ROLE_PREFIX[matchedPrefix]) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  if (session && AUTH_PAGES.includes(pathname)) {
    const home = ROLE_HOME[session.role] ?? '/';
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/employee/:path*',
    '/cafeteria-owner/:path*',
    '/charging-owner/:path*',
    '/admin/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ],
};
