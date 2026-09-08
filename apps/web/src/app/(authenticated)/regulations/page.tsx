import { Suspense } from 'react';
import Link from 'next/link';
import { getRegulations } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield } from 'lucide-react';
import { RegulationsClient } from './regulations-client';

export const metadata = {
  title: 'Canonical Regulations Directory | Regulation Compiler',
};

async function RegulationsDataLoader() {
  const regulations = await getRegulations();

  if (!regulations || regulations.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-[#0c0c0e] p-12 text-center shadow-lg">
        <Shield className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-zinc-100">No regulations loaded</h3>
        <p className="mt-2 text-sm text-zinc-400">Database synchronization in progress. Please refresh momentarily.</p>
      </div>
    );
  }

  return <RegulationsClient initialRegulations={regulations} />;
}

export default function RegulationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Canonical Regulations</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
              Live & Verified
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Browse official statutory frameworks, enforceable controls, and AI-compiled requirements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-300 hover:text-white text-xs">
              Return to Hub
            </Button>
          </Link>
        </div>
      </div>
      
      <Suspense fallback={
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-24 rounded-xl bg-zinc-900/50" />
            <Skeleton className="h-24 rounded-xl bg-zinc-900/50" />
            <Skeleton className="h-24 rounded-xl bg-zinc-900/50" />
            <Skeleton className="h-24 rounded-xl bg-zinc-900/50" />
          </div>
          <Skeleton className="h-16 rounded-xl bg-zinc-900/50" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[260px] rounded-xl bg-zinc-900/50" />
            <Skeleton className="h-[260px] rounded-xl bg-zinc-900/50" />
            <Skeleton className="h-[260px] rounded-xl bg-zinc-900/50" />
          </div>
        </div>
      }>
        <RegulationsDataLoader />
      </Suspense>
    </div>
  );
}
