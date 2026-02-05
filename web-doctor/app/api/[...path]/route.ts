import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Validation: Ensure API_URL is properly configured
if (!API_URL) {
  console.error('[API Proxy] CRITICAL: API_URL is not configured. Set API_URL or NEXT_PUBLIC_API_URL environment variable.');
}

// Validate API_URL format
try {
  new URL(API_URL);
} catch (error) {
  console.error('[API Proxy] CRITICAL: Invalid API_URL format:', API_URL);
}

// Content types that should be treated as binary (not text)
const BINARY_CONTENT_TYPES = [
  'image/',
  'audio/',
  'video/',
  'application/octet-stream',
  'application/pdf',
  'application/zip',
];

function isBinaryContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return BINARY_CONTENT_TYPES.some(type => contentType.toLowerCase().startsWith(type));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');

  // Get query string from the original request URL
  const requestUrl = new URL(request.url);
  const queryString = requestUrl.search; // includes the '?' if present

  const url = `${API_URL}/${path}${queryString}`;

  console.log('[API Proxy] Method:', request.method, '| Path:', path, '| URL:', url);

  // Get cookies from request
  const cookies = request.headers.get('cookie');

  // Check if this is a multipart/form-data request (file upload)
  const requestContentType = request.headers.get('content-type') || '';
  const isFormData = requestContentType.includes('multipart/form-data');

  // Prepare headers - don't set Content-Type for FormData (let fetch set it with boundary)
  const headers: Record<string, string> = {};

  if (!isFormData && request.method !== 'GET' && request.method !== 'HEAD') {
    headers['Content-Type'] = 'application/json';
  }

  // Forward cookies if they exist
  if (cookies) {
    headers['Cookie'] = cookies;
  }

  // Prepare request body for non-GET requests
  let body: any;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      if (isFormData) {
        // For FormData, pass it directly
        body = await request.formData();
      } else {
        body = await request.text();
      }
    } catch (error) {
      console.error('[API Proxy] Failed to read request body:', error);
    }
  }

  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
    });

    const responseContentType = response.headers.get('Content-Type');
    const isBinary = isBinaryContentType(responseContentType);

    console.log('[API Proxy] Response:', response.status, '| Content-Type:', responseContentType, '| Binary:', isBinary);

    // Log response body for search endpoints (debugging)
    if (path.includes('search')) {
      const clonedResponse = response.clone();
      const bodyText = await clonedResponse.text();
      console.log('[API Proxy] Search response body:', bodyText.substring(0, 500));
    }

    // Build response headers
    const responseHeaders: Record<string, string> = {};

    // Forward important headers
    if (responseContentType) {
      responseHeaders['Content-Type'] = responseContentType;
    }

    // Forward cache control headers for images
    const cacheControl = response.headers.get('Cache-Control');
    if (cacheControl) {
      responseHeaders['Cache-Control'] = cacheControl;
    }

    const pragma = response.headers.get('Pragma');
    if (pragma) {
      responseHeaders['Pragma'] = pragma;
    }

    // Handle binary responses (images, PDFs, etc.)
    if (isBinary) {
      const arrayBuffer = await response.arrayBuffer();

      const nextResponse = new NextResponse(arrayBuffer, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });

      // Forward Set-Cookie headers
      forwardCookies(response, nextResponse);

      return nextResponse;
    }

    // Handle text/JSON responses
    const responseBody = await response.text();

    const nextResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...responseHeaders,
        'Content-Type': responseContentType || 'application/json',
      },
    });

    // Forward Set-Cookie headers
    forwardCookies(response, nextResponse);

    return nextResponse;
  } catch (error: any) {
    console.error('[API Proxy] Fetch error:', error.message);

    return NextResponse.json(
      { error: 'Proxy error: ' + error.message },
      { status: 502 }
    );
  }
}

function forwardCookies(sourceResponse: Response, targetResponse: NextResponse) {
  // Forward Set-Cookie headers explicitly - use getSetCookie() for multiple cookies
  const setCookieHeaders = sourceResponse.headers.getSetCookie?.() || [];

  if (setCookieHeaders.length > 0) {
    setCookieHeaders.forEach((cookie) => {
      targetResponse.headers.append('Set-Cookie', cookie);
    });
  } else {
    // Try fallback method
    const singleCookie = sourceResponse.headers.get('set-cookie');
    if (singleCookie) {
      targetResponse.headers.set('Set-Cookie', singleCookie);
    }
  }
}
