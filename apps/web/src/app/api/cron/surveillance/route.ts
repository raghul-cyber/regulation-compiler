import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for live scraping & AST extraction

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');

export async function GET(req: NextRequest) {
  return handleSurveillanceCron(req);
}

export async function POST(req: NextRequest) {
  return handleSurveillanceCron(req);
}

async function handleSurveillanceCron(req: NextRequest) {
  // Optional security check for Vercel Cron
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized: Invalid cron secret' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log(`[24/7 SURVEILLANCE CRON]: Triggering autonomous regulatory sync at ${new Date().toISOString()}`);

  try {
    // 1. Trigger live scraping and AST compilation pipeline
    const syncRes = await fetch(`${API_BASE_URL}/compliance/monitoring/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    let syncData = null;
    if (syncRes.ok) {
      syncData = await syncRes.json();
    } else {
      console.warn(`[24/7 SURVEILLANCE CRON] Sync API returned status ${syncRes.status}`);
    }

    // 2. Trigger probe for fresh telemetry
    let probeData = null;
    try {
      const probeRes = await fetch(`${API_BASE_URL}/compliance/monitoring/probe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jurisdiction: 'GLOBAL' }),
        cache: 'no-store',
      });
      if (probeRes.ok) {
        probeData = await probeRes.json();
      }
    } catch (probeErr) {
      console.warn('[24/7 SURVEILLANCE CRON] Probe notice:', probeErr);
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      status: 'success',
      service: '24_7_autonomous_statutory_surveillance',
      timestamp: new Date().toISOString(),
      duration_ms: durationMs,
      sync_results: syncData,
      probe_results: probeData ? probeData.status : 'skipped',
      message: '24/7 continuous statutory surveillance pipeline executed successfully.'
    });

  } catch (error: any) {
    console.error('[24/7 SURVEILLANCE CRON ERROR]:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error?.message || 'Failed to execute surveillance cron sweep',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
