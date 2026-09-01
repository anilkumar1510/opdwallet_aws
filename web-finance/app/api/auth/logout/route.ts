import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiBaseUrl = process.env.API_URL ?
      process.env.API_URL.replace(/\/api$/, '') :
      'http://localhost:4000';

    const cookie = request.headers.get('cookie');

    const response = await fetch(`${apiBaseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie && { 'Cookie': cookie }),
      },
      credentials: 'include',
    });

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });

    // Clear both paths: '/finance' is what the login route sets, while '/' is
    // what the API sets directly for portals without a basePath. Leaving the
    // '/' one behind kept the browser looking authenticated after logout.
    nextResponse.cookies.delete({
      name: 'opd_session',
      path: '/finance',
    });
    nextResponse.cookies.delete({
      name: 'opd_session',
      path: '/',
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
