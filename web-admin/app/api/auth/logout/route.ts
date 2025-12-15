import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the API URL from environment or default to localhost
    const apiBaseUrl = process.env.API_URL ?
      process.env.API_URL.replace(/\/api$/, '') :
      'http://localhost:4000';

    // Get the cookie from the request
    const cookie = request.headers.get('cookie');

    // Forward the logout request to the backend API with the cookie
    const response = await fetch(`${apiBaseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie && { 'Cookie': cookie }),
      },
      credentials: 'include',
    });

    const data = await response.json();

    // Create NextResponse and delete the opd_session cookie
    const nextResponse = NextResponse.json(data, { status: response.status });
    // Use same path as when setting the cookie
    nextResponse.cookies.delete({
      name: 'opd_session',
      path: '/admin',
    });

    return nextResponse;
  } catch (error) {
    console.error('[API Route] Logout error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
