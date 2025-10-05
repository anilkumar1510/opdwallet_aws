import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require authentication
const protectedRoutes = [
  '/admin',
  '/operations',
  '/reports',
  '/settings',
]

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/forgot-password',
  '/reset-password',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Check if the path is a public route
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith('/api/auth')
  )

  // Get auth token from cookies
  const token = request.cookies.get('auth-token')?.value

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if accessing login page while authenticated
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/admin', request.url))
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/).*)',
  ],
}