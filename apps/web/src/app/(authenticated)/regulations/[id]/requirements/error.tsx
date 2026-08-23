'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function RequirementsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Requirements Error:', error);
  }, [error]);

  return (
    <div className="rounded-xl border border-red-900/50 bg-[#0a0a0c] p-12 text-center shadow-md">
      <div className="flex flex-col items-center justify-center space-y-4">
        <h3 className="text-xl font-semibold text-zinc-100">Failed to load requirements</h3>
        <p className="text-sm text-zinc-500">{error.message || "An error occurred while fetching requirements from the API."}</p>
        <Button onClick={() => reset()} variant="outline" className="mt-4 border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800">
          Try again
        </Button>
      </div>
    </div>
  );
}
