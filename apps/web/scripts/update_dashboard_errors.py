import os

files = {
    "src/app/(authenticated)/dashboard/error.tsx": """'use client';

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
""",
    "src/app/(authenticated)/dashboard/page.tsx": """import { Suspense } from 'react';
import { getRegulations, getDashboardSummary, getRecentActivity } from '@/lib/api';
import { SummaryMetrics } from '@/components/dashboard/summary-metrics';
import { SeverityChart } from '@/components/dashboard/severity-chart';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { DashboardCanvas } from '@/components/dashboard/dashboard-canvas';
import { CommandPalette } from '@/components/dashboard/command-palette';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Dashboard | Regulation Compiler',
};

async function DashboardContent() {
  // Fetch regulations to get the latest one
  const regulations = await getRegulations();
  const activeRegulation = regulations?.[0];

  let summary = null;
  let activities = null;

  if (activeRegulation) {
    // Deliberately removing the silent .catch() so Next.js Error Boundary triggers on network error
    const [summaryData, activitiesData] = await Promise.all([
      getDashboardSummary(activeRegulation.id),
      getRecentActivity(activeRegulation.id)
    ]);
    summary = summaryData;
    activities = activitiesData?.data;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-zinc-500">
            {activeRegulation ? `Overview for ${activeRegulation.name}` : 'Welcome to your secure dashboard.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <CommandPalette regulations={regulations || []} />
        </div>
      </div>

      {!activeRegulation ? (
        <div className="rounded-xl border border-zinc-800 bg-[#0a0a0c] p-12 text-center shadow-md">
          <h3 className="text-lg font-semibold text-zinc-100">No regulations uploaded yet</h3>
          <p className="mt-2 text-sm text-zinc-500">Upload a regulatory document to see your compliance overview.</p>
        </div>
      ) : (
        <>
          <SummaryMetrics summary={summary || {}} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <SeverityChart distribution={summary?.severity_distribution || {}} />
            </div>
            <div className="md:col-span-1">
              <ActivityFeed activities={activities || []} />
            </div>
          </div>

          <div className="w-full">
             <DashboardCanvas />
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px] bg-zinc-800" />
            <Skeleton className="h-4 w-[300px] bg-zinc-800" />
          </div>
          <Skeleton className="h-8 w-[150px] bg-zinc-800" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl bg-zinc-800" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2"><Skeleton className="h-[350px] w-full rounded-xl bg-zinc-800" /></div>
          <div className="md:col-span-1"><Skeleton className="h-[350px] w-full rounded-xl bg-zinc-800" /></div>
        </div>
        <Skeleton className="h-[250px] w-full rounded-xl bg-zinc-800" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
"""
}

for path, content in files.items():
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Updated {path}")
