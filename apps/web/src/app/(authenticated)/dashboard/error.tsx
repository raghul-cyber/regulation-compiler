'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="rounded-xl border border-red-900/50 bg-[#0a0a0c] p-12 text-center shadow-md">
      <div className="flex flex-col items-center justify-center space-y-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3 className="text-xl font-semibold text-zinc-100">Failed to load Dashboard data</h3>
        <p className="text-sm text-zinc-500">{error.message || "An error occurred while communicating with the API."}</p>
        <Button onClick={() => reset()} variant="outline" className="mt-4 border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800">
          Try again
        </Button>
      </div>
    </div>
  );
}
