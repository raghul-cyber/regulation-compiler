import { NextRequest, NextResponse } from 'next/server';

function getBackendBaseUrl(): string {
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://regulation-compiler.onrender.com/api/v1'
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  return handleProxyRequest(request, context, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  return handleProxyRequest(request, context, 'POST');
}

async function handleProxyRequest(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> },
  method: string
) {
  const { slug } = await context.params;
  const path = slug.join('/');
  const backendBase = getBackendBaseUrl().replace(/\/$/, '');
  const targetUrl = `${backendBase}/admin/${path}${request.nextUrl.search}`;

  const authHeader = request.headers.get('authorization');
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  let body: any = undefined;
  if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  // Attempt fetch with retry for cold-start tolerance
  let lastError: any = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await fetch(targetUrl, {
        method,
        headers,
        body: method === 'POST' ? body : undefined,
        cache: 'no-store',
        signal: AbortSignal.timeout(30000),
      });

      const data = await resp.json().catch(() => ({}));
      return NextResponse.json(data, { status: resp.status });
    } catch (err: any) {
      lastError = err;
      // Sleep 1 second before retry if Render is spinning up
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return NextResponse.json(
    {
      detail: `Backend gateway unavailable: ${lastError?.message || 'Connection failed'}`,
      target: targetUrl
    },
    { status: 503 }
  );
}
