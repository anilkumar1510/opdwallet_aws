import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const apiBaseUrl = process.env.API_URL ?
      process.env.API_URL.replace(/\/api$/, '') :
      'http://localhost:4000';

    const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });

    const setCookieHeader = response.headers.get('set-cookie');

    if (setCookieHeader) {
      const cookieParts = setCookieHeader.split(';').map(part => part.trim());
      const [nameValue] = cookieParts;
      const [name, value] = nameValue.split('=');

      const maxAge = cookieParts.find(p => p.startsWith('Max-Age='))?.split('=')[1];
      const httpOnly = cookieParts.some(p => p === 'HttpOnly');
      const sameSite = cookieParts.find(p => p.startsWith('SameSite='))?.split('=')[1]?.toLowerCase();

      const cookieOptions = {
        httpOnly,
        path: '/operations',
        maxAge: maxAge ? parseInt(maxAge) : undefined,
        sameSite: (sameSite as 'strict' | 'lax' | 'none') || 'lax',
        secure: false,
      };

      nextResponse.cookies.set(name, value, cookieOptions);

      // Expire any session another portal left at '/'. Cookies ignore ports, so
      // a member session from :3002 is also sent here, and the browser would
      // send both. This must be appended raw and after the set() above:
      // nextResponse.cookies is keyed by name, so a delete() here would just be
      // overwritten by the set() and never reach the browser.
      nextResponse.headers.append(
        'Set-Cookie',
        'opd_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
      );
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
