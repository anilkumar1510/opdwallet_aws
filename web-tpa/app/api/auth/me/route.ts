import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the API URL from environment or default to localhost
    const apiBaseUrl = process.env.API_URL ?
      process.env.API_URL.replace(/\/api$/, '') :
      'http://localhost:4000';

    // Get the cookie from the request
    const cookie = request.headers.get('cookie');
    console.log('[API Route /api/auth/me] Cookie from request:', cookie);

    // Extract only opd_session cookie to send to backend
    let opdSessionCookie = null;
    if (cookie) {
      const cookies = cookie.split(';').map(c => c.trim());
      const opdSession = cookies.find(c => c.startsWith('opd_session='));
      opdSessionCookie = opdSession || null;
      console.log('[API Route /api/auth/me] Extracted opd_session:', opdSessionCookie);
    }

    // Forward the request to the backend API with the cookie
    const fetchHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (opdSessionCookie) {
      fetchHeaders['Cookie'] = opdSessionCookie;
    }

    console.log('[API Route /api/auth/me] Sending headers to backend:', fetchHeaders);

    const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
      method: 'GET',
      headers: fetchHeaders,
      credentials: 'include',
    });

    console.log('[API Route /api/auth/me] Backend response status:', response.status);

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Route] Get current user error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
