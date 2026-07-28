import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Base path from next.config.js (for reference only in middleware)
const BASE_PATH = '/admin'

// IMPORTANT: Middleware sees routes WITHOUT the basePath prefix
// When user requests /admin, middleware sees /
// When user requests /admin/users, middleware sees /users

// Protected routes that require authentication (WITHOUT base path prefix)
const protectedRoutes = [
  '/',  // Dashboard (maps to /admin)
  '/users',
  '/policies',
  '/categories',
  '/services',
  '/lab',
  '/masters',
  '/reports',
  '/settings',
]

// Public routes that don't require authentication (WITHOUT base path prefix)
const publicRoutes = [
  '/login',
  '/forgot-password',
  '/reset-password',
]

// Roles allowed to use this portal (must match app/(admin)/login/page.tsx)
const allowedRoles = ['SUPER_ADMIN', 'ADMIN']

interface SessionClaims {
  role?: string
  exp?: number
}

// Cookies are NOT scoped by port, so every portal on localhost shares one jar.
// A session minted by another portal (e.g. a MEMBER token at Path=/) would
// otherwise satisfy a presence-only check here and bounce the user between
// /login and the dashboard forever. Decode the token and check role + expiry.
//
// This is a routing decision, not a security boundary: the payload is read
// without verifying the signature, and the API still authenticates every
// request on its own.
function decodeSession(token: string | undefined): SessionClaims | null {
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const bytes = Uint8Array.from(atob(padded), char => char.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

function isPortalSession(token: string): boolean {
  const claims = decodeSession(token)
  if (!claims?.role) return false

  // exp is in seconds since epoch
  if (typeof claims.exp === 'number' && claims.exp * 1000 <= Date.now()) return false

  return allowedRoles.includes(claims.role)
}

// The browser can hold several opd_session cookies at once for host "localhost"
// (one per Path, since ports don't scope cookies). It sends them all on one
// header, and request.cookies.get() surfaces only the LAST one -- which is not
// necessarily this portal's. Read every value and use the first that belongs
// to this portal, so a leftover cookie from another portal cannot mask a valid
// session and lock the user out of login.
function findPortalToken(request: NextRequest): string | null {
  const header = request.headers.get('cookie')
  if (!header) return null

  for (const part of header.split(';')) {
    const trimmed = part.trim()
    const separator = trimmed.indexOf('=')
    if (separator === -1) continue
    if (trimmed.slice(0, separator) !== 'opd_session') continue

    const value = trimmed.slice(separator + 1)
    if (value && isPortalSession(value)) return value
  }

  return null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is a public route (exact match or starts with /api/auth)
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/api/auth')

  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => {
    if (route === '/') {
      // Exact match for root only
      return pathname === '/'
    }
    return pathname.startsWith(route)
  })

  // Get auth token from cookies
  const token = findPortalToken(request)
  const isAuthenticated = token !== null

  // Redirect to login if accessing protected route without a session for THIS portal
  if (isProtectedRoute && !isPublicRoute && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if accessing login page while authenticated
  if (pathname === '/login' && isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // For authenticated requests, add user info to headers (for server components)
  if (isAuthenticated && isProtectedRoute) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-auth-token', token)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/',  // Match root path /admin
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/).*)',  // Match all sub-paths
  ],
}