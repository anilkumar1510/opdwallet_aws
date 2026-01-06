import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

async function proxyRequest(request: NextRequest, path: string[]) {
  const apiPath = path.join('/')
  // Prepend 'api' to the path since the catch-all route is under /api/[...path]
  const url = `${API_URL}/api/${apiPath}`

  // Forward query parameters
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  const fullUrl = queryString ? `${url}?${queryString}` : url

  // Get request body if it exists
  let body: string | FormData | undefined
  const contentType = request.headers.get('content-type')

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (contentType?.includes('application/json')) {
      body = await request.text()
      if (apiPath.includes('submit-existing')) {
        console.log('[PROXY] Forwarding submit-existing request')
        console.log('[PROXY] Body received from client:', body)
      }
    } else if (contentType?.includes('multipart/form-data')) {
      body = await request.formData()
    } else {
      body = await request.text()
    }
  }

  // Forward headers (excluding host and connection headers)
  const headers = new Headers()
  request.headers.forEach((value, key) => {
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      headers.set(key, value)
    }
  })

  // Forward cookies
  const cookie = request.headers.get('cookie')
  if (cookie) {
    headers.set('cookie', cookie)
  }

  try {
    const response = await fetch(fullUrl, {
      method: request.method,
      headers,
      body: body as BodyInit | undefined,
      credentials: 'include',
    })

    // Create response with all headers from backend
    const responseHeaders = new Headers()
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value)
    })

    // Handle binary responses (PDFs, images, etc.) properly
    const contentType = response.headers.get('content-type') || ''
    const isBinary = contentType.includes('application/pdf') ||
                     contentType.includes('image/') ||
                     contentType.includes('application/octet-stream')

    if (isBinary) {
      // For binary data, use arrayBuffer to preserve the binary content
      const data = await response.arrayBuffer()
      return new NextResponse(data, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      })
    } else {
      // For text responses, use text()
      const data = await response.text()
      return new NextResponse(data, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      })
    }
  } catch (error) {
    console.error(`[API Proxy] Error proxying to ${fullUrl}:`, error)
    return NextResponse.json(
      { message: 'Internal proxy error', error: String(error) },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path)
}
