import { GET as frameworksHandler } from '@/app/api/regulations/frameworks/route';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  return frameworksHandler(request);
}
