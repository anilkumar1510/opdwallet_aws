import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  console.log('=== API PROXY DEBUG START ===');
  console.log('[API Proxy] Method:', request.method);
  console.log('[API Proxy] Path segments:', pathSegments);

  const path = pathSegments.join('/');
  const url = `${API_URL}/${path}`;

  console.log('[API Proxy] Target URL:', url);
  console.log('[API Proxy] Original URL:', request.url);
  console.log('[API Proxy] Request headers:', Object.fromEntries(request.headers.entries()));

  // Get cookies from request
  const cookies = request.headers.get('cookie');
  console.log('[API Proxy] Request cookies:', cookies);

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Forward cookies if they exist
  if (cookies) {
    headers['Cookie'] = cookies;
  }

  console.log('[API Proxy] Forwarding headers:', headers);

  // Prepare request body for non-GET requests
  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      body = await request.text();
      console.log('[API Proxy] Request body:', body);
    } catch (error) {
      console.error('[API Proxy] Failed to read request body:', error);
    }
  }

  try {
    console.log('[API Proxy] Making fetch request...');
    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
    });

    console.log('[API Proxy] Response status:', response.status);
    console.log('[API Proxy] Response headers:', Object.fromEntries(response.headers.entries()));

    // Get response body
    const responseBody = await response.text();
    console.log('[API Proxy] Response body length:', responseBody.length);
    console.log('[API Proxy] Response body preview:', responseBody.substring(0, 200));

    // Create response with same status
    const nextResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });

    // Forward Set-Cookie headers explicitly
    const setCookieHeaders = response.headers.get('set-cookie');
    if (setCookieHeaders) {
      console.log('[API Proxy] Set-Cookie header found:', setCookieHeaders);
      nextResponse.headers.set('Set-Cookie', setCookieHeaders);
    } else {
      console.log('[API Proxy] No Set-Cookie header in response');
    }

    console.log('[API Proxy] Final response headers:', Object.fromEntries(nextResponse.headers.entries()));
    console.log('=== API PROXY DEBUG END ===');

    return nextResponse;
  } catch (error: any) {
    console.error('[API Proxy] Fetch error:', error);
    console.error('[API Proxy] Error message:', error.message);
    console.error('[API Proxy] Error stack:', error.stack);

    return NextResponse.json(
      { error: 'Proxy error: ' + error.message },
      { status: 502 }
    );
  }
}
