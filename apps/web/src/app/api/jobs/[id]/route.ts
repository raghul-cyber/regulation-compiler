import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getBackendUrl(): string {
  const envUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('127.0.0.1') && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'https://regulation-compiler.onrender.com/api/v1';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const backendBase = getBackendUrl();
  const authHeader = request.headers.get('authorization');

  const headers: Record<string, string> = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  try {
    const res = await fetch(`${backendBase}/jobs/${id}`, {
      headers,
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    });

    if (!res.ok) {
      // Fallback to events-list if /jobs/{id} returns 401/404 during warm-up
      try {
        const evRes = await fetch(`${backendBase}/jobs/${id}/events-list`, {
          headers,
          signal: AbortSignal.timeout(4000),
          cache: 'no-store',
        });
        if (evRes.ok) {
          const events = await evRes.json();
          return NextResponse.json({
            id,
            status: events.some((e: any) => e.status === 'completed' && e.stage_number === 9) ? 'completed' : 'processing',
            events,
          });
        }
      } catch (e) {}

      const errorText = await res.text().catch(() => 'Backend error');
      return NextResponse.json(
        { error: `Backend status ${res.status}: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to communicate with backend' },
      { status: 504 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const backendBase = getBackendUrl();
  const authHeader = request.headers.get('authorization');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  try {
    const res = await fetch(`${backendBase}/jobs/${id}/retry`, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to retry job' },
      { status: 500 }
    );
  }
}
