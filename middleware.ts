// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Paths that require authentication
const protectedPaths = [
  '/api/favorites',
  '/api/comments',
  '/api/ratings',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/users',
  '/admin',
];

// Paths that require admin role
const adminPaths = ['/admin', '/api/admin'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if path requires authentication
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  // Check if path requires admin role
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));

  if (isProtectedPath || isAdminPath) {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For API routes, return 401 Unauthorized
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      // For non-API routes, redirect to login page
      const url = new URL('/login', req.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    const token = authHeader.split(' ')[1];
    const { isValid, payload } = await verifyToken(token);

    if (!isValid || !payload) {
      // For API routes, return 401 Unauthorized
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }

      // For non-API routes, redirect to login page
      const url = new URL('/login', req.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Check admin role for admin paths
    if (isAdminPath) {
      const roles = payload.roles as string[];
      if (!roles.includes('admin')) {
        // For API routes, return 403 Forbidden
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // For non-API routes, redirect to home page
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  }

  return NextResponse.next();
}

// Configure the middleware to run only for specific paths
export const config = {
  matcher: ['/api/:path*', '/admin/:path*', '/profile/:path*'],
};
