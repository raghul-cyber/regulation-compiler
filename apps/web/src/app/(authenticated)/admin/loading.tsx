import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header Banner Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-[#151311] border border-[#211D19] shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-[#AD956C]/10 border border-[#AD956C]/20 text-[#AD956C]">
            <RefreshCw className="w-6 h-6 animate-spin text-[#AD956C]" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-7 w-64 bg-[#211D19] rounded-lg animate-pulse" />
              <div className="h-5 w-32 bg-[#AD956C]/10 rounded-full animate-pulse" />
            </div>
            <div className="h-4 w-96 bg-[#100E0D] rounded animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-40 bg-[#100E0D] rounded-lg animate-pulse" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-xl bg-[#100E0D] border border-[#211D19] space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-28 bg-[#211D19] rounded animate-pulse" />
              <div className="h-4 w-4 bg-[#211D19] rounded-full animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-[#211D19] rounded-lg animate-pulse" />
            <div className="h-3 w-36 bg-[#151311] rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Chart and Directory Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl bg-[#100E0D] border border-[#211D19] h-80 space-y-4">
          <div className="h-5 w-48 bg-[#211D19] rounded animate-pulse" />
          <div className="h-60 bg-[#151311] rounded-lg animate-pulse" />
        </div>
        <div className="p-6 rounded-xl bg-[#100E0D] border border-[#211D19] h-80 space-y-4">
          <div className="h-5 w-36 bg-[#211D19] rounded animate-pulse" />
          <div className="h-60 bg-[#151311] rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
