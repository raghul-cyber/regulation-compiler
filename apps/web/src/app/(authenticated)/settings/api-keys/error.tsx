'use client';
import { Button } from '@/components/ui/button';

export default function ApiKeysError({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-xl border border-red-900/50 bg-[#0a0a0c] p-12 text-center shadow-md">
      <div className="flex flex-col items-center justify-center space-y-4">
        <h3 className="text-xl font-semibold text-zinc-100">Failed to load API Keys</h3>
        <Button onClick={() => reset()} variant="outline" className="mt-4 border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800">
          Try again
        </Button>
      </div>
    </div>
  );
}
