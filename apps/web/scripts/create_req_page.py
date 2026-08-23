import os

files = {
    "src/app/(authenticated)/regulations/[id]/requirements/loading.tsx": """import { Skeleton } from '@/components/ui/skeleton';

export default function RequirementsLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-8 w-[300px] bg-zinc-800" />
      </div>
      
      <Skeleton className="h-16 w-full bg-zinc-800 rounded-xl mb-6" />
      
      <div className="flex flex-col gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full bg-zinc-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
""",

    "src/app/(authenticated)/regulations/[id]/requirements/error.tsx": """'use client';

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
""",

    "src/app/(authenticated)/regulations/[id]/requirements/page.tsx": """import { Suspense } from 'react';
import Link from 'next/link';
import { getRequirements } from '@/lib/api';
import { FilterBar } from '@/components/requirements/filter-bar';
import { RequirementCard } from '@/components/requirements/requirement-card';

export const metadata = {
  title: 'Requirements Browser | Regulation Compiler',
};

async function RequirementsContent({ 
  id, 
  searchParams 
}: { 
  id: string, 
  searchParams: Record<string, string | string[]> | undefined 
}) {
  
  // Normalize search params
  const params: Record<string, string> = {};
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (typeof v === 'string') params[k] = v;
    });
  }

  // Next.js explicitly caches `fetch` calls, so we don't need a silent .catch()
  const response = await getRequirements(id, params);
  const requirements = response?.data || [];

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        <div className="mb-2">
          <Link 
            href="/dashboard"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Extracted Requirements</h1>
          <p className="mt-1 text-zinc-500">Review the AI-extracted compliance policies.</p>
        </div>

        <FilterBar />

        {requirements.length > 0 ? (
          <div className="grid gap-4 mt-2">
            {requirements.map((req: any) => (
              <RequirementCard key={req.id} req={req} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-[#0a0a0c] p-12 text-center shadow-md mt-2">
            <h3 className="text-lg font-semibold text-zinc-100">No requirements found</h3>
            <p className="mt-2 text-sm text-zinc-500">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </>
  );
}

// Next.js 14 Page props include searchParams 
export default function RequirementsPage({ 
  params,
  searchParams,
}: { 
  params: { id: string },
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return (
    <RequirementsContent id={params.id} searchParams={searchParams as Record<string, string>} />
  );
}
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created {path}")

