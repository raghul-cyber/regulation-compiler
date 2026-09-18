import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');

export async function GET(req: NextRequest) {
  // Attempt to proxy upstream SSE stream from FastAPI
  try {
    const upstreamRes = await fetch(`${API_BASE_URL}/compliance/monitoring/stream`, {
      headers: {
        'Accept': 'text/event-stream',
      },
      cache: 'no-store',
    });

    if (upstreamRes.ok && upstreamRes.body) {
      return new Response(upstreamRes.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }
  } catch (upstreamErr) {
    // Upstream unavailable or cold-start: generate synthetic 1s heartbeat SSE stream directly
  }

  // Resilient fallback SSE stream that polls feed every 1s
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const sendEvent = async () => {
        try {
          const feedRes = await fetch(`${API_BASE_URL}/compliance/monitoring/feed?limit=1`, {
            cache: 'no-store',
          });
          if (feedRes.ok) {
            const feedData = await feedRes.json();
            const latest = feedData?.data?.[0] || null;
            const payload = {
              type: 'heartbeat',
              timestamp: new Date().toISOString(),
              stream_status: 'ACTIVE_1S_RESILIENT',
              latest_signal: latest,
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`));
          }
        } catch {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`));
        }
      };

      // Emit immediately
      await sendEvent();

      // Emit every second
      const timer = setInterval(async () => {
        try {
          await sendEvent();
        } catch {
          clearInterval(timer);
          controller.close();
        }
      }, 1000);

      req.signal.addEventListener('abort', () => {
        clearInterval(timer);
        try {
          controller.close();
        } catch {
          // Closed
        }
      });
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
