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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(220,210,190,0.08)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 font-mono text-[9px] tracking-widest text-[#8D8982] uppercase">
            <span className="text-[#C7AF7B]">+</span>
            <span>DIRECTORY: CANONICAL STATUTES</span>
            <span className="text-[#625F5A]">/</span>
            <span>ENFORCEABLE CONTROLS</span>
            <span className="text-[#C7AF7B]">+</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F4F0E8]">Canonical Regulations</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#718A79]/15 text-[#8BA894] border border-[#718A79]/35 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#718A79] animate-pulse" />
              Live &amp; Verified
            </span>
          </div>
          <p className="mt-1 text-sm text-[#C9C4BA] font-sans">
            Browse official statutory frameworks, enforceable controls, and AI-compiled requirements.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <Link href="/dashboard">
            <button className="rc-btn-graphite-metal rounded-[6px] px-3.5 py-1.5 text-xs transition-all cursor-pointer">
              Return to Hub
            </button>
          </Link>
        </div>
      </div>
      
      <Suspense fallback={
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-24 rounded-xl bg-[#151311] border border-[#211D19]" />
            <Skeleton className="h-24 rounded-xl bg-[#151311] border border-[#211D19]" />
            <Skeleton className="h-24 rounded-xl bg-[#151311] border border-[#211D19]" />
            <Skeleton className="h-24 rounded-xl bg-[#151311] border border-[#211D19]" />
          </div>
          <Skeleton className="h-16 rounded-xl bg-[#151311] border border-[#211D19]" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[260px] rounded-xl bg-[#151311] border border-[#211D19]" />
            <Skeleton className="h-[260px] rounded-xl bg-[#151311] border border-[#211D19]" />
            <Skeleton className="h-[260px] rounded-xl bg-[#151311] border border-[#211D19]" />
          </div>
        </div>
      }>
        <RegulationsDataLoader />
      </Suspense>
    </div>
  );
}
