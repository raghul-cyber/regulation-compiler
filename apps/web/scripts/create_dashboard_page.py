import os

files = {
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
    const [summaryData, activitiesData] = await Promise.all([
      getDashboardSummary(activeRegulation.id).catch(() => null),
      getRecentActivity(activeRegulation.id).catch(() => null)
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
          <CommandPalette regulations={regulations} />
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
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <Skeleton className="h-8 w-[150px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2"><Skeleton className="h-[350px] w-full rounded-xl" /></div>
          <div className="md:col-span-1"><Skeleton className="h-[350px] w-full rounded-xl" /></div>
        </div>
        <Skeleton className="h-[250px] w-full rounded-xl" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created {path}")

