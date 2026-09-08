import { Suspense } from 'react';
import Link from 'next/link';
import { getRequirements, getRegulation } from '@/lib/api';
import { FilterBar } from '@/components/requirements/filter-bar';
import { RequirementCard } from '@/components/requirements/requirement-card';
import { Shield, BookOpen, ExternalLink, ChevronRight, CheckCircle2, ArrowLeft } from 'lucide-react';

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

  const [reg, response] = await Promise.all([
    getRegulation(id).catch(() => null),
    getRequirements(id, params).catch(() => null)
  ]);

  const requirements = response?.data || [];
  const regName = reg?.name || 'Regulation Framework';
  const jurisdiction = reg?.jurisdiction || '';
  const sourceUrl = reg?.source_url || '';

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
        <Link href="/dashboard" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" />
          Dashboard
        </Link>
        <ChevronRight className="w-3 h-3 text-zinc-600" />
        <Link href="/regulations" className="hover:text-white transition-colors">
          Regulations Directory
        </Link>
        <ChevronRight className="w-3 h-3 text-zinc-600" />
        <span className="text-zinc-200 truncate max-w-xs">{regName}</span>
      </div>

      {/* Regulation Header Banner */}
      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {jurisdiction && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  {jurisdiction} Jurisdiction
                </span>
              )}
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Enforceable Ruleset
              </span>
              <span className="text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full">
                {requirements.length} Active Control{requirements.length !== 1 ? 's' : ''}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{regName}</h1>
            <p className="mt-2 text-sm text-zinc-400 max-w-3xl">
              Authentic statutory obligations decomposed into atomic machine-actionable conditions, actions, and verification standards.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {sourceUrl && sourceUrl.startsWith('http') && (
              <a 
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <span>Official Legal Text</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              </a>
            )}
          </div>
        </div>
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
          <Shield className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-zinc-100">No matching requirements found</h3>
          <p className="mt-2 text-sm text-zinc-500">Try adjusting your filters or search query.</p>
        </div>
      )}
    </div>
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
