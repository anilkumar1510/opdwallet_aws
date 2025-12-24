import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Base path from next.config.js (for reference only in middleware)
const BASE_PATH = '/tpa'

// IMPORTANT: Middleware sees routes WITHOUT the basePath prefix
// When user requests /tpa, middleware sees /
// When user requests /tpa/claims, middleware sees /claims

// Protected routes that require authentication (WITHOUT base path prefix)
const protectedRoutes = [
  '/',  // Dashboard (maps to /tpa)
  '/claims',
  '/analytics',
  '/users',
]

// Public routes that don't require authentication (WITHOUT base path prefix)
const publicRoutes = [
  '/login',
  '/forgot-password',
  '/reset-password',
]

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
  const token = request.cookies.get('opd_session')?.value

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !isPublicRoute && !token) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if accessing login page while authenticated
  if (pathname === '/login' && token) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // For authenticated requests, add user info to headers (for server components)
  if (token && isProtectedRoute) {
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