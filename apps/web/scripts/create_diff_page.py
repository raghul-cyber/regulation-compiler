import os

files = {
    "src/app/(authenticated)/regulations/[id]/diff/loading.tsx": """import { Skeleton } from '@/components/ui/skeleton';

export default function DiffLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse h-[700px]">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-6 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[400px] bg-zinc-800" />
          <Skeleton className="h-4 w-[250px] bg-zinc-800" />
        </div>
        <Skeleton className="h-8 w-[300px] bg-zinc-800 rounded-lg" />
      </div>
      
      <div className="flex-1 flex gap-6">
        <div className="w-1/3 space-y-4">
          <Skeleton className="h-full w-full bg-zinc-800 rounded-xl" />
        </div>
        <div className="w-2/3 space-y-4">
          <Skeleton className="h-full w-full bg-zinc-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
""",

    "src/app/(authenticated)/regulations/[id]/diff/error.tsx": """'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DiffError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Diff Error:', error);
  }, [error]);

  return (
    <div className="rounded-xl border border-red-900/50 bg-[#0a0a0c] p-12 text-center shadow-md">
      <div className="flex flex-col items-center justify-center space-y-4">
        <h3 className="text-xl font-semibold text-zinc-100">Failed to load Diff Engine</h3>
        <p className="text-sm text-zinc-500">{error.message || "An error occurred while computing version differences."}</p>
        <Button onClick={() => reset()} variant="outline" className="mt-4 border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800">
          Try again
        </Button>
      </div>
    </div>
  );
}
""",

    "src/app/(authenticated)/regulations/[id]/diff/page.tsx": """import { Suspense } from 'react';
import Link from 'next/link';
import { getRegulationDiff } from '@/lib/api';
import { DiffViewer } from '@/components/diff/diff-viewer';

export const metadata = {
  title: 'Diff Engine | Regulation Compiler',
};

async function DiffContent({ 
  id, 
  searchParams 
}: { 
  id: string, 
  searchParams: Record<string, string | string[]> | undefined 
}) {
  const oldV = typeof searchParams?.old_version_id === 'string' ? searchParams.old_version_id : undefined;
  const newV = typeof searchParams?.new_version_id === 'string' ? searchParams.new_version_id : undefined;

  const response = await getRegulationDiff(id, oldV, newV);
  const diffData = response; // { diff_summary, old_version, new_version, message? }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="mb-2">
        <Link 
          href={`/regulations/${id}/requirements`}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          &larr; Back to Requirements
        </Link>
      </div>

      {diffData.message ? (
        <div className="rounded-xl border border-zinc-800 bg-[#0a0a0c] p-12 text-center shadow-md mt-2">
          <h3 className="text-lg font-semibold text-zinc-100">Insufficient Version History</h3>
          <p className="mt-2 text-sm text-zinc-500">{diffData.message}</p>
        </div>
      ) : (
        <DiffViewer diffData={diffData} />
      )}
    </div>
  );
}

export default function DiffPage({ 
  params,
  searchParams,
}: { 
  params: { id: string },
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return (
    <DiffContent id={params.id} searchParams={searchParams} />
  );
}
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created {path}")

