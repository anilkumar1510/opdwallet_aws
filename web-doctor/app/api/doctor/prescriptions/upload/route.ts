import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function POST(request: NextRequest) {
  console.log('=== PRESCRIPTION UPLOAD PROXY START ===');
  console.log('[Upload Proxy] Handling prescription upload');

  const url = `${API_URL}/doctor/prescriptions/upload`;
  console.log('[Upload Proxy] Target URL:', url);

  // Get cookies from request
  const cookies = request.headers.get('cookie');
  console.log('[Upload Proxy] Forwarding cookies');

  try {
    // Get the FormData from the request
    const formData = await request.formData();
    console.log('[Upload Proxy] FormData received');

    // Log form data contents (for debugging)
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`[Upload Proxy] FormData field "${key}": File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`[Upload Proxy] FormData field "${key}": ${value}`);
      }
    }

    // Prepare headers - DO NOT set Content-Type for FormData (fetch will set it with boundary)
    const headers: Record<string, string> = {};

    if (cookies) {
      headers['Cookie'] = cookies;
    }

    console.log('[Upload Proxy] Forwarding to backend...');

    // Forward the FormData directly
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData, // Forward FormData directly
    });

    console.log('[Upload Proxy] Backend response status:', response.status);

    // Get response body
    const responseText = await response.text();
    console.log('[Upload Proxy] Response body length:', responseText.length);

    // Parse JSON response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('[Upload Proxy] Failed to parse response as JSON:', responseText.substring(0, 200));
      return NextResponse.json(
        { error: 'Invalid response from backend' },
        { status: 502 }
      );
    }

    console.log('[Upload Proxy] Upload successful');
    console.log('=== PRESCRIPTION UPLOAD PROXY END ===');

    // Return the response
    return NextResponse.json(responseData, {
      status: response.status,
    });

  } catch (error: any) {
    console.error('[Upload Proxy] Error:', error);
    console.error('[Upload Proxy] Error message:', error.message);

    return NextResponse.json(
      { error: 'Upload failed: ' + error.message },
      { status: 500 }
    );
  }
}

// Disable body parser to allow streaming
export const config = {
  api: {
    bodyParser: false,
  },
};
