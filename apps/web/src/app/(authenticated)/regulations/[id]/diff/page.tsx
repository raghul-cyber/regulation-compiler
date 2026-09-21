import { Suspense } from 'react';
import Link from 'next/link';
import { getRegulationDiff } from '@/lib/api';
import { DiffViewer } from '@/components/diff/diff-viewer';

export const metadata = {
  title: 'Diff Engine | RegCompiler',
  description: 'Track semantic amendments, textual deltas, and cross-statute structural drift.',
};

async function DiffContent({ 
  id, 
  searchParams 
}: { 
  id: string, 
  searchParams: Record<string, string | string[] | undefined> | undefined 
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

export default async function DiffPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  return (
    <DiffContent id={resolvedParams.id} searchParams={resolvedSearchParams as any} />
  );
}
