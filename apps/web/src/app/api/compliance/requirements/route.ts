import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getBackendBaseUrl(): string {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const pubUrl = process.env.NEXT_PUBLIC_API_URL;
    if (pubUrl && !pubUrl.includes('127.0.0.1') && !pubUrl.includes('localhost')) {
      return pubUrl.replace(/\/+$/, '');
    }
    return 'https://regulation-compiler.onrender.com/api/v1';
  }
  return (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1').replace(/\/+$/, '');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get('targetId');
  const signalId = searchParams.get('signalId');

  const queryId = targetId || signalId;
  if (!queryId) {
    return NextResponse.json({ success: false, data: [], error: "Missing targetId or signalId" }, { status: 400 });
  }

  const baseUrl = getBackendBaseUrl();
  const endpointsToTry: string[] = [];

  if (targetId) {
    endpointsToTry.push(`${baseUrl}/regulations/${encodeURIComponent(targetId)}/requirements`);
  }
  if (signalId) {
    if (signalId !== targetId) {
      endpointsToTry.push(`${baseUrl}/regulations/${encodeURIComponent(signalId)}/requirements`);
      endpointsToTry.push(`${baseUrl}/signals/${encodeURIComponent(signalId)}/requirements`);
    }
    endpointsToTry.push(`${baseUrl}/compliance/signals/${encodeURIComponent(signalId)}/requirements`);
  }

  for (const endpoint of endpointsToTry) {
    try {
      const res = await fetch(endpoint, {
        cache: 'no-store',
        signal: AbortSignal.timeout(6000),
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : json?.data || [];
        if (data.length > 0) {
          return NextResponse.json({ success: true, data });
        }
      }
    } catch {
      // try next endpoint
    }
  }

  return NextResponse.json({ success: true, data: [] });
}
