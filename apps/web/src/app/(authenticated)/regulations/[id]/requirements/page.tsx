import { Suspense } from 'react';
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
export default async function RequirementsPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  return (
    <RequirementsContent id={resolvedParams.id} searchParams={resolvedSearchParams as Record<string, string>} />
  );
}
