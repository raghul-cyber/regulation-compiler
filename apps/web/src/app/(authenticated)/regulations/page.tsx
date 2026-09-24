import { Suspense } from 'react';
import Link from 'next/link';
import { getRegulations } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield } from 'lucide-react';
import { RegulationsClient } from './regulations-client';

export const metadata = {
  title: 'Canonical Regulations Directory | RegCompiler',
  description: 'Explore compiled regulatory frameworks, version branches, and structural metadata.',
};

export const dynamic = 'force-dynamic';


async function RegulationsDataLoader() {
  const regulations = await getRegulations().catch(() => []);
  return <RegulationsClient initialRegulations={regulations || []} />;
}


export default function RegulationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 font-mono text-[9px] tracking-widest text-zinc-500 uppercase">
            <span className="text-[#00F0FF]">+</span>
            <span>DIRECTORY: CANONICAL STATUTES</span>
            <span className="text-zinc-600">/</span>
            <span>ENFORCEABLE CONTROLS</span>
            <span className="text-[#00F0FF]">+</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Canonical Regulations</h1>
            <span className="stitch-badge stitch-badge-emerald">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live & Verified
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Browse official statutory frameworks, enforceable controls, and AI-compiled requirements.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="border-white/[0.12] bg-[#080D14]/80 text-zinc-300 hover:text-[#00F0FF] hover:border-[#00F0FF]/40 text-xs transition-all">
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
