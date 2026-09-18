import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit') || '25';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${API_BASE_URL}/compliance/monitoring/feed?limit=${limit}`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'CDN-Cache-Control': 'no-store',
        }
      });
    }

    return NextResponse.json({ error: 'Backend feed unavailable' }, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Network error fetching live feed' }, { status: 502 });
  }
}
