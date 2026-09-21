import { getReports } from '@/lib/api';
import { ReportsGrid } from '@/components/reports/reports-grid';
import Link from 'next/link';

export const metadata = {
  title: 'Reports Library | RegCompiler',
  description: 'Generate, preview, and download formal compliance audit reports in Markdown and PDF.',
};

export default async function ReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const reportsData = await getReports(resolvedParams.id).catch(() => ({ data: [] }));
  const reports = reportsData.data || [];

  return (
    <div className="flex flex-col w-full w-full mx-auto">
      <div className="mb-4">
        <Link 
          href={`/regulations/${resolvedParams.id}/requirements`}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          &larr; Back to Requirements
        </Link>
      </div>
      <ReportsGrid regulationId={resolvedParams.id} initialReports={reports} />
    </div>
  );
}
