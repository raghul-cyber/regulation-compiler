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

  const clerkUserId = request.headers.get('x-clerk-user-id');
  if (clerkUserId) {
    headers['X-Clerk-User-Id'] = clerkUserId;
  }

  const userEmail = request.headers.get('x-user-email');
  if (userEmail) {
    headers['X-User-Email'] = userEmail;
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

  // Attempt fetch with fallback to cloud if local backend is unmounted
  const targetCandidates = [targetUrl];
  const cloudUrl = `https://regulation-compiler.onrender.com/api/v1/admin/${path}${request.nextUrl.search}`;
  if (!targetUrl.includes('onrender.com')) {
    targetCandidates.push(cloudUrl);
  }

  let lastError: any = null;
  for (const url of targetCandidates) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const timeoutMs = url.includes('127.0.0.1') ? 3000 : 25000;
        const resp = await fetch(url, {
          method,
          headers,
          body: method === 'POST' ? body : undefined,
          cache: 'no-store',
          signal: AbortSignal.timeout(timeoutMs),
        });

        const data = await resp.json().catch(() => ({}));
        const responseHeaders: Record<string, string> = {};
        if (method === 'GET' && resp.ok) {
          responseHeaders['Cache-Control'] = 'private, max-age=30, stale-while-revalidate=60';
        }
        return NextResponse.json(data, { status: resp.status, headers: responseHeaders });
      } catch (err: any) {
        lastError = err;
        if (url.includes('127.0.0.1')) {
          // Local server connection failed immediately, skip to cloud target
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 800));
      }
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
