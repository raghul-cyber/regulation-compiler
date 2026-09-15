import React from 'react';
import { StatsSkeleton, CardSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-md bg-white/5 animate-pulse" />
          <div className="h-4 w-96 rounded-md bg-white/5 animate-pulse" />
        </div>
        <div className="h-10 w-36 rounded-lg bg-white/5 animate-pulse" />
      </div>

      <StatsSkeleton />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TableSkeleton rows={6} />
        </div>
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
