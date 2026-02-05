import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiBaseUrl = process.env.API_URL ?
      process.env.API_URL.replace(/\/api$/, '') :
      'http://localhost:4000';

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const policyId = searchParams.get('policyId');
    const search = searchParams.get('search');

    // Get the cookie from the request
    const cookie = request.headers.get('cookie');
    let opdSessionCookie = null;
    if (cookie) {
      const cookies = cookie.split(';').map(c => c.trim());
      const opdSession = cookies.find(c => c.startsWith('opd_session='));
      opdSessionCookie = opdSession || null;
    }

    // Forward the request to the backend API with the cookie
    const fetchHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (opdSessionCookie) {
      fetchHeaders['Cookie'] = opdSessionCookie;
    }

    const response = await fetch(
      `${apiBaseUrl}/api/assignments/search-primary-members?policyId=${policyId}&search=${encodeURIComponent(search || '')}`,
      {
        method: 'GET',
        headers: fetchHeaders,
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Route] Search primary members error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
