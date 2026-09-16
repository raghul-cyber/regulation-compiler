import React from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header Banner Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-7 w-64 bg-zinc-800/80 rounded-lg animate-pulse" />
              <div className="h-5 w-32 bg-amber-500/10 rounded-full animate-pulse" />
            </div>
            <div className="h-4 w-96 bg-zinc-900 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-40 bg-zinc-900 rounded-xl animate-pulse" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-xl bg-[#0c0d12] border border-zinc-800/80 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-28 bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-4 bg-zinc-800 rounded-full animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-zinc-800 rounded-lg animate-pulse" />
            <div className="h-3 w-36 bg-zinc-900 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Chart and Directory Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl bg-[#0c0d12] border border-zinc-800/80 h-80 space-y-4">
          <div className="h-5 w-48 bg-zinc-800 rounded animate-pulse" />
          <div className="h-60 bg-zinc-900/50 rounded-lg animate-pulse" />
        </div>
        <div className="p-6 rounded-xl bg-[#0c0d12] border border-zinc-800/80 h-80 space-y-4">
          <div className="h-5 w-36 bg-zinc-800 rounded animate-pulse" />
          <div className="h-60 bg-zinc-900/50 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
