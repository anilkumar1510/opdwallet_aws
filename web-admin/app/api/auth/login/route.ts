import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get the API URL from environment or default to localhost
    const apiBaseUrl = process.env.API_URL ?
      process.env.API_URL.replace(/\/api$/, '') :
      'http://localhost:4000';

    // Forward the login request to the backend API
    const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    const data = await response.json();

    // Create NextResponse
    const nextResponse = NextResponse.json(data, { status: response.status });

    // IMPORTANT: First delete any existing cookies with different paths
    // This prevents conflicts when browser has multiple cookies with same name
    nextResponse.cookies.delete({
      name: 'opd_session',
      path: '/',
    });

    // Get the Set-Cookie header from the backend response
    const setCookieHeader = response.headers.get('set-cookie');

    // Parse and set the cookie
    if (setCookieHeader) {
      console.log('[API Route /api/auth/login] Set-Cookie from backend:', setCookieHeader);

      // Extract cookie name, value, and options from Set-Cookie header
      // Format: opd_session=VALUE; Max-Age=604800; Path=/; Expires=...; HttpOnly; SameSite=Lax
      const cookieParts = setCookieHeader.split(';').map(part => part.trim());
      const [nameValue] = cookieParts;
      const [name, value] = nameValue.split('=');

      // Extract cookie options
      const maxAge = cookieParts.find(p => p.startsWith('Max-Age='))?.split('=')[1];
      const path = cookieParts.find(p => p.startsWith('Path='))?.split('=')[1];
      const httpOnly = cookieParts.some(p => p === 'HttpOnly');
      const sameSite = cookieParts.find(p => p.startsWith('SameSite='))?.split('=')[1]?.toLowerCase();

      // Set cookie on NextResponse
      // IMPORTANT: Use basePath '/admin' for cookie path to match Next.js basePath
      const cookieOptions = {
        httpOnly,
        path: '/admin', // Match Next.js basePath
        maxAge: maxAge ? parseInt(maxAge) : undefined,
        sameSite: (sameSite as 'strict' | 'lax' | 'none') || 'lax',
        secure: false, // false for localhost
      };

      console.log('[API Route /api/auth/login] Setting cookie:', name, 'with options:', cookieOptions);
      nextResponse.cookies.set(name, value, cookieOptions);
    }

    return nextResponse;
  } catch (error) {
    console.error('[API Route] Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
